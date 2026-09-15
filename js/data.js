/* ================= 数据与常量 ================= */
const CITY_AREAS = ['湖滨区','老城里','云栖区','江畔区','山北区','大学城'];

const BUDGETS = [{v:50,t:'≤50'},{v:100,t:'50-100'},{v:200,t:'100-200'},{v:999,t:'不限'}];
const DURS    = [{v:'half',t:'半天'},{v:'full',t:'全天'}];
const MATES   = [{v:'solo',t:'一个人'},{v:'duo',t:'2-3人'},{v:'crew',t:'4人+'}];
const PREFS   = [{v:'art',t:'文艺'},{v:'market',t:'烟火气'},{v:'show',t:'演出'},{v:'outdoor',t:'户外'},{v:'free',t:'免费'}];
const CATS    = [{v:'全部',t:'全部'},{v:'展览',t:'🎨 展览'},{v:'市集',t:'🛍 市集'},{v:'演出',t:'🎤 演出'},{v:'徒步',t:'🥾 徒步'},{v:'户外',t:'🍓 户外'}];

const NICKS = [['阿柚','🦊'],['小鹿','🦌'],['Momo','🐱'],['皮蛋','🐸'],['阿茶','🍵'],['Kevin','🐨'],['栗子','🐿'],['汤圆','🐡'],['一诺','🐰'],['大橘','🦁']];
const MEET_TIMES  = ['周六 10:00','周六 14:00','周六 18:30','周日 10:00','周日 14:00'];
const MEET_SPOTS  = ['市民广场地铁站 B口','美术馆正门','大学城北门公交站','江畔码头 3号口','老城钟楼下'];
const DEADLINES   = [{t:'1 小时后',ms:36e5},{t:'今晚 20:00',ms:null},{t:'明早 9:00',ms:null},{t:'24 小时内',ms:864e5}];
const PHOTOS      = ['📸','🌄','🍹','🍜','🎡','🐈','🌼','🎟️','🚇','🧋'];

const BADGES = [
  {id:'first',  t:'初次出发',  e:'🐣', d:'完成第一次打卡'},
  {id:'captain',t:'首任队长',  e:'⚓', d:'发起一次组队'},
  {id:'crew',   t:'成团快乐',  e:'🎉', d:'参与一次成功组队'},
  {id:'market', t:'市集猎人',  e:'🛍', d:'打卡 1 个市集'},
  {id:'art2',   t:'美术馆学者',e:'🎨', d:'打卡 2 个展览'},
  {id:'areas3', t:'三区点亮',  e:'🗺', d:'点亮 3 个城区'},
  {id:'areas5', t:'城市点亮者',e:'🌃', d:'点亮 5 个城区'},
];

/* cost: t=门票(学生价) f=往返交通 e=餐饮预估 */
const ACTIVITIES = [
  {id:'a1',t:'城市青年艺术祭 · 双年展',e:'🎨',cat:'展览',area:'湖滨区',dur:'half',
   metro:'地铁2号线 湖滨站 B1 · 步行5min',time:'周六日 10:00-17:00',daysLeft:9,hot:98,
   price:45,stu:25,cost:{t:25,f:8,e:20},indoor:true,prefs:['art'],
   tags:['出片','室内','学生票'],gone:false,
   desc:'12 位青年艺术家的装置与影像，三楼露台可俯瞰老城屋顶，周末限定导览 14:00 开始。',
   plan:'全馆室内，雨天照常；配套 café 与放映厅可躲雨耗一下午。'},
  {id:'a2',t:'江畔周末创意市集',e:'🛍',cat:'市集',area:'江畔区',dur:'half',
   metro:'地铁4号线 江畔码头站 C口 · 步行3min',time:'周六日 13:00-20:00',daysLeft:3,hot:95,
   price:0,stu:0,cost:{t:0,f:8,e:25},indoor:false,prefs:['market','free'],
   tags:['免费','烟火气','落日'],gone:false,
   desc:'80+ 摊位：手作首饰、中古相机、独立咖啡。19:00 后江边有落日与街头弹唱。',
   plan:'雨天顺延至下周末；可切换同商圈的「旧物交换放映会」（室内）。'},
  {id:'a3',t:'独立乐团 Livehouse「夏夜企划」',e:'🎤',cat:'演出',area:'老城里',dur:'half',
   metro:'地铁1号线 钟楼站 D口 · 步行6min',time:'周六 20:00-22:00',daysLeft:5,hot:92,
   price:120,stu:80,cost:{t:80,f:10,e:25},indoor:true,prefs:['show'],
   tags:['夜场','学生票','氛围'],gone:false,
   desc:'三支校园乐队 + 一支巡演嘉宾，站席可前排，结束后有签售。',
   plan:'室内场地，雨天无影响；记得带学生证取票。'},
  {id:'a4',t:'云栖山野轻徒步 · 8km 环线',e:'🥾',cat:'徒步',area:'云栖区',dur:'full',
   metro:'地铁3号线 云栖站 → 转郊野专线公交 2 站',time:'周六日 全天（建议 8:30 出发）',daysLeft:15,hot:88,
   price:0,stu:0,cost:{t:0,f:14,e:30},indoor:false,prefs:['outdoor','free'],
   tags:['免费','新手友好','观景台'],gone:false,
   desc:'缓坡土路为主，途经费三个观景台与一片竹林，山顶可看全城，全程约 3.5 小时。',
   plan:'遇雨自动切换「美术馆夜场 × 露台爵士」（室内演出）。'},
  {id:'a5',t:'老城胡同 Citywalk · 建筑漫游',e:'🚶',cat:'徒步',area:'老城里',dur:'half',
   metro:'地铁1号线 钟楼站 A口 集合',time:'周六日 9:30-12:30',daysLeft:7,hot:85,
   price:0,stu:0,cost:{t:0,f:6,e:20},indoor:false,prefs:['free','art'],
   tags:['免费','讲解','胶片感'],gone:false,
   desc:'2.5 小时走完 12 处百年建筑，志愿者讲解免费，终点是有猫的旧书店。',
   plan:'小雨照常（发雨衣）；大雨切换同路线「老城博物馆群」室内版。'},
  {id:'a6',t:'沉浸式戏剧《雾中车站》',e:'🎭',cat:'演出',area:'湖滨区',dur:'half',
   metro:'地铁2号线 湖滨站 D口 · 步行8min',time:'周六 15:00 / 19:30 两场',daysLeft:11,hot:90,
   price:88,stu:60,cost:{t:60,f:8,e:20},indoor:true,prefs:['show','art'],
   tags:['沉浸式','学生票','小剧场'],gone:false,
   desc:'观众随剧情在五个房间穿行，每人视角不同，二刷率极高。',
   plan:'全室内，雨天照常；提前 30 分钟到场选「角色信物」。'},
  {id:'a7',t:'美术馆夜场 × 露台爵士',e:'🎷',cat:'展览',area:'湖滨区',dur:'half',
   metro:'地铁2号线 湖滨站 B1 · 步行5min',time:'周六 18:00-21:30',daysLeft:6,hot:87,
   price:60,stu:45,cost:{t:45,f:8,e:25},indoor:true,prefs:['art','show'],
   tags:['夜场','live','微醺'],gone:false,
   desc:'夜场特展 + 露台爵士三重奏，学生饮品半价，适合拍照与约会。',
   plan:'露台有透明雨棚，雨天照常，反而更有氛围。'},
  {id:'a8',t:'近郊农场采摘 × 湖边野餐',e:'🍓',cat:'户外',area:'山北区',dur:'full',
   metro:'地铁5号线 山北站 → 农场接驳车 10min',time:'周六日 9:00-16:00',daysLeft:20,hot:80,
   price:50,stu:35,cost:{t:35,f:12,e:15},indoor:false,prefs:['outdoor'],
   tags:['采摘','野餐','亲子友好'],gone:false,
   desc:'草莓采摘带走出称重，湖边草坪可租野餐垫，下午有手作芝士体验。',
   plan:'雨天改为农场室内工坊：做果酱 + 烘焙，采摘券自动延期。'},
  {id:'a9',t:'旧物交换 × 天台放映会',e:'🎬',cat:'市集',area:'大学城',dur:'half',
   metro:'地铁6号线 大学城北站 A口 · 步行4min',time:'周六日 16:00-22:00',daysLeft:4,hot:83,
   price:0,stu:0,cost:{t:0,f:6,e:20},indoor:true,prefs:['market','free'],
   tags:['免费','交换','放映'],gone:false,
   desc:'带一件旧物换一个故事，20:00 天台放映胶片电影，提供蒲团与毛毯。',
   plan:'放映在天台；下雨移步一层室内厅，场次不变。'},
  {id:'a10',t:'溜冰场新手夜（含教学）',e:'⛸',cat:'户外',area:'江畔区',dur:'half',
   metro:'地铁4号线 江畔码头站 B口 · 商场 4F',time:'周六日 19:00-21:00',daysLeft:13,hot:78,
   price:60,stu:40,cost:{t:40,f:8,e:20},indoor:true,prefs:['outdoor','show'],
   tags:['新手友好','含教学','夜场'],gone:false,
   desc:'前 30 分钟教练带零基础教学，之后自由滑，现场 DJ，摔跤不丢人。',
   plan:'室内冰场，雨天照常；记得穿长袜。'},
];

const actById = id => ACTIVITIES.find(a => a.id === id);
const actTotal = a => a.cost.t + a.cost.f + a.cost.e;
/* 活动数据完毕 */

