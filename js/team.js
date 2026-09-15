/* ================= 组队（拼单式） ================= */
const TEAM_KEY = 'cet_teams';
const getTeams  = () => LS.get(TEAM_KEY, []);
const saveTeams = ts => LS.set(TEAM_KEY, ts);
const teamById  = id => getTeams().find(t => t.id === id);

function sessionId(){
  let s = sessionStorage.getItem('cet_sid');
  if(!s){ s = 'S'+Math.random().toString(36).slice(2,9); sessionStorage.setItem('cet_sid', s); }
  return s;
}
/* 本标签页身份：每个新窗口＝一位新好友 */
function myIdentity(){
  let me = null;
  try{ me = JSON.parse(sessionStorage.getItem('cet_me')) }catch(e){}
  if(!me){
    const [n,e] = NICKS[Math.floor(Math.random()*NICKS.length)];
    me = {name:n, emoji:e};
    sessionStorage.setItem('cet_me', JSON.stringify(me));
  }
  return me;
}
function setMyName(n){ const me=myIdentity(); me.name=n||me.name; sessionStorage.setItem('cet_me',JSON.stringify(me)); }

/* ---------- 发起组队（表单弹层） ---------- */
function openCreateTeam(actId){
  const a = actById(actId); if(!a) return;
  const f = { actId, time:MEET_TIMES[0], spot:MEET_SPOTS[0], need:4, dl:DEADLINES[0] };
  const draw = () => `
    <button class="m-close" onclick="closeModal()">✕</button>
    <p class="m-t">🚩 发起组队</p>
    <p class="m-sub">${a.e} ${esc(a.t)}</p>
    <div class="f-row"><label>⏰ 集合时间</label><div class="chips">${MEET_TIMES.map(t=>`<button class="chip${f.time===t?' on':''}" onclick="CT.f.time='${t}';CT.draw()">${t}</button>`).join('')}</div></div>
    <div class="f-row"><label>📍 集合地点</label><div class="chips">${MEET_SPOTS.map(s=>`<button class="chip${f.spot===s?' on':''}" onclick="CT.f.spot='${s}';CT.draw()">${s}</button>`).join('')}</div></div>
    <div class="f-row"><label>👥 成团人数</label>
      <div class="stepper">
        <button onclick="CT.f.need=Math.max(2,CT.f.need-1);CT.draw()">－</button><b>${f.need} 人</b>
        <button onclick="CT.f.need=Math.min(8,CT.f.need+1);CT.draw()">＋</button>
      </div>
    </div>
    <div class="f-row"><label>⏳ 截止</label><div class="chips">${DEADLINES.map(d=>`<button class="chip${f.dl.t===d.t?' on':''}" onclick="CT.f.dl=${JSON.stringify(d).replace(/"/g,'&quot;')};CT.draw()">${d.t}</button>`).join('')}</div></div>
    <div class="f-row"><label>🙋 我的名字</label><input id="my-name" class="ipt" value="${esc(myIdentity().name)}" maxlength="8"/></div>
    <div class="m-cost">💰 人均预估 <b>¥${actTotal(a)}</b>（🎫${a.cost.t} 🚇${a.cost.f} 🍜${a.cost.e}）· ☂️ 雨天已备 Plan B</div>
    <button class="btn main block" onclick="CT.submit()">🚩 发起，去邀请好友</button>`;
  window.CT = {
    f, draw(){ $('#modal').innerHTML = draw(); },
    submit(){
      setMyName($('#my-name') ? $('#my-name').value.trim() : '');
      const me = myIdentity(), sid = sessionId();
      let dlMs = f.dl.ms;
      if(dlMs == null){
        const target = f.dl.t.includes('今晚') ? new Date().setHours(20,0,0,0)
                                                : new Date(Date.now()+864e5).setHours(9,0,0,0);
        dlMs = target - Date.now();
        if(dlMs < 6e4) dlMs = 864e5;
      }
      const team = {
        id:'T'+Date.now().toString(36), actId:f.actId, need:f.need,
        meetTime:f.time, meetSpot:f.spot, createdAt:Date.now(),
        deadline:Date.now()+Math.max(dlMs,6e4),
        creator:{name:me.name, emoji:me.emoji, sid},
        members:[{name:me.name, emoji:me.emoji, sid, ts:Date.now(), role:'队长'}],
        status:'recruiting', checked:[]
      };
      const ts = getTeams(); ts.unshift(team); saveTeams(ts);
      earnBadge('captain');
      closeModal(); renderTeam(team.id);
      toast('组队已发起！把邀请卡甩到群里 🙌');
    }
  };
  CT.draw(); openModal();
}

/* ---------- 组队页 ---------- */
let TEAM_TIMER = null;
function renderTeam(id){
  clearInterval(TEAM_TIMER);
  const t = teamById(id);
  if(!t){ go('trips'); renderTrips(); return; }
  const a = actById(t.actId);
  const joined = t.members.some(m => m.sid === sessionId());
  const left = t.need - t.members.length;
  const slots = [...t.members, ...Array(Math.max(left,0)).fill(null)].slice(0, Math.max(t.need, t.members.length));
  const stateTxt = {recruiting:'🔥 招募中', success:'✅ 已成团', expired:'⌛ 已过期', done:'🏁 已完成'}[t.status];
  $('#view-team').innerHTML = `
   <button class="back" onclick="go('trips');renderTrips()">‹ 返回行程</button>
   <div class="card team-act" onclick="renderDetail('${a.id}')">
     <div class="plan-emoji">${a.e}</div>
     <div class="plan-info"><h3>${esc(a.t)}</h3>
       <p class="team-sub">👤 ${esc(t.creator.name)} 发起的局 · ${esc(t.meetTime)} 集合 · 点卡片看活动详情</p></div>
   </div>
   <div class="card">
     <div class="crew-head">
       <p class="c-t" style="margin:0">👥 组队进度 <b class="${left<=0?'ok':''}">${t.members.length}/${t.need}</b></p>
       <span class="tag${(t.status==='success'||t.status==='done')?' free':'hot'}">${stateTxt}</span>
     </div>
     <div class="crew">${slots.map(m => m
       ? `<div class="member pop"><span class="avatar" style="background:${avColor(m.sid)}">${m.emoji}</span><i>${esc(m.name)}${m.sid===sessionId()?'·我':''}</i>${m.role?`<em>${m.role}</em>`:''}</div>`
       : `<div class="member empty"><span class="avatar">＋</span><i>等你来</i></div>`).join('')}
     </div>
     <div class="progress"><i style="width:${Math.min(100, t.members.length/t.need*100)}%"></i></div>
     <p class="crew-hint">${t.status==='success' ? '🎉 人齐了！准时集合，别放鸽子～'
        : `还差 <b>${left}</b> 人成团 · ${joined ? '把邀请卡甩到群里吧 🙌' : '加入后拉上好友一起'}`}</p>
     ${t.status==='recruiting' ? `<p class="cd" id="cd" style="margin-top:9px"></p>` : ''}
   </div>
   <div class="card meet">
     <p class="c-t">📌 集合信息</p>
     <p>⏰ ${esc(t.meetTime)} ｜ 📍 ${esc(t.meetSpot)}</p>
     <p>💰 人均预估 ¥${actTotal(a)}（含交通餐饮）</p>
     <p class="meet-plan">☂️ 雨天 Plan B：${esc(a.plan)}</p>
   </div>
   <div class="card">
     <p class="c-t">💬 加入动态</p>
     <ul class="feed">${[...t.members].reverse().map(m =>
       `<li><span>${m.emoji}</span><b>${esc(m.name)}</b> ${m.role?'发起了组队':'加入了组队'}<i>${ago(m.ts)}</i></li>`).join('')}</ul>
   </div>
   <div class="team-acts">
     ${t.status==='recruiting' && !joined ? `<button class="btn green block" onclick="joinTeam('${t.id}')">🙋 我要加入（${a.stu?'学生票 ¥'+a.stu:'免费活动'}）</button>` : ''}
     ${joined && t.status==='recruiting' ? `<button class="btn main block" onclick="openShare('${t.id}')">🤝 邀请好友加入</button>` : ''}
     ${t.status==='recruiting' ? `<button class="btn ghost block" onclick="simulateFriend('${t.id}')">🤖 模拟一位好友加入（演示用）</button>` : ''}
     ${(t.status==='success'||t.status==='done') ? `<button class="btn ${t.status==='done'?'ghost':'green'} block" ${t.status==='done'?'disabled':''} onclick="openCheckin('${t.id}')">${t.status==='done'?'✅ 本局已打卡':'📍 到场打卡 · 点亮足迹'}</button>` : ''}
   </div>`;
  go('team');
  if(t.status==='recruiting') tickCd(t.id);
}
function tickCd(id){
  const up = () => {
    const t = teamById(id);
    if(!t || CUR_VIEW!=='team'){ clearInterval(TEAM_TIMER); return; }
    if(t.status!=='recruiting'){ clearInterval(TEAM_TIMER); return; }
    const el = $('#cd');
    if(!el) return;
    const d = t.deadline - Date.now();
    if(d<=0){
      t.status='expired';
      saveTeams(getTeams().map(x=>x.id===id?t:x));
      renderTeam(id); toast('⌛ 截止时间到，这局没成团，下次再约！');
      return;
    }
    const h=String(Math.floor(d/36e5)).padStart(2,'0'),
          m=String(Math.floor(d%36e5/6e4)).padStart(2,'0'),
          s=String(Math.floor(d%6e4/1e3)).padStart(2,'0');
    el.textContent = `⏳ ${h}:${m}:${s} 后截止，人满立即成团`;
  };
  clearInterval(TEAM_TIMER); TEAM_TIMER = setInterval(up, 1000); up();
}
function ago(ts){
  const s = Math.floor((Date.now()-ts)/1000);
  if(s<60) return '刚刚';
  if(s<3600) return Math.floor(s/60)+' 分钟前';
  return Math.floor(s/3600)+' 小时前';
}
const avColor = sid => { let h=0; for(const c of sid) h=(h*31+c.charCodeAt(0))%360; return `hsl(${h} 65% 85%)`; };

/* ---------- 加入 / 模拟好友加入 ---------- */
function joinTeam(id){
  const ts = getTeams();
  const t = ts.find(x=>x.id===id);
  if(!t || t.status!=='recruiting') return;
  if(t.members.some(m=>m.sid===sessionId())) return;
  const me = myIdentity();
  t.members.push({name:me.name, emoji:me.emoji, sid:sessionId(), ts:Date.now()});
  saveTeams(ts);
  toast(`🎉 ${me.emoji} ${me.name} 加入了组队！`);
  afterMemberChange(t);
}
function simulateFriend(id){
  const ts = getTeams();
  const t = ts.find(x=>x.id===id);
  if(!t || t.status!=='recruiting') return;
  const used = t.members.map(m=>m.name);
  const pool = NICKS.filter(n=>!used.includes(n[0]));
  const src = pool.length ? pool : NICKS;
  const [n,e] = src[Math.floor(Math.random()*src.length)];
  t.members.push({name:n, emoji:e, sid:'S'+Math.random().toString(36).slice(2,9), ts:Date.now()});
  saveTeams(ts);
  toast(`${e} ${n} 通过邀请链接加入了组队！`);
  afterMemberChange(t);
}
function afterMemberChange(t){
  if(t.members.length >= t.need){
    t.status = 'success';
    saveTeams(getTeams().map(x=>x.id===t.id ? t : x));
    earnBadge('crew');
    setTimeout(()=>renderSuccess(t.id), 650);
  }else{
    renderTeam(t.id);
  }
}

/* ---------- 成团成功页 ---------- */
function renderSuccess(id){
  const t = teamById(id); if(!t) return;
  const a = actById(t.actId);
  $('#view-success').innerHTML = `
   <div class="success-hero">
     <span class="big">🎉</span>
     <h2>成团成功！</h2>
     <p>「${esc(a.t)}」· ${t.need} 人小队已就位，出发！</p>
   </div>
   <div class="card suc-card">
     <p class="c-t">📌 集合信息（已同步给全体队员）</p>
     <p class="srow"><span>⏰ 集合时间</span><b>${esc(t.meetTime)}</b></p>
     <p class="srow"><span>📍 集合地点</span><b>${esc(t.meetSpot)}</b></p>
     <p class="srow"><span>💰 人均预估</span><b>¥${actTotal(a)}</b></p>
     <p class="srow"><span>☂️ 下雨怎么办</span><b>已备 Plan B</b></p>
   </div>
   <div class="card">
     <p class="c-t">👥 本队成员（${t.members.length}）</p>
     <div class="crew">${t.members.map(m=>`<div class="member pop"><span class="avatar" style="background:${avColor(m.sid)}">${m.emoji}</span><i>${esc(m.name)}</i>${m.role?`<em>${m.role}</em>`:''}</div>`).join('')}</div>
   </div>
   <div class="suc-acts">
     <button class="btn ghost" onclick="toast('⏰ 已设置提醒：${esc(t.meetTime)} ${esc(t.meetSpot)}')">⏰ 日历提醒</button>
     <button class="btn main" onclick="openCheckin('${t.id}')">📍 到场打卡</button>
   </div>
   <button class="btn ghost block" style="margin-top:10px" onclick="go('trips');renderTrips()">‹ 回到我的行程</button>`;
  go('success');
  confetti();
}

/* ---------- 分享面板（微信拼单式邀请） ---------- */
let SHARE_TEAM_ID = null;
function openShare(id){
  SHARE_TEAM_ID = id;
  $('#invite-card').hidden = true;
  $('#sheet-mask').hidden = false;
  $('#share-sheet').hidden = false;
}
function closeShare(){
  $('#sheet-mask').hidden = true;
  $('#share-sheet').hidden = true;
}
$$('.share-grid button').forEach(b=>b.addEventListener('click', ()=>{
  const t = teamById(SHARE_TEAM_ID); if(!t) return;
  const a = actById(t.actId);
  const act = b.dataset.share;
  if(act==='card'){
    const ic = $('#invite-card');
    ic.hidden = false;
    ic.innerHTML = `<div class="ic-in"><div class="ic-cover">${a.e}</div>
      <div style="flex:1;min-width:0"><p class="ic-t">【还差 ${t.need-t.members.length} 人成团】${esc(a.t)}</p>
      <p class="ic-d">${esc(t.meetTime)} · ${esc(t.meetSpot)} · 人均约 ¥${actTotal(a)}</p></div></div>
      <p style="font-size:10.5px;color:#9a9a9a;margin-top:6px;text-align:center">↑ 微信聊天卡片预览（Demo 模拟）</p>`;
    return;
  }
  if(act==='link'){
    const url = location.href.split('#')[0] + '#join=' + t.id;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(()=>toast('🔗 邀请链接已复制，发给好友即可加入'));
    }else{
      window.prompt('复制下面的邀请链接发给好友：', url);
    }
    return;
  }
  toast(act==='wx' ? '💬 已（模拟）转发给微信好友，等 TA 加入吧' : '🟢 已（模拟）分享到朋友圈');
}));

/* ---------- 撒花动画 ---------- */
function confetti(){
  const cv = $('#confetti'), ctx = cv.getContext('2d');
  cv.width = cv.offsetWidth; cv.height = cv.offsetHeight;
  const colors = ['#ff6b35','#ffb98f','#07c160','#ffd166','#4d96ff'];
  const ps = Array.from({length:90}, ()=>({
    x:Math.random()*cv.width, y:-20-Math.random()*cv.height*.6,
    r:4+Math.random()*5, c:colors[Math.floor(Math.random()*colors.length)],
    vy:2+Math.random()*3.5, vx:-1.5+Math.random()*3,
    rot:Math.random()*Math.PI, vr:-.2+Math.random()*.4
  }));
  const t0 = Date.now();
  (function frame(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle=p.c; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*1.6); ctx.restore();
    });
    if(Date.now()-t0 < 2600) requestAnimationFrame(frame);
    else ctx.clearRect(0,0,cv.width,cv.height);
  })();
}

/* ---------- 我的行程列表 ---------- */
function renderTrips(){
  const ts = getTeams();
  $('#trip-list').innerHTML = ts.length ? ts.map(t=>{
    const a = actById(t.actId);
    const stateTxt = {recruiting:'🔥 招募中', success:'✅ 已成团', expired:'⌛ 已过期', done:'🏁 已完成'}[t.status];
    return `<button class="act-card" onclick="renderTeam('${t.id}')">
      <div class="act-emoji">${a.e}</div>
      <div class="act-info">
        <h3>${esc(a.t)}</h3>
        <p class="act-sub">⏰ ${esc(t.meetTime)} · 📍 ${esc(t.meetSpot)}<br>👤 ${esc(t.creator.name)} 发起 · ${t.members.length}/${t.need} 人已加入</p>
        <div class="trip-state"><span class="tag hot">${stateTxt}</span>
          <span>${t.status==='recruiting' ? `还差 ${t.need-t.members.length} 人成团` : (t.status==='success' ? '人已齐，记得打卡！' : '点击查看详情')}</span></div>
      </div>
    </button>`;
  }).join('') : `<p class="empty">还没有组队 🫥<br>去活动库挑一个喜欢的，<br>像「拼单」一样凑齐你的周末小队！<br><br>
    <button class="btn main sm" onclick="go('explore');renderExplore()">🔍 去逛活动库</button></p>`;
}

/* ---------- 跨标签页实时同步（好友加入 → 本页刷新） ---------- */
let CUR_TEAM = null;
const __renderTeam = renderTeam;
renderTeam = function(id){ CUR_TEAM = id; __renderTeam(id); };
window.addEventListener('storage', e=>{
  if(e.key !== TEAM_KEY) return;
  const t = teamById(CUR_TEAM);
  if(!t) return;
  if(t.status==='success' && CUR_VIEW!=='success'){
    earnBadge('crew'); renderSuccess(t.id);
  }else if(CUR_VIEW==='team'){
    renderTeam(t.id);
  }else if(CUR_VIEW==='trips'){
    renderTrips();
  }
});

/* ---------- 好友从邀请链接落地 ---------- */
(function initJoinLink(){
  const m = location.hash.match(/join=(T\w+)/);
  if(m && teamById(m[1])){
    renderTeam(m[1]);
    setTimeout(()=>toast('👋 你收到了好友的组队邀请！'), 400);
  }
})();



