/* ================= 工具 ================= */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const LS = {
  get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch(e){ return d } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
};
function toast(msg, ms=1800){
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(t._tm); t._tm = setTimeout(()=> t.hidden = true, ms);
}
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }

/* ================= 视图路由 ================= */
let CUR_VIEW = 'home';
function go(view){
  CUR_VIEW = view;
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'view-'+view));
  const tabMap = {detail:'explore', team:'trips', success:'trips', guide:'me'};
  const tab = tabMap[view] || view;
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.view === tab));
  $('#views').scrollTop = 0;
}
$$('#tabbar button').forEach(b => b.addEventListener('click', () => {
  go(b.dataset.view);
  if(b.dataset.view==='explore') renderExplore();
  if(b.dataset.view==='trips')   renderTrips();
  if(b.dataset.view==='me')      renderMe();
}));

/* ================= chips 渲染 ================= */
function renderChips(elId, list, cur, multi=false, onChange){
  const box = $('#'+elId); box.innerHTML = '';
  list.forEach(o => {
    const b = document.createElement('button');
    b.className = 'chip' + ((multi ? cur.includes(o.v) : cur===o.v) ? ' on':'');
    b.textContent = o.t;
    b.onclick = () => {
      if(multi){
        const i = cur.indexOf(o.v);
        i>-1 ? cur.splice(i,1) : cur.push(o.v);
        if(!cur.length) cur.push(list[0].v);
      }else{
        cur.length = 0; cur.push(o.v);
      }
      renderChips(elId, list, cur, multi, onChange);
      onChange && onChange();
    };
    box.appendChild(b);
  });
}

/* ================= 首页：条件式推荐 ================= */
const sel = { budget:['100'], dur:['half'], mates:['duo'], pref:['art','market'] };
renderChips('chip-budget', BUDGETS, sel.budget);
renderChips('chip-dur',    DURS,    sel.dur);
renderChips('chip-mates',  MATES,   sel.mates);
renderChips('chip-pref',   PREFS,   sel.pref, true);

$('#btn-plan').addEventListener('click', genPlans);

function scoreAct(a){
  const budget = +sel.budget[0];
  let s = a.hot/25;                                   // 基础热度
  if(actTotal(a) <= budget) s += 4; else if(actTotal(a) <= budget+40) s += 1; else s -= 6;
  if(a.dur === sel.dur[0]) s += 2; else s -= 1;
  if(a.prefs.includes('free') && sel.pref.includes('free')) s += 3;
  sel.pref.forEach(p => { if(a.prefs.includes(p)) s += 2.5; });
  if(a.gone) s -= 99;
  return s;
}
function genPlans(){
  const budget = +sel.budget[0];
  const ranked = ACTIVITIES.filter(a=>!a.gone).map(a=>({a, s:scoreAct(a)}))
    .sort((x,y)=>y.s-x.s).slice(0,3);
  const box = $('#plan-list');
  const durTxt  = DURS.find(d=>d.v===sel.dur[0]).t;
  const matesN  = {solo:1, duo:2, crew:4}[sel.mates[0]];
  let html = `<p class="plan-sum">📋 为你规划 <b>${ranked.length}</b> 个方案 · ${esc(durTxt)} · ${matesN===1?'独自出发':matesN+'人以上同行'}${budget<999?` · 人均预算 ≤${budget}元`:''} · 周日有雨已备 Plan B</p>`;
  ranked.forEach(({a},i) => {
    const whys = [];
    if(actTotal(a)<=budget) whys.push(`总花费 ${actTotal(a)} 元在预算内`);
    if(a.stu && a.stu<a.price) whys.push(`学生票 ${a.stu} 元（原价 ${a.price}）`);
    if(a.dur===sel.dur[0]) whys.push(`正好${a.dur==='half'?'半天':'一天'}的体量`);
    const hit = a.prefs.filter(p=>sel.pref.includes(p));
    if(hit.length) whys.push(`命中你的「${hit.map(p=>PREFS.find(x=>x.v===p).t).join('/')}」偏好`);
    if(a.cost.t===0) whys.push('全程免门票');
    html += `
    <div class="plan-card">
      <div class="plan-top">
        <div class="plan-emoji">${a.e}</div>
        <div class="plan-info">
          <h3>${i===0?'🔥 ':''}${esc(a.t)}</h3>
          <div class="plan-meta">
            ${a.tags.map(t=>`<span class="tag${t==='免费'?' free':''}">${esc(t)}</span>`).join('')}
            <span class="tag">🚇 ${esc(a.metro.split('·')[0])}</span>
            <span class="tag rain">☂ 雨天Plan B</span>
          </div>
        </div>
      </div>
      <div class="plan-cost">
        <span>人均总花费 <b>¥${actTotal(a)}</b></span>
        <span>🎫${a.cost.t} 🚇${a.cost.f} 🍜${a.cost.e}</span>
        <span>⏳还剩${a.daysLeft}天</span>
      </div>
      <div class="plan-why">✅ ${whys.slice(0,3).join(' · ')}<br>☂️ Plan B：${esc(a.plan)}</div>
      <div class="plan-acts">
        <button class="btn ghost" onclick="renderDetail('${a.id}')">看详情</button>
        <button class="btn main" onclick="openCreateTeam('${a.id}')">发起组队</button>
      </div>
    </div>`;
  });
  box.innerHTML = html;
  go('home');
  toast('已生成 3 个方案，周日的雨天 Plan B 已备好 ☂️');
}

/* ========== 活动库 ========== */
let expCat='全部', expSort='hot';
function renderExplore(){
  $('#explore-sub').textContent = `本周 ${ACTIVITIES.filter(a=>!a.gone).length} 个有效活动`;
  $('#chip-cat').innerHTML = CATS.map(c=>`<button class="chip${expCat===c.v?' on':''}" onclick="expCat='${c.v}';renderExplore()">${c.t}</button>`).join('');
  $$('.sort-btn').forEach(b=>b.classList.toggle('on', b.dataset.sort===expSort));
  let list = ACTIVITIES.filter(a => expCat==='全部' || a.cat===expCat);
  if(expSort==='price') list=[...list].sort((x,y)=>actTotal(x)-actTotal(y));
  if(expSort==='end')   list=[...list].sort((x,y)=>x.daysLeft-y.daysLeft);
  if(expSort==='hot')   list=[...list].sort((x,y)=>y.hot-x.hot);
  $('#act-list').innerHTML = list.map(a=>`
    <button class="act-card" onclick="renderDetail('${a.id}')">
      <div class="act-emoji">${a.e}</div>
      <div class="act-info">
        <h3>${a.gone?'<s>':''}${esc(a.t)}${a.gone?'</s>':''}</h3>
        <p class="act-sub">📍${esc(a.area)} · ${esc(a.metro)}<br>⏳ ${a.gone?'已被伙伴反馈结束':`还剩 ${a.daysLeft} 天`} · ${esc(a.time)}</p>
        <p class="act-price"><b>人均 ¥${actTotal(a)}</b>${a.stu?`<s>票面 ¥${a.price}</s>`:''}${a.cost.t===0?' <span class="tag free">免门票</span>':''}</p>
      </div>
    </button>`).join('') || '<p class="empty">该分类暂无活动</p>';
}
$$('.sort-btn').forEach(b=>b.addEventListener('click',()=>{ expSort=b.dataset.sort; renderExplore(); }));

/* ========== 活动详情 ========== */
const FAV_KEY='cet_fav';
function renderDetail(id){
  const a=actById(id); if(!a) return;
  const fav=LS.get(FAV_KEY,[]);
  $('#view-detail').innerHTML=`
   <button class="back" onclick="go('explore');renderExplore()">‹ 返回</button>
   <div class="det-hero"><div class="big">${a.e}</div><h2>${esc(a.t)}</h2>
     <div class="plan-meta" style="justify-content:center;margin-top:8px">${a.tags.map(t=>`<span class="tag${t==='免费'?' free':''}">${esc(t)}</span>`).join('')}</div></div>
   <div class="card">
     <p class="c-t">ℹ️ 活动信息</p>
     <div class="det-rows">
       <p>🗓 ${esc(a.time)}（还剩 ${a.daysLeft} 天）</p>
       <p>📍 ${esc(a.area)} · ${esc(a.metro)}</p>
       <p>📝 ${esc(a.desc)}</p>
     </div>
     <div class="cost-table">
       <p><span>🎫 门票（学生价）</span><span>${a.stu?`<b>¥${a.stu}</b> <s>票面¥${a.price}</s>`:`<b>${a.price?'¥'+a.price:'免费'}</b>`}</span></p>
       <p><span>🚇 往返交通</span><b>¥${a.cost.f}</b></p>
       <p><span>🍜 餐饮预估</span><b>¥${a.cost.e}</b></p>
       <p><span>💰 人均总花费</span><b class="big-c">¥${actTotal(a)}</b></p>
     </div>
     <p class="meet-plan" style="margin-top:10px">☂️ 雨天 Plan B：${esc(a.plan)}</p>
   </div>
   <div class="card">
     <p class="c-t">👀 时效性反馈（伙伴共建）</p>
     <p style="font-size:12.5px;color:var(--ink2);line-height:1.6">今天去过？帮大家确认一下信息是否还有效 👇</p>
     <div style="display:flex;gap:8px;margin-top:10px">
       <button class="btn sm green" ${a.gone?'disabled':''} onclick="feedback('${a.id}',true)">✅ 还在进行</button>
       <button class="btn sm ghost" ${a.gone?'disabled':''} onclick="feedback('${a.id}',false)">⛔ 已结束</button>
     </div>
     ${a.gone?'<p class="tag hot" style="margin-top:10px;display:inline-block">已被伙伴反馈结束，看看别的吧 →</p>':''}
   </div>
   <div class="det-acts">
     <button class="btn ghost" style="flex:1" onclick="toggleFav('${id}')">${fav.includes(id)?'❤️ 已收藏':'🤍 收藏'}</button>
     <button class="btn main" style="flex:2" onclick="openCreateTeam('${id}')">🚩 发起组队 · 拼单式凑人</button>
   </div>`;
  go('detail');
}
function feedback(id,alive){
  actById(id).gone = !alive;
  toast(alive?'谢谢确认，信息已更新 🙏':'已标记结束，为你推荐同类替代 →');
  renderDetail(id);
  if(!alive) setTimeout(()=>{ go('explore'); renderExplore(); }, 1000);
}
function toggleFav(id){
  const f=LS.get(FAV_KEY,[]), i=f.indexOf(id);
  i>-1 ? f.splice(i,1) : f.push(id);
  LS.set(FAV_KEY,f); renderDetail(id);
}

/* ========== 我的：足迹 / 徽章 / 打卡 ========== */
const CK_KEY='cet_checkins', BD_KEY='cet_badges';
const allCheckins = () => LS.get(CK_KEY, []);
function earnBadge(id){
  const bs = LS.get(BD_KEY, []);
  if(bs.includes(id)) return;
  bs.push(id); LS.set(BD_KEY, bs);
  const b = BADGES.find(x=>x.id===id);
  if(b) toast(`🎖 解锁徽章「${b.t}」${b.e}`, 2400);
}
function renderMe(){
  const cks = allCheckins();
  const areas = new Set(cks.map(c=>c.area));
  const bs = LS.get(BD_KEY, []);
  $('#me-stats').innerHTML = `
    <div class="stat"><b>${cks.length}</b><span>打卡足迹</span></div>
    <div class="stat"><b>${areas.size}</b><span>点亮城区</span></div>
    <div class="stat"><b>${bs.length}/${BADGES.length}</b><span>徽章</span></div>
    <div class="stat"><b>${getTeams().length}</b><span>发起组队</span></div>`;
  $('#map-grid').innerHTML = CITY_AREAS.map(ar=>
    `<div class="map-cell${areas.has(ar)?' lit':''}">${areas.has(ar)?'📍 ':''}${ar}</div>`).join('');
  $('#badge-wall').innerHTML = BADGES.map(b=>
    `<div class="badge${bs.includes(b.id)?' lit':''}"><b>${b.e}</b><span>${b.t}</span></div>`).join('');
  $('#checkin-list').innerHTML = cks.length ? cks.map(c=>`
    <div class="ck-item"><span style="font-size:24px">${c.emoji}</span>
      <div style="flex:1;min-width:0"><b style="font-size:13.5px">${esc(c.title)}</b>
        <p style="color:var(--ink2);font-size:11.5px;margin-top:3px">${'⭐'.repeat(c.star)}${'☆'.repeat(5-c.star)} · 实花 ¥${c.spend} · ${esc(c.note||'')}</p></div>
      <button class="btn sm ghost" onclick="renderGuide('${c.id}')">生成攻略</button>
    </div>`).join('') : '<p class="empty">还没有足迹 🥚<br>去「活动库」发起一局，成团打卡点亮城市吧！</p>';
}

/* ---------- 到场打卡 ---------- */
function openCheckin(teamId){
  const t = teamById(teamId); if(!t) return;
  const a = actById(t.actId);
  const ck = { id:'C'+Date.now().toString(36), teamId, actId:a.id, emoji:a.e, title:a.t,
    area:a.area, metro:a.metro, meetTime:t.meetTime, star:5, spend:actTotal(a),
    note:'', photos:['📸','🌄'], ts:Date.now() };
  window.CK = {
    ck,
    draw(){
      $('#modal').innerHTML = `
      <button class="m-close" onclick="closeModal()">✕</button>
      <p class="m-t">📍 到场打卡 · ${a.e}</p>
      <p class="m-sub">打卡将点亮「${esc(a.area)}」并沉淀为你的探索足迹 ✨</p>
      <div class="f-row"><label>⭐ 体验</label><div class="chips">${[5,4,3].map(n=>`<button class="chip${ck.star===n?' on':''}" onclick="CK.ck.star=${n};CK.draw()">${'⭐'.repeat(n)}</button>`).join('')}</div></div>
      <div class="f-row"><label>💰 实花</label><input class="ipt" id="ck-spend" type="number" value="${ck.spend}" style="max-width:100px"/></div>
      <div class="f-row"><label>📝 一句话</label><input class="ipt" id="ck-note" placeholder="例：露台爵士yyds，学生饮品半价" maxlength="30"/></div>
      <div class="f-row"><label>📷 照片</label><div class="chips">${PHOTOS.map(p=>`<button class="chip${ck.photos.includes(p)?' on':''}" onclick="CK.tog('${p}')">${p}</button>`).join('')}</div></div>
      <button class="btn main block" style="margin-top:12px" onclick="CK.submit()">✅ 打卡，点亮足迹</button>`;
    },
    tog(p){ const i=ck.photos.indexOf(p); if(i>-1) ck.photos.splice(i,1); else if(ck.photos.length<6) ck.photos.push(p); this.draw(); },
    submit(){
      ck.spend = +$('#ck-spend').value || ck.spend;
      ck.note  = $('#ck-note').value.trim();
      const list = allCheckins(); list.unshift(ck); LS.set(CK_KEY, list);
      saveTeams(getTeams().map(x=>{ if(x.id===teamId){ x.status='done'; } return x; }));
      earnBadge('first');
      if(a.cat==='市集') earnBadge('market');
      if(allCheckins().filter(c=>actById(c.actId) && actById(c.actId).cat==='展览').length>=2) earnBadge('art2');
      const areas = new Set(allCheckins().map(c=>c.area));
      if(areas.size>=3) earnBadge('areas3');
      if(areas.size>=5) earnBadge('areas5');
      closeModal(); go('me'); renderMe();
      toast(`📍 已点亮「${a.area}」！足迹 +1`);
    }
  };
  CK.draw(); openModal();
}

/* ---------- 攻略卡片（打卡数据自动生成） ---------- */
function renderGuide(cid){
  const c = allCheckins().find(x=>x.id===cid); if(!c) return;
  const d = new Date(c.ts);
  $('#view-guide').innerHTML = `
   <button class="back" onclick="go('me');renderMe()">‹ 返回</button>
   <div class="g-card">
     <p class="g-tag">—— 城市探索攻略 · 由打卡数据自动生成 ——</p>
     <div style="text-align:center;margin:12px 0 4px"><span style="font-size:46px">${c.emoji}</span>
       <h2 style="margin-top:6px;font-size:19px">${esc(c.title)}</h2>
       <p style="font-size:12px;color:var(--ink2);margin-top:5px">📍${esc(c.area)} · 🚇${esc(c.metro.split('·')[0])} · ⏰${esc(c.meetTime)} 集合</p></div>
     <p class="g-sec">💰 真实花费</p><p class="g-line">人均 ¥${c.spend}（门票+交通+吃喝，真实数据，非滤镜）</p>
     <p class="g-sec">📷 现场留影</p><p class="g-line" style="font-size:26px;letter-spacing:6px">${c.photos.join('')}</p>
     <p class="g-sec">⭐ 体验</p><p class="g-line">${'⭐'.repeat(c.star)}${'☆'.repeat(5-c.star)}　${esc(c.note||'值得一来')}</p>
     <p class="g-sec">💡 避坑提示</p><p class="g-line">带好学生证能省钱；下雨别慌有 Plan B；集合别迟到，队友会饿 🍜</p>
     <p class="g-foot">— 周末城市探索指南 · ${d.getMonth()+1}月${d.getDate()}日 —</p>
   </div>
   <button class="btn main block" style="margin-top:10px" onclick="toast('攻略卡片已生成，可分享到朋友圈 💌')">📤 分享这张攻略卡</button>`;
  go('guide');
}

/* ---------- Modal 开关 & 初始化 ---------- */
function openModal(){ $('#modal').hidden=false; $('#modal-mask').hidden=false; }
function closeModal(){ $('#modal').hidden=true; $('#modal-mask').hidden=true; }
$('#modal-mask').addEventListener('click', closeModal);
$('#sheet-mask').addEventListener('click', closeShare);
$('#sheet-close').addEventListener('click', closeShare);
renderExplore();

