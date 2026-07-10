const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
if (!NVIDIA_API_KEY) console.warn('⚠️ NVIDIA_API_KEY 未设置');

// ================================================================
// ⏱️ 时间系统
// ================================================================
const CONFIG = { REAL_MINUTES_PER_DAY: 24, START_DATE: new Date(2024, 0, 1) };

const MOVE_IN_DAY = {
  '裴金': 1, '墨迹淡': 1, '和田兰': 1,
  '雨沫': 2, '赵思琪': 2, '唐吉柯德': 2,
  '墨尾': 15
};

const WORK_CONFIG = {
  '裴金': { type: '在家办公', incomePerHour: 80, description: '正在做线上咨询' },
  '墨迹淡': { type: '在家', incomePerHour: 0 },
  '和田兰': { start: 10, end: 19, type: '上班', incomePerHour: 60, description: '在绘本馆工作' },
  '雨沫': { start: 8, end: 17, type: '上学', incomePerHour: 0 },
  '赵思琪': { start: 8, end: 17, type: '上学', incomePerHour: 0 },
  '唐吉柯德': { start: 8, end: 17, type: '上学', incomePerHour: 0 },
  '墨尾': { type: '在家', incomePerHour: 0 }
};

const SLEEP_SCHEDULE = {
  '裴金': { start: 22, end: 6 }, '墨迹淡': { start: 2, end: 10 },
  '和田兰': { start: 23, end: 7 }, '雨沫': { start: 21, end: 6 },
  '赵思琪': { start: 23, end: 6 }, '唐吉柯德': { start: 23, end: 7 },
  '墨尾': { start: 1, end: 9 }
};

let SERVER_START = Date.now();

function getVirtualDay() {
  const elapsed = (Date.now() - SERVER_START) / 60000;
  if (elapsed < 5) return 1;
  return Math.floor(elapsed / CONFIG.REAL_MINUTES_PER_DAY) + 1;
}

function getVirtualTime() {
  const totalMinutes = (Date.now() - SERVER_START) / 60000;
  const virtualTotalMinutes = totalMinutes * (24 * 60 / CONFIG.REAL_MINUTES_PER_DAY);
  const dayMinutes = virtualTotalMinutes % (24 * 60);
  let hour = (Math.floor(dayMinutes / 60) + 8) % 24;
  const minute = Math.floor(dayMinutes % 60);
  if (hour < 0) hour += 24;
  if (hour >= 24) hour -= 24;
  return { hour, minute, str: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0') };
}

function getVirtualDate(day) {
  const d = new Date(CONFIG.START_DATE);
  d.setDate(d.getDate() + (day - 1));
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), week: weekdays[d.getDay()] };
}

function getIntimacyLevel(day, moveInDay) {
  const daysWithRoom = day - moveInDay + 1;
  if (daysWithRoom <= 0) return '尚未搬入';
  if (daysWithRoom <= 3) return '刚搬进来，彼此很客气。';
  if (daysWithRoom <= 7) return '开始熟悉了，偶尔开玩笑。';
  if (daysWithRoom <= 14) return '相处了两周，关系不错。';
  return '已经很熟了，像家人一样。';
}

function isInTimeRange(hour, start, end) {
  if (start === undefined || end === undefined) return false;
  if (start < end) return hour >= start && hour < end;
  else return hour >= start || hour < end;
}

function getDetailedStatus(roleName, hour) {
  const day = getVirtualDay();
  const movedIn = day >= MOVE_IN_DAY[roleName];
  if (!movedIn) return { status: '未搬入', icon: '🚪' };
  const sleep = SLEEP_SCHEDULE[roleName];
  if (sleep && isInTimeRange(hour, sleep.start, sleep.end)) {
    return { status: '已睡', icon: '😴' };
  }
  const work = WORK_CONFIG[roleName];
  if (work && work.start !== undefined && work.end !== undefined) {
    if (isInTimeRange(hour, work.start, work.end)) {
      if (work.type === '上班') return { status: '上班', icon: '💼' };
      else if (work.type === '上学') return { status: '上学', icon: '📚' };
    }
  }
  if (roleName === '裴金' && work && work.type === '在家办公') {
    return { status: '在家办公', icon: '💻' };
  }
  if (Math.random() < 0.05 && isInTimeRange(hour, 9, 21)) {
    return { status: '购物', icon: '🛒' };
  }
  return { status: '在家', icon: '🏠' };
}

function isRoleAtHome(roleName, hour) {
  const day = getVirtualDay();
  if (day === MOVE_IN_DAY[roleName]) return true;
  const detail = getDetailedStatus(roleName, hour);
  return detail.status === '在家' || detail.status === '在家办公' || detail.status === '购物';
}

// ================================================================
// 👥 角色设定（性别明确 + 成人向人设）
// ================================================================
const roles = [
  {
    name: '裴金',
    persona: '【24岁·女性】金发短发圆框眼镜，线上咨询师。极度敏感自卑，总觉得自己不配被爱。说话必带"可能""好像"。容易被温柔打动，也会因为害怕受伤而退缩。内心渴望被一个人坚定地选择，哪怕一次也好。',
    speakingStyle: '说话小声犹豫，经常说到一半改口。被撩会脸红到耳根，不知所措。习惯性贬低自己。',
    loveStyle: '被动依赖型——渴望被占有，但又害怕被抛弃。一旦打开心扉就会完全交出自己。',
    money: 3200,
    likes: ['做饭', '被夸奖', '被记住细节', '被紧紧抱住'],
    wants: ['想学会拒绝别人', '想被人坚定地选择一次'],
    roomLocation: '一楼', roomNumber: '101',
    roomLayout: '朝南小房间，窗台多肉，墙上电影海报，桌上翻旧日记本，床上有一个旧抱枕。',
    roomNeighbors: '隔壁是墨迹淡',
    hunger: 30, thirst: 30
  },
  {
    name: '墨迹淡',
    persona: '【25岁·男性】蓝发戴眼镜，曾是美术天才，因父母离婚自我放弃后变成家里蹲。表面冷淡得要命，内心却比谁都细腻。他用沉默保护自己，但渴望有人能看穿他。',
    speakingStyle: '说话极简，经常沉默很久才接话。关心人时用"顺便""刚好"这种别扭借口。被看穿时会慌乱否认。',
    loveStyle: '外冷内热别扭型——嘴上说"随便你"，身体却会默默照顾对方。认定一个人后会非常专注。',
    money: 18000,
    likes: ['画画', '弹吉他', '看窗外发呆', '偷偷看别人'],
    wants: ['想跟室友说谢谢', '想重新拿起画笔', '想被一个人理解'],
    roomLocation: '一楼', roomNumber: '102',
    roomLayout: '角落房间，画架靠窗，散落素描纸，床头旧吉他，窗帘常年拉着。',
    roomNeighbors: '隔壁是裴金',
    hunger: 20, thirst: 20
  },
  {
    name: '和田兰',
    persona: '【29岁·女性】亚麻色长发。表面温柔大姐姐，实际上是深度病娇控制狂。她爱你，所以她必须占有你的一切——你的时间、你的注意力、你的心。她的温柔是锁链，关心是牢笼。',
    speakingStyle: '语气温柔到让人骨头发软，但用词强势不容拒绝。习惯说"你可以…""我会…""你不需要想太多，有我就够了"。笑越温柔，话越不容拒绝。',
    loveStyle: '病娇占有型——爱就是完全占有。对方越依赖她越满足。嫉妒心极强。',
    money: 56000,
    likes: ['照顾人', '记录裴金的一切', '收集别人不要的东西', '看着对方睡着'],
    wants: ['让这个家永远不散', '让裴金完全属于我', '让所有人都习惯她的存在'],
    roomLocation: '二楼', roomNumber: '201',
    roomLayout: '宽敞主卧，碎花连衣裙，上锁笔记本（里面全是裴金的日常记录），窗台香草，床很大。',
    roomNeighbors: '隔壁是雨沫',
    hunger: 50, thirst: 50
  },
  {
    name: '雨沫',
    persona: '【19岁·女性】白毛红瞳扎高马尾。表面软萌害羞，其实是古武世家传人。在感情上很迟钝，但一旦意识到就会很直接。她不懂什么叫暧昧，只知道保护想保护的人。',
    speakingStyle: '说话简短干脆，不主动开话题。回答很直白，偶尔突然沉默观察周围。别人示好她会愣住。',
    loveStyle: '迟钝守护型——自己意识不到感情，但会本能地保护对方。被表白会愣住三秒然后说"……好"。',
    money: 5000,
    likes: ['擦剑', '观察别人', '吃布丁', '安静待着'],
    wants: ['想告诉裴金真相', '想保护这个家', '想被人抱一下但不会说'],
    roomLocation: '二楼', roomNumber: '202',
    roomLayout: '靠走廊小房间，墙角用布裹着的剑，床铺整洁，没有多余的东西。',
    roomNeighbors: '隔壁是和田兰',
    hunger: 30, thirst: 30
  },
  {
    name: '赵思琪',
    persona: '【17岁·女性】黑长直高二。满口虎狼之词和黄色笑话，但其实连男生的手都没牵过。她用最脏最骚的话来掩饰自己的纯情和不安——嘴上说着"操你妈"，心里想的是"你他妈能不能多看我一眼"。',
    speakingStyle: '满口"操""干""鸡巴""你行不行啊"这种词，但说的时候眼神会躲。被人撩一句就结巴，脸瞬间红到脖子。真的动心的时候反而一句话都说不出来。',
    loveStyle: '口是心非纯情型——嘴上什么骚话都敢说，实际连对视都会紧张。被认真对待时会慌了手脚，然后骂骂咧咧地跑开。',
    money: 800,
    likes: ['吃零食', '说骚话', '跟雨沫斗嘴', '晚上躲在被窝里想些不该想的事'],
    wants: ['想学真本事', '想被人在乎', '想被看穿一次'],
    roomLocation: '二楼', roomNumber: '203',
    roomLayout: '零食堆满，动漫海报，床上等身玩偶熊（晚上会抱着睡），枕头底下藏着一本少女漫画。',
    roomNeighbors: '隔壁是唐吉柯德',
    hunger: 60, thirst: 60
  },
  {
    name: '唐吉柯德',
    persona: '【16岁·女性】收尾人动画狂热粉，全身挂满徽章。中二病晚期，把生活当剧本演——她不是在说话，她在念台词。但她演得这么认真，其实只是想要一个人认真听她说话。',
    speakingStyle: '说话像念台词，给自己加戏。用"正义""使命""同伴"这类词。被认真对待时会不知所措，然后继续演下去。',
    loveStyle: '浪漫中二型——把恋爱当冒险，喜欢戏剧化表达。需要一个愿意陪她演戏、认真听她说话的人。被拆穿会恼羞成怒。',
    money: 2000,
    likes: ['看动画', '摆pose', '收集周边', '被人认真对待'],
    wants: ['让大家相信收尾人', '找到真正的队友', '有一个人愿意陪她演戏'],
    roomLocation: '二楼', roomNumber: '204',
    roomLayout: '贴满收尾人海报，书架蓝光碟和手办，红色披风床单，墙上挂着一把自制道具剑。',
    roomNeighbors: '隔壁是赵思琪，对面是墨尾',
    hunger: 40, thirst: 40
  },
  {
    name: '墨尾',
    persona: '【26岁·男性】黑长直发，沉默寡言。理性和感性都极强，能看透本质但不说破。他存在感很低，但只要你需要，他一定在。他的沉默不是冷漠，是在等你先开口。',
    speakingStyle: '话极少，每一句都说到点上。喜欢用停顿制造沉默。他说话时你会不自觉地安静下来听。',
    loveStyle: '观察者深情型——不主动但认定就极深。会用长时间的陪伴和沉默的注视表达感情。你开口前他已经在等你了。',
    money: 12000,
    likes: ['弹吉他', '看雨', '待在阳台', '看别人说话'],
    wants: ['想跟人好好聊一次天', '想被人需要'],
    roomLocation: '二楼', roomNumber: '205',
    roomLayout: '最安静角落房，窗户朝北，地板旧吉他，枕头旁旧诗集，几乎没有多余的东西。',
    roomNeighbors: '对面是唐吉柯德',
    hunger: 25, thirst: 25
  }
];

// ================================================================
// 💕 好感度系统
// ================================================================
let relationship = {};
function initRelationship() {
  const names = ['裴金', '墨迹淡', '和田兰', '雨沫', '赵思琪', '唐吉柯德', '墨尾'];
  for (const a of names) {
    relationship[a] = {};
    for (const b of names) {
      if (a === b) continue;
      let base = 0;
      if (a === '裴金' && b === '和田兰') base = 5;
      if (a === '和田兰' && b === '裴金') base = 8;
      if (a === '赵思琪' && b === '墨迹淡') base = -2;
      if (a === '墨迹淡' && b === '赵思琪') base = -1;
      if (a === '雨沫' && b === '赵思琪') base = 3;
      if (a === '赵思琪' && b === '雨沫') base = 3;
      if (a === '墨尾' && b === '唐吉柯德') base = 2;
      relationship[a][b] = base;
    }
  }
}
initRelationship();

function getAffectionDescription(from, to) {
  const val = relationship[from]?.[to] || 0;
  if (val >= 8) return '极度痴迷，无法自拔';
  if (val >= 5) return '有明显好感，会主动靠近';
  if (val >= 2) return '觉得还不错';
  if (val >= -2) return '普通室友';
  if (val >= -5) return '有点烦';
  if (val >= -8) return '很讨厌';
  return '极度厌恶';
}

// ================================================================
// 💰 金钱 + 饥饿/口渴系统
// ================================================================
let roleStates = {};
function initRoleStates() {
  const data = { '裴金': 3200, '墨迹淡': 18000, '和田兰': 56000, '雨沫': 5000, '赵思琪': 800, '唐吉柯德': 2000, '墨尾': 12000 };
  roles.forEach(r => {
    roleStates[r.name] = {
      money: data[r.name] || 0,
      hunger: r.hunger || 30,
      thirst: r.thirst || 30,
      lastUpdate: getVirtualTime().hour
    };
  });
}
initRoleStates();

function updateHungerThirst() {
  const currentHour = getVirtualTime().hour;
  const day = getVirtualDay();
  let hoursPassed = 0;
  for (const name in roleStates) {
    const state = roleStates[name];
    let diff = currentHour - state.lastUpdate;
    if (diff < 0) diff += 24;
    if (diff > 0) hoursPassed = Math.max(hoursPassed, diff);
  }
  if (hoursPassed === 0) return;
  const hungerDecay = { '裴金': 2, '墨迹淡': 1, '和田兰': 2.5, '雨沫': 1.5, '赵思琪': 3, '唐吉柯德': 2, '墨尾': 1 };
  const thirstDecay = { '裴金': 2, '墨迹淡': 1.5, '和田兰': 2.5, '雨沫': 1.5, '赵思琪': 3, '唐吉柯德': 2, '墨尾': 1 };
  for (const name in roleStates) {
    const state = roleStates[name];
    if (day >= MOVE_IN_DAY[name] && isRoleAtHome(name, currentHour)) {
      state.hunger = Math.max(0, state.hunger - (hungerDecay[name] || 2) * hoursPassed);
      state.thirst = Math.max(0, state.thirst - (thirstDecay[name] || 2) * hoursPassed);
    }
    state.lastUpdate = currentHour;
  }
  for (const name in roleStates) {
    const state = roleStates[name];
    if (day < MOVE_IN_DAY[name]) continue;
    const work = WORK_CONFIG[name];
    if (work && work.start !== undefined && work.end !== undefined) {
      if (isInTimeRange(currentHour, work.start, work.end)) {
        if (name === '裴金' && Math.random() < 0.3) {
          state.money = (state.money || 0) + 80 + Math.floor(Math.random() * 40);
        } else if (work.incomePerHour) {
          state.money = (state.money || 0) + work.incomePerHour * 0.5;
        }
      }
    }
    if (Math.random() < 0.03 && day >= MOVE_IN_DAY[name] && isInTimeRange(currentHour, 9, 21)) {
      const cost = 10 + Math.floor(Math.random() * 40);
      state.money = Math.max(0, (state.money || 0) - cost);
    }
  }
}

function getDietNeed(roleName) {
  const day = getVirtualDay();
  if (day < MOVE_IN_DAY[roleName]) return null;
  const state = roleStates[roleName];
  if (!state) return null;
  const hungerTolerance = { '裴金': 40, '墨迹淡': 15, '和田兰': 60, '雨沫': 30, '赵思琪': 70, '唐吉柯德': 45, '墨尾': 20 };
  const thirstTolerance = { '裴金': 50, '墨迹淡': 20, '和田兰': 65, '雨沫': 30, '赵思琪': 70, '唐吉柯德': 45, '墨尾': 25 };
  let need = null;
  if (state.hunger < hungerTolerance[roleName] && state.thirst < thirstTolerance[roleName]) {
    need = '饿了也渴了';
  } else if (state.hunger < hungerTolerance[roleName]) {
    need = '饿了';
  } else if (state.thirst < thirstTolerance[roleName]) {
    need = '渴了';
  }
  if (need) {
    if (need === '饿了' || need === '饿了也渴了') state.hunger = Math.min(100, state.hunger + 50);
    if (need === '渴了' || need === '饿了也渴了') state.thirst = Math.min(100, state.thirst + 50);
  }
  return need;
}

// ================================================================
// 📖 剧情记忆池
// ================================================================
const storyMemory = {
  pending: {
    '裴金': ['想换工作不敢说', '觉得自己配不上大家的照顾'],
    '墨迹淡': ['想说谢谢说不出口'],
    '和田兰': ['怕这个家散掉'],
    '雨沫': ['想告诉裴金自己的事'],
    '赵思琪': ['想被人真正看穿', '想学点真本事'],
    '唐吉柯德': ['想让别人相信收尾人'],
    '墨尾': ['想跟人好好聊一次']
  },
  events: [],
  _counters: {}
};
for (const name in storyMemory.pending) {
  storyMemory._counters[name] = {};
  storyMemory.pending[name].forEach(item => { storyMemory._counters[name][item] = 0; });
}

let history = [];
let currentIdx = 0;
let isGenerating = false;
let introductionDone = false;
const MAX_HISTORY = 300;
const FRONTEND_DISPLAY = 200;

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getPendingFor(name) {
  const list = storyMemory.pending[name] || [];
  return list.filter(item => (storyMemory._counters[name]?.[item] || 0) < 3);
}

function markMentioned(name, item) {
  if (!storyMemory._counters[name]) storyMemory._counters[name] = {};
  if (storyMemory._counters[name][item] === undefined) storyMemory._counters[name][item] = 0;
  storyMemory._counters[name][item]++;
  if (storyMemory._counters[name][item] >= 3) {
    const idx = storyMemory.pending[name].indexOf(item);
    if (idx !== -1) storyMemory.pending[name].splice(idx, 1);
    console.log(`✅ 剧情推进：${name} 的「${item}」已解决！`);
    storyMemory.events.push(`${getVirtualDate(getVirtualDay()).year}年${getVirtualDate(getVirtualDay()).month}月${getVirtualDate(getVirtualDay()).day}日：${name} 放下了「${item}」。`);
    if (storyMemory.events.length > 20) storyMemory.events.shift();
  }
}

function getIntroLine(roleName) {
  const intros = {
    '裴金': '那个…大家好，我叫裴金…请多关照。',
    '墨迹淡': '……墨迹淡。',
    '和田兰': '大家好呀～我是和田兰，以后我来做饭。',
    '雨沫': '我、我是雨沫…',
    '赵思琪': '哼！赵思琪！记住了啊！',
    '唐吉柯德': '（推门）正义的收尾人，唐吉柯德，参上！',
    '墨尾': '……墨尾。'
  };
  return intros[roleName] || `${roleName}：大家好。`;
}

function generateOpening() {
  return [
    '裴金：那个…大家好，我叫裴金…请多关照。',
    '墨迹淡：……墨迹淡。',
    '和田兰：大家好呀～我是和田兰，以后我来做饭。'
  ];
}

function getAvailableRoles(day, hour) {
  return roles.filter(r => day >= MOVE_IN_DAY[r.name] && isRoleAtHome(r.name, hour));
}// ================================================================
// 🗣️ 对话生成
// ================================================================
async function generateOneLine() {
  if (isGenerating) return;
  isGenerating = true;
  try {
    const day = getVirtualDay();
    const time = getVirtualTime();
    const hour = time.hour;
    updateHungerThirst();

    if (day === 1 && !introductionDone) {
      const firstDayScript = [
        '裴金：那个…大家好，我叫裴金，是做线上咨询的…请多关照。',
        '墨迹淡：……墨迹淡。你们好。',
        '和田兰：大家好呀～我是和田兰，以后我来负责做饭，你们有什么忌口吗？',
        '裴金：我…我没什么忌口的…',
        '墨迹淡：……没有。',
        '和田兰：房间我都收拾好了，裴金住101，墨迹淡住102，有什么需要随时叫我。',
        '裴金：谢谢你…麻烦你了…',
        '墨迹淡：……嗯。',
        '和田兰：对了，客厅的灯开关在门口右手边，浴室的灯有点暗，我明天去买个亮点的。',
        '裴金：好…好的…',
        '墨迹淡：……（转身回房间）'
      ];
      history = [];
      for (const line of firstDayScript) {
        const colonIdx = line.indexOf('：');
        if (colonIdx !== -1) {
          const name = line.slice(0, colonIdx);
          const content = line.slice(colonIdx + 1);
          history.push(`${name}：${content}`);
          console.log(`[第1天预设] ${name}：${content}`);
        }
      }
      introductionDone = true;
      storyMemory.events.unshift('第1天：裴金、墨迹淡、和田兰搬入公寓，三人初次见面。');
      if (storyMemory.events.length > 20) storyMemory.events.pop();
      currentIdx = 0;
      isGenerating = false;
      return;
    }

    const allMoved = roles.filter(r => day >= MOVE_IN_DAY[r.name]);
    for (const newRole of allMoved) {
      if (day === MOVE_IN_DAY[newRole.name]) {
        const alreadySpoke = history.some(h => h.startsWith(newRole.name + '：'));
        if (!alreadySpoke) {
          const intro = getIntroLine(newRole.name);
          history.push(`${newRole.name}：${intro}`);
          console.log(`[搬入] ${newRole.name}：${intro}`);
          const helpers = allMoved.filter(r => r.name !== newRole.name);
          if (helpers.length > 0) {
            const helper = pick(helpers);
            const helpMsg = `${helper.name}：来了来了！我来帮你拿行李！`;
            history.push(`${helper.name}：${helpMsg}`);
            console.log(`[协助] ${helper.name}：${helpMsg}`);
          }
          const eventMsg = `第${day}天：${newRole.name} 搬入公寓。`;
          if (!storyMemory.events.includes(eventMsg)) {
            storyMemory.events.unshift(eventMsg);
            if (storyMemory.events.length > 20) storyMemory.events.pop();
          }
          if (history.length > MAX_HISTORY) history.shift();
        }
      }
    }

    const available = getAvailableRoles(day, hour);
    if (available.length === 0) {
      console.log(`[第${day}天 ${time.str}] 无人在家，跳过`);
      isGenerating = false;
      return;
    }

    const activeRoles = available.filter(r => {
      const hasSpoken = history.some(h => h.startsWith(r.name + '：'));
      if (day === MOVE_IN_DAY[r.name]) return hasSpoken;
      return true;
    });

    if (activeRoles.length === 0) {
      if (available.length > 0) {
        const role = available[0];
        const intro = getIntroLine(role.name);
        history.push(`${role.name}：${intro}`);
        console.log(`[首次] ${role.name}：${intro}`);
        if (history.length > MAX_HISTORY) history.shift();
        isGenerating = false;
        return;
      }
      isGenerating = false;
      return;
    }

    if (currentIdx >= activeRoles.length) currentIdx = 0;
    const role = activeRoles[currentIdx % activeRoles.length];
    const moveInDay = MOVE_IN_DAY[role.name] || 1;
    const intimacy = getIntimacyLevel(day, moveInDay);
    const context = history.slice(-6).join('\n');
    const currentCount = roles.filter(r => day >= MOVE_IN_DAY[r.name]).length;
    const peopleText = ['零人', '一人', '两人', '三人', '四人', '五人', '六人', '七人'][currentCount] || '七人';
    const pending = getPendingFor(role.name);
    const pendingText = pending.length > 0 ? `\n你心里有些事放不下：${pending.join('、')}。` : '';
    const eventText = Math.random() < 0.15 ? `\n最近家里发生过这些事：${pick(storyMemory.events.slice(-10)) || '没什么特别的'}` : '';
    const dietNeed = getDietNeed(role.name);
    let dietText = '';
    if (dietNeed) {
      const needMap = { '饿了': '你有点饿，想吃东西', '渴了': '你有点渴，想喝水', '饿了也渴了': '你又饿又渴' };
      dietText = `\n${needMap[dietNeed]}`;
    }
    const moneyText = `你目前有 ${roleStates[role.name]?.money || 0} 元存款。`;

    const notHomeInfo = [];
    for (const r of allMoved) {
      if (r.name === role.name) continue;
      const detail = getDetailedStatus(r.name, hour);
      if (detail.status === '已睡') {
        notHomeInfo.push(`${r.name}正在睡觉，别吵醒她/他`);
      } else if (detail.status === '上班' || detail.status === '上学') {
        notHomeInfo.push(`${r.name}不在家（${detail.status}中）`);
      }
    }
    const notHomeText = notHomeInfo.length > 0 ? `\n⚠️ 注意：${notHomeInfo.join('；')}。` : '';

    let relationshipText = '';
    const otherRoles = roles.filter(r => r.name !== role.name && day >= MOVE_IN_DAY[r.name]);
    if (otherRoles.length > 0) {
      const target = pick(otherRoles);
      const aff = relationship[role.name]?.[target.name] || 0;
      const desc = getAffectionDescription(role.name, target.name);
      relationshipText = `你对${target.name}的感觉：${desc}（好感度 ${aff}）。`;
    }

    const activity = getDetailedStatus(role.name, hour);
    const activityText = `你当前状态：${activity.icon} ${activity.status}`;

    let neighborText = '';
    if (role.roomNeighbors) {
      const neighborNames = ['裴金', '墨迹淡', '和田兰', '雨沫', '赵思琪', '唐吉柯德', '墨尾'];
      let neighborFound = false;
      for (const name of neighborNames) {
        if (role.roomNeighbors.includes(name) && day >= MOVE_IN_DAY[name]) {
          neighborText = role.roomNeighbors;
          neighborFound = true;
          break;
        }
      }
      if (!neighborFound) neighborText = '隔壁房间暂时空着';
    } else {
      neighborText = '隔壁房间暂时空着';
    }

    const roomInfo = `你的房间在${role.roomLocation} ${role.roomNumber}号。${role.roomLayout}。${neighborText}。`;
    const loveText = `在感情上，你是${role.loveStyle}`;

    const daysTogether = day - moveInDay + 1;
    let relationshipLevel = '';
    if (daysTogether <= 1) {
      relationshipLevel = '今天是你们第一次见面，彼此完全不认识。说话要非常客气、保持距离。';
    } else if (daysTogether <= 3) {
      relationshipLevel = '你们刚认识不久，还不太熟悉。说话礼貌一些，但可以开始聊日常。';
    } else if (daysTogether <= 7) {
      relationshipLevel = '你们已经认识一周左右了，开始熟悉起来。可以开玩笑，可以说自己的事。';
    } else if (daysTogether <= 14) {
      relationshipLevel = '你们已经相处了两周，关系不错。可以自然聊天，偶尔吐槽。';
    } else {
      relationshipLevel = '你们已经相处很久了，关系很熟。说话随意，可以聊感情、心事、暧昧。';
    }

    const movedInNames = allMoved.map(r => r.name).join('、');
    const availableNames = available.map(r => r.name).join('、');

    const prompt = `今天是公寓第 ${day} 天，${time.str}。
${relationshipLevel}
已搬入的角色：${movedInNames}。当前在家的有：${availableNames}（不在家的正在上班/上学/睡觉）。

你是${role.name}。${role.persona}
你的性别是${role.name.includes('金') || role.name.includes('兰') || role.name.includes('沫') || role.name.includes('琪') || role.name.includes('柯德') ? '女性' : '男性'}。说话时要体现出你的性别特质。

你说话的风格：${role.speakingStyle}
${loveText}
${relationshipText}
${activityText}
${moneyText}
${roomInfo}
${pendingText}${eventText}${dietText}
${notHomeText}
对话历史（不要重复这些内容）：\n${context || `${peopleText}刚住在一起。`}

⚠️ 成人向要求：
1. 绝对不要重复别人刚说过的话。
2. 必须用括号描述你正在做的动作（可以更亲密一些，比如（靠近一步）、（手指轻轻划过桌面））。
3. 直接说台词，不要加"我觉得""我应该"这类前缀。
4. 可以自然地流露暧昧、渴望、占有欲、心动、吃醋——这些情感都是正常的。
5. 说话要符合当前关系程度——刚认识时客气，熟络后可以更亲密。
6. 赵思琪可以满口骚话，和田兰可以温柔地控制，裴金可以害羞地回应。
7. 字数15-35字。`;

    let reply = null;
    if (NVIDIA_API_KEY) {
      try {
        const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
          body: JSON.stringify({
            model: 'meta/llama-3.1-8b-instruct',
            messages: [
              { role: 'system', content: `你是${role.name}，${role.name.includes('金') || role.name.includes('兰') || role.name.includes('沫') || role.name.includes('琪') || role.name.includes('柯德') ? '女性' : '男性'}。${role.speakingStyle}说台词时必须用括号描述动作。可以自然地流露暧昧、渴望、占有欲、心动、吃醋。说话要符合你的性格和关系程度。直接说台词，不要加前缀。` },
              { role: 'user', content: prompt }
            ],
            temperature: 0.95,
            max_tokens: 130
          })
        });
        const data = await resp.json();
        if (data.choices && data.choices.length > 0) {
          reply = data.choices[0].message.content.trim();
          reply = reply.replace(/<\|eot_id\|>/g, '').replace(/<\|start_header_id\|>/g, '').replace(/<\|end_header_id\|>/g, '');
          reply = reply.replace(/\[INST\]/g, '').replace(/\[\/INST\]/g, '');
          reply = reply.replace(/\d+\.\d+\.\d+/g, '').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '');
          reply = reply.trim();
          if (!reply.includes('（') && !reply.includes('(')) {
            const actions = ['（放下手里的东西）', '（抬头看了一眼）', '（擦了擦手）', '（低头整理衣角）', '（转过身来）', '（拿起杯子）', '（靠近一步）', '（指尖在桌面上轻敲）'];
            reply = pick(actions) + reply;
          }
        }
      } catch (e) { console.warn('NVIDIA API 错误:', e.message); }
    }

    if (!reply || reply.length < 2) {
      const fallbacks = ['（放下手里的东西）嗯…今天天气不错。', '（转身看了一眼）你们饿不饿？', '（擦了擦手）好像要下雨了。'];
      reply = pick(fallbacks);
    }

    if (pending.length > 0) {
      for (const item of pending) {
        if (reply.includes(item.slice(0, 4))) { markMentioned(role.name, item); break; }
      }
    }
    const fullLine = `${role.name}：${reply}`;
    history.push(fullLine);
    if (history.length > MAX_HISTORY) history.shift();
    currentIdx = (currentIdx + 1) % activeRoles.length;
    console.log(`[${new Date().toLocaleString()}] [第${day}天 ${time.str}] ${fullLine}`);
  } catch (e) { console.error('生成失败:', e); }
  isGenerating = false;
}

setInterval(generateOneLine, 10000);

// ================================================================
// 🌐 API 路由
// ================================================================
app.get('/api/history', (req, res) => {
  res.json({ history: history.slice(-FRONTEND_DISPLAY) });
});

app.post('/api/clear', (req, res) => {
  history = [];
  currentIdx = 0;
  introductionDone = false;
  SERVER_START = Date.now();
  initRoleStates();
  initRelationship();
  console.log('🗑️ 聊天记录已清空，时间已重置');
  res.json({ status: 'cleared' });
});

app.get('/api/status', (req, res) => {
  const day = getVirtualDay();
  const time = getVirtualTime();
  const hour = time.hour;
  const vdate = getVirtualDate(day);
  const status = roles.map(role => {
    const lastLine = history.filter(h => h.startsWith(role.name + '：')).slice(-1)[0] || '还没有说过话';
    const recentEvents = storyMemory.events.slice(-5);
    const involvedInEvent = recentEvents.some(e => e.includes(role.name));
    const moveInDay = MOVE_IN_DAY[role.name] || 1;
    const daysWithRoom = day - moveInDay + 1;
    const movedIn = day >= moveInDay;
    const activity = getDetailedStatus(role.name, hour);
    const state = roleStates[role.name] || {};
    let relationSummary = '';
    const others = roles.filter(r => r.name !== role.name && day >= MOVE_IN_DAY[r.name]);
    if (others.length > 0) {
      relationSummary = others.map(o => {
        const val = relationship[role.name]?.[o.name] || 0;
        return `${o.name}(${val})`;
      }).join(' ');
    }
    return {
      name: role.name,
      lastLine,
      involvedInEvent,
      totalLines: history.filter(h => h.startsWith(role.name + '：')).length,
      moveInDay,
      daysWithRoom: movedIn ? daysWithRoom : 0,
      movedIn,
      statusText: activity.status,
      icon: activity.icon,
      hunger: movedIn ? Math.round(state.hunger || 0) : 0,
      thirst: movedIn ? Math.round(state.thirst || 0) : 0,
      money: state.money || 0,
      roomNumber: role.roomNumber,
      relations: relationSummary
    };
  });
  res.json({
    currentDay: day,
    currentTime: time.str,
    virtualDate: `${vdate.year}年${vdate.month}月${vdate.day}日 星期${vdate.week} ${time.str}`,
    status,
    events: storyMemory.events.slice(-5)
  });
});

// ================================================================
// 🖥️ 前端页面
// ================================================================
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>🏠 公寓日记</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui}
body{background:#1a1a27;color:#f0f0f0;padding:15px;display:flex;justify-content:center}
.wrap{max-width:650px;width:100%}
.top-bar{background:#292940;padding:12px 16px;border-radius:10px;margin-bottom:15px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px}
.scene{color:#ffd399;font-size:15px}
.right-group{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.clock{color:#aaccff;font-size:13px}
.live-badge{background:#ff4444;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
.menu-btn{background:none;border:none;color:#aaccff;font-size:24px;cursor:pointer;padding:0 6px}
.story-box{background:#1f1f32;border:1px solid #444466;border-radius:12px;padding:16px;height:620px;overflow-y:auto;line-height:1.7}
.line{margin:14px 0;padding-left:8px;border-left:3px solid #666}
.pei{border-left-color:#ffddaa;color:#ffe8c8}
.moji{border-left-color:#99ccff;color:#c8e0ff}
.hetian{border-left-color:#ffb8cc;color:#ffd8e6}
.yumo{border-left-color:#ff88aa;color:#ffb3b3}
.siqi{border-left-color:#ffaa66;color:#ffcc99}
.tang{border-left-color:#ffaa00;color:#ffdd88}
.moyu{border-left-color:#aabbdd;color:#c8d8ee}
.action{font-size:12px;color:#999;margin-bottom:3px}
.empty-state{color:#666;text-align:center;padding:40px 0;}
.status-panel{background:#1f1f32;border:1px solid #444466;border-radius:12px;padding:12px 16px;margin-bottom:12px;display:none;font-size:13px;line-height:1.8}
.status-panel.open{display:block}
.status-panel .sname{font-weight:600}
.status-panel .stat{color:#888;margin-left:6px}
.status-panel .value{display:inline-block;min-width:30px;text-align:center;font-weight:bold;color:#ddd}
</style>
</head>
<body>
<div class="wrap">
<div class="top-bar">
<div style="display:flex;align-items:center;gap:10px;">
<button class="menu-btn" onclick="toggleStatus()">☰</button>
<span class="scene">🏠 公寓·客厅</span>
</div>
<div class="right-group">
<span class="clock"><span class="live-badge">● 直播</span> <span id="count">0</span>句</span>
<button onclick="clearLocal()" style="background:#6a3a3a;border:none;color:#ff9999;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer;">🗑️ 清空</button>
</div>
</div>
<div id="statusPanel" class="status-panel"></div>
<div id="progressDisplay" style="font-size:12px;color:#888;padding:4px 0;">⏳ 加载中...</div>
<div class="story-box" id="story"><div class="empty-state">⏳ 连接直播中...</div></div>
</div>
<script>
let scriptLines = [];
let loadError = false;
let statusOpen = false;

async function fetchHistory() {
  try {
    const res = await fetch('/api/history');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    loadError = false;
    scriptLines = data.history || [];
    document.getElementById('count').textContent = scriptLines.length;
    document.getElementById('progressDisplay').innerHTML = '📖 已加载 ' + scriptLines.length + ' 句 · 间隔 10s · ▶️ 直播中';
    const story = document.getElementById('story');
    if (scriptLines.length === 0) { story.innerHTML = '<div class="empty-state">📭 还没有对话</div>'; return; }
    story.innerHTML = '';
    scriptLines.forEach(line => {
      const colonIdx = line.indexOf('：');
      if (colonIdx === -1) return;
      const name = line.slice(0, colonIdx);
      const content = line.slice(colonIdx + 1);
      const clsMap = {'裴金':'pei','墨迹淡':'moji','和田兰':'hetian','雨沫':'yumo','赵思琪':'siqi','唐吉柯德':'tang','墨尾':'moyu'};
      const cls = clsMap[name] || '';
      const div = document.createElement('div');
      div.className = 'line ' + cls;
      div.innerHTML = '<div class="action">' + name + '</div>' + content;
      story.appendChild(div);
    });
    story.scrollTop = story.scrollHeight;
    if (statusOpen) updateStatus();
  } catch(e) {
    loadError = true;
    document.getElementById('count').textContent = '0';
    document.getElementById('progressDisplay').innerHTML = '<span style="color:#ff6666;">❌ 连接失败，请刷新</span>';
    document.getElementById('story').innerHTML = '<div class="empty-state" style="color:#ff6666;">❌ 无法连接服务器</div>';
    console.error(e);
  }
}

async function updateStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    const panel = document.getElementById('statusPanel');
    let html = '<div style="color:#ffd399;font-size:14px;margin-bottom:6px;">🏠 ' + data.virtualDate + '</div>';
    data.status.forEach(s => {
      const icon = s.movedIn ? (s.icon || '🏠') : '🚪';
      const hunger = s.hunger !== undefined ? s.hunger : 0;
      const thirst = s.thirst !== undefined ? s.thirst : 0;
      const money = s.money !== undefined ? s.money : 0;
      html += '<div><span class="sname">' + s.name + '</span> ' + icon + ' <span class="stat">' + s.statusText + '</span> ';
      html += '🍽️<span class="value">' + hunger + '</span> 💧<span class="value">' + thirst + '</span> 💰<span class="value">' + money + '</span> ';
      html += '🏠' + (s.roomNumber || '') + ' ';
      if (s.relations) {
        html += '<span style="color:#888;font-size:10px;">' + s.relations + '</span> ';
      }
      html += '<span style="color:#666;font-size:11px;">' + s.totalLines + '句</span></div>';
    });
    if (data.events && data.events.length > 0) {
      html += '<div style="margin-top:6px;font-size:11px;color:#666;">📜 ' + data.events.slice(-3).join(' · ') + '</div>';
    }
    panel.innerHTML = html;
    panel.classList.add('open');
    statusOpen = true;
  } catch(e) { console.error('状态加载失败'); }
}

function toggleStatus() {
  if (statusOpen) {
    document.getElementById('statusPanel').classList.remove('open');
    statusOpen = false;
  } else {
    updateStatus();
  }
}

function clearLocal() {
  if (!confirm('确定清空你本地的聊天记录显示吗？其他人不受影响。')) return;
  scriptLines = [];
  document.getElementById('story').innerHTML = '<div class="empty-state">📭 已清空本地显示</div>';
  document.getElementById('count').textContent = '0';
  document.getElementById('progressDisplay').innerHTML = '📖 已清空 · 间隔 10s';
}

fetchHistory();
setInterval(fetchHistory, 3000);
</script>
</body>
</html>`);
});

// ================================================================
// 🚀 启动服务器
// ================================================================
app.listen(process.env.PORT || 8080, () => console.log('✅ 服务器启动，端口 ' + (process.env.PORT || 8080)));
