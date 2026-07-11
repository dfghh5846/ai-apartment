const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
if (!NVIDIA_API_KEY) console.warn('⚠️ NVIDIA_API_KEY 未设置');

const CONFIG = { REAL_MINUTES_PER_DAY: 24, START_DATE: new Date(2024, 0, 1) };

const MOVE_IN_DAY = {
  '裴金': 1, '墨迹淡': 1, '和田兰': 1,
  '雨沫': 2, '赵思琪': 2, '唐吉柯德': 2,
  '墨尾': 15
};

const HOLIDAYS = {
  '1-1': '元旦', '1-28': '春节', '1-29': '春节', '1-30': '春节',
  '5-1': '劳动节', '5-2': '劳动节', '5-3': '劳动节',
  '9-15': '中秋节', '9-16': '中秋节', '9-17': '中秋节',
  '10-1': '国庆节', '10-2': '国庆节', '10-3': '国庆节'
};

function isHoliday(day) {
  const date = getVirtualDate(day);
  const key = date.month + '-' + date.day;
  return HOLIDAYS[key] || false;
}

// ============ 天气系统 ============
const WEATHERS = ['晴天', '多云', '小雨', '大雨', '阴天', '雷阵雨', '雪天'];
let currentWeather = '晴天';
let weatherChangeTimer = 0;

function updateWeather() {
  weatherChangeTimer++;
  if (weatherChangeTimer > 3) {
    weatherChangeTimer = 0;
    const weights = [25, 20, 15, 10, 15, 5, 10];
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        currentWeather = WEATHERS[i];
        break;
      }
    }
  }
  return currentWeather;
}

// ============ 每日话题系统 ============
const TOPICS = [
  '今天晚饭吃什么', '谁又把垃圾堆在门口了', '周末要不要一起看电影',
  '有人半夜偷吃零食被抓到了', '水电费这个月又涨了', '谁家的快递又拿错了',
  '今天天气真好要不要出门走走', '有人在客厅睡着了', '昨晚谁在厨房搞出那么大动静',
  '下个月有人的生日要到了', '谁又把浴室弄得全是水', '今天谁做饭',
  '有人穿错别人的拖鞋了', '冰箱里的牛奶是谁喝的', '阳台的花该浇水了'
];
let dailyTopic = null;
let topicDay = 0;

function updateDailyTopic(day) {
  if (day !== topicDay) {
    topicDay = day;
    dailyTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    timelineLog.push(`📌 今日话题：${dailyTopic}`);
  }
  return dailyTopic;
}

// ============ 季节系统 ============
function getSeason(day) {
  const date = getVirtualDate(day);
  const month = date.month;
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

// ============ 情感记忆 ============
let emotionalMemory = {};

function initEmotionalMemory() {
  const names = ['裴金', '墨迹淡', '和田兰', '雨沫', '赵思琪', '唐吉柯德', '墨尾'];
  names.forEach(n => {
    emotionalMemory[n] = [];
  });
}
initEmotionalMemory();

function addMemory(name, event, impact) {
  const day = getVirtualDay();
  emotionalMemory[name].push({ day, event, impact });
  if (emotionalMemory[name].length > 30) emotionalMemory[name].shift();
}

function getMemory(name) {
  return emotionalMemory[name] || [];
}

// ============ 日记系统 ============
let diaries = {};
let diaryVisibility = {};

function initDiaries() {
  const names = ['裴金', '墨迹淡', '和田兰', '雨沫', '赵思琪', '唐吉柯德', '墨尾'];
  names.forEach(n => {
    diaries[n] = [];
    diaryVisibility[n] = false;
  });
}
initDiaries();

function writeDiary(name, content) {
  const day = getVirtualDay();
  const time = getVirtualTime();
  diaries[name].push({ day, time: time.str, content, date: Date.now() });
  if (diaries[name].length > 20) diaries[name].shift();
}

function peekDiary(peeker, target) {
  if (!diaries[target] || diaries[target].length === 0) return null;
  if (Math.random() < 0.2) {
    const latest = diaries[target][diaries[target].length - 1];
    addMemory(peeker, `偷看了${target}的日记，发现：${latest.content}`, -2);
    timelineLog.push(`🔍 ${peeker} 偷看了 ${target} 的日记！`);
    return latest.content;
  }
  return null;
}

// ============ 公共空间系统 ============
const SPACES = {
  kitchen: { inUse: null, queue: [], usage: 0 },
  livingRoom: { inUse: null, queue: [], usage: 0 },
  bathroom: { inUse: null, queue: [], usage: 0 }
};

function useSpace(space, name) {
  const s = SPACES[space];
  if (!s.inUse) {
    s.inUse = name;
    s.usage++;
    return `✅ ${name} 开始使用${space === 'kitchen' ? '厨房' : space === 'livingRoom' ? '客厅' : '浴室'}`;
  } else if (s.inUse !== name && !s.queue.includes(name)) {
    s.queue.push(name);
    return `⏳ ${name} 排队等待${space === 'kitchen' ? '厨房' : space === 'livingRoom' ? '客厅' : '浴室'}（${s.inUse}正在使用）`;
  }
  return null;
}

function releaseSpace(space) {
  const s = SPACES[space];
  if (!s.inUse) return null;
  const prev = s.inUse;
  s.inUse = s.queue.shift() || null;
  if (s.inUse) {
    timelineLog.push(`🔄 ${s.inUse} 接替了 ${prev} 使用的${space === 'kitchen' ? '厨房' : space === 'livingRoom' ? '客厅' : '浴室'}`);
  } else {
    timelineLog.push(`🆓 ${prev} 释放了${space === 'kitchen' ? '厨房' : space === 'livingRoom' ? '客厅' : '浴室'}`);
  }
  return prev;
}

// ============ 账单系统 ============
let bills = { water: 0, electric: 0, gas: 0, internet: 0 };
let billDay = 0;
let lastBillPaid = {};

function initBills() {
  const names = ['裴金', '墨迹淡', '和田兰', '雨沫', '赵思琪', '唐吉柯德', '墨尾'];
  names.forEach(n => {
    lastBillPaid[n] = 0;
  });
}
initBills();

function calculateBills(day) {
  if (day - billDay < 15) return;
  billDay = day;
  const total = 100 + Math.floor(Math.random() * 200);
  bills = {
    water: 30 + Math.floor(Math.random() * 40),
    electric: 40 + Math.floor(Math.random() * 60),
    gas: 20 + Math.floor(Math.random() * 30),
    internet: 30 + Math.floor(Math.random() * 30)
  };
  const totalBill = bills.water + bills.electric + bills.gas + bills.internet;
  const active = roles.filter(r => getVirtualDay() >= MOVE_IN_DAY[r.name]);
  const perPerson = Math.ceil(totalBill / active.length);
  
  active.forEach(r => {
    if (roleStates[r.name]) {
      const paid = Math.random() < 0.8 ? perPerson : 0;
      if (paid > 0) {
        roleStates[r.name].money = Math.max(0, roleStates[r.name].money - paid);
        lastBillPaid[r.name] = day;
      } else {
        timelineLog.push(`⚠️ ${r.name} 没交水电费！被大家吐槽了`);
        addMemory(r.name, `没交水电费被说了`, -1);
      }
    }
  });
  
  const totalPaid = active.reduce((sum, r) => {
    return sum + (lastBillPaid[r.name] === day ? perPerson : 0);
  }, 0);
  const short = totalBill - totalPaid;
  if (short > 0) {
    if (roleStates['和田兰']) {
      roleStates['和田兰'].money = Math.max(0, roleStates['和田兰'].money - short);
      timelineLog.push(`💰 和田兰 垫付了 ${short} 元账单`);
    }
  }
  timelineLog.push(`💰 本月账单：水${bills.water} 电${bills.electric} 气${bills.gas} 网${bills.internet} 共${totalBill}元，人均${perPerson}元`);
}

// ============ 意外事件系统 ============
const EVENTS = [
  { name: '厨房差点起火', desc: (r) => `${r} 做饭忘记关火，差点出事！`, severity: 5 },
  { name: '快递拿错', desc: (r) => `${r} 拆了别人的快递，好尴尬`, severity: 3 },
  { name: '有人发烧', desc: (r) => `${r} 发烧了，大家轮流照顾`, severity: 4 },
  { name: '吵架', desc: (r) => `${r} 和室友大吵一架`, severity: 4 },
  { name: '壁咚表白', desc: (r) => `${r} 突然被壁咚表白了！`, severity: 3 },
  { name: '冰箱被偷吃', desc: (r) => `${r} 的零食被偷吃了！`, severity: 2 },
  { name: '下雨忘关窗', desc: (r) => `${r} 房间窗户没关，地板全湿了`, severity: 3 },
  { name: '宠物闯入', desc: (r) => `有只猫/狗闯入公寓，${r} 在追！`, severity: 2 },
  { name: '手机丢了', desc: (r) => `${r} 手机找不到了，快帮忙找找`, severity: 3 },
  { name: '霸占浴室', desc: (r) => `${r} 在浴室里待了2小时不出来！`, severity: 3 },
  { name: '惊喜派对', desc: (r) => `大家给 ${r} 准备了惊喜派对！`, severity: 5 },
  { name: '秘密被发现', desc: (r) => `${r} 的秘密被发现了！`, severity: 5 },
  { name: '深夜谈心', desc: (r) => `${r} 深夜在阳台和室友谈心`, severity: 3 },
  { name: '有人搬走', desc: (r) => `${r} 说要搬走，大家挽留`, severity: 5 },
  { name: '中奖了', desc: (r) => `${r} 彩票中奖了！`, severity: 4 }
];

let eventTimer = 0;
let pendingEvent = null;

function triggerRandomEvent() {
  eventTimer++;
  if (eventTimer < 8) return null;
  eventTimer = 0;
  
  const active = roles.filter(r => getVirtualDay() >= MOVE_IN_DAY[r.name]);
  if (active.length < 2) return null;
  
  const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  const subject = active[Math.floor(Math.random() * active.length)];
  const desc = evt.desc(subject.name);
  
  active.forEach(r => {
    const mood = roleMoods[r.name];
    if (mood) {
      const moods = ['开心', '平静', '低落', '烦躁', '疲惫', '期待'];
      const newMood = moods[Math.floor(Math.random() * moods.length)];
      mood.mood = newMood;
      mood.lastChange = getVirtualDay();
    }
    if (evt.severity > 3) {
      const val = relationship[subject.name]?.[r.name] || 0;
      if (relationship[subject.name]) {
        relationship[subject.name][r.name] = Math.max(-10, Math.min(10, val + (evt.severity > 4 ? 2 : -1)));
      }
    }
  });
  
  timelineLog.push(`🎭 【事件】${desc}`);
  pendingEvent = { event: evt.name, desc, subject: subject.name, day: getVirtualDay() };
  return pendingEvent;
}

// ============ 室友评价系统 ============
let evaluationTimer = 0;

function triggerEvaluation() {
  evaluationTimer++;
  if (evaluationTimer < 3) return null;
  evaluationTimer = 0;
  
  const active = roles.filter(r => getVirtualDay() >= MOVE_IN_DAY[r.name]);
  if (active.length < 2) return null;
  
  const from = active[Math.floor(Math.random() * active.length)];
  let to = active[Math.floor(Math.random() * active.length)];
  while (to.name === from.name && active.length > 1) {
    to = active[Math.floor(Math.random() * active.length)];
  }
  
  const comments = [
    '今天表现不错', '有点烦人', '很贴心', '太吵了', '很靠谱',
    '需要改进', '今天很帅/很美', '有点奇怪', '很温暖', '太作了'
  ];
  const comment = comments[Math.floor(Math.random() * comments.length)];
  const val = relationship[from.name]?.[to.name] || 0;
  const delta = Math.floor(Math.random() * 3) + 1;
  const newVal = comment.includes('烦') || comment.includes('奇怪') || comment.includes('吵') 
    ? val - delta 
    : val + delta;
  
  if (relationship[from.name]) {
    relationship[from.name][to.name] = Math.max(-10, Math.min(10, newVal));
  }
  
  timelineLog.push(`💬 ${from.name} 对 ${to.name} 的评价：${comment}（好感度 ${relationship[from.name]?.[to.name] || 0}）`);
  addMemory(from.name, `评价了 ${to.name}：${comment}`, delta);
  return { from: from.name, to: to.name, comment, delta };
}

// ============ 秘密揭穿系统 ============
function checkSecretExposure(name, reply) {
  const story = PERSONAL_STORIES[name];
  if (!story || !story.secret) return null;
  
  const secretKeywords = story.secret.split(/[，、,.]/);
  for (const kw of secretKeywords) {
    if (kw.length > 2 && reply.includes(kw.slice(0, 3))) {
      const active = roles.filter(r => getVirtualDay() >= MOVE_IN_DAY[r.name] && r.name !== name);
      if (active.length > 0 && Math.random() < 0.15) {
        const witness = active[Math.floor(Math.random() * active.length)];
        timelineLog.push(`🔓 ${name} 说漏嘴了秘密！被 ${witness.name} 听到了`);
        addMemory(witness.name, `发现了 ${name} 的秘密：${story.secret}`, 3);
        return witness.name;
      }
    }
  }
  return null;
}

// ============ 时间线和活动记录 ============
let timelineLog = [];
let dailyActivities = {};

function logActivity(name, activity) {
  const day = getVirtualDay();
  if (!dailyActivities[day]) dailyActivities[day] = {};
  if (!dailyActivities[day][name]) dailyActivities[day][name] = [];
  dailyActivities[day][name].push({ time: getVirtualTime().str, activity });
  if (dailyActivities[day][name].length > 10) dailyActivities[day][name].shift();
}

function getDayActivities(day) {
  return dailyActivities[day] || {};
}

// ============ PERSONAL_STORIES ============
const PERSONAL_STORIES = {
  '裴金': {
    familyBurden: '每月5号要给家里打2000元赡养费',
    hobby: '压力大时会疯狂做饭',
    secret: '她偷偷攒了一笔钱想考研',
    specialEvent: '每月20号会一个人去图书馆待一整天',
    moodBaseline: '容易焦虑，被夸会开心一整天'
  },
  '墨迹淡': {
    familyBurden: '父母离婚后各自再婚，他夹在中间',
    hobby: '画画时讨厌被打扰',
    secret: '他有一本没画完的漫画',
    specialEvent: '每周四晚上会去阳台弹一小时吉他',
    moodBaseline: '表面平静，内心敏感'
  },
  '和田兰': {
    familyBurden: '弟弟有心脏病，每月要付4000元药费',
    hobby: '喜欢收集别人不要的东西',
    secret: '她曾经有过一段被控制的感情，现在她学坏了',
    specialEvent: '每月3号会去医院看弟弟',
    moodBaseline: '控制欲极强，表面温柔，内心病娇'
  },
  '雨沫': {
    familyBurden: '师父在乡下养老，每月要寄1000元',
    hobby: '深夜练剑时喜欢自言自语',
    secret: '她其实在找一个人——小时候救过她的那个姐姐',
    specialEvent: '每月15号会去一个地方，回来时眼睛是红的',
    moodBaseline: '警惕但心软，三观正直'
  },
  '赵思琪': {
    familyBurden: '父母开小餐馆，她不想让他们操心',
    hobby: '半夜偷吃零食，说最骚的话掩饰自己',
    secret: '她其实一直在存钱，想带父母出去旅游',
    specialEvent: '每周六会跟家里视频通话，每次都说"我很好"',
    moodBaseline: '嘴硬怕孤独，极度纯情'
  },
  '唐吉柯德': {
    familyBurden: '父母不理解她的中二病，关系冷淡',
    hobby: '用收尾人动画的台词回击别人',
    secret: '她怕不演的话自己就什么都没有了',
    specialEvent: '每月最后一天会写一封信给"未来的自己"',
    moodBaseline: '中二外壳下是极度自卑'
  },
  '墨尾': {
    familyBurden: '母亲在老家独居，每周四打电话',
    hobby: '看雨的时候会想起小时候的事',
    secret: '他曾经有个弟弟，十岁那年走丢了',
    specialEvent: '每年8月12日他会一整天不说话',
    moodBaseline: '沉默但温柔'
  }
};const MOODS = ['开心', '平静', '低落', '烦躁', '疲惫', '期待'];
const MOOD_ICONS = { '开心': '😊', '平静': '😐', '低落': '😔', '烦躁': '😤', '疲惫': '😫', '期待': '🥺' };

function getRandomMood() {
  return MOODS[Math.floor(Math.random() * MOODS.length)];
}

let roleMoods = {};
function initMoods() {
  roles.forEach(r => {
    roleMoods[r.name] = {
      mood: getRandomMood(),
      lastChange: getVirtualDay()
    };
  });
}

function updateMood(roleName) {
  const day = getVirtualDay();
  const state = roleMoods[roleName];
  if (!state || day - state.lastChange > 2) {
    state.mood = getRandomMood();
    state.lastChange = day;
  }
  if (currentWeather === '大雨' || currentWeather === '雷阵雨') {
    if (Math.random() < 0.3) state.mood = '低落';
  }
  if (currentWeather === '晴天') {
    if (Math.random() < 0.2) state.mood = '开心';
  }
  return state.mood;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ============ DESIRE_SYSTEM ============
const DESIRE_SYSTEM = {
  '裴金': {
    desires: [
      { name: '考研', cost: 8000, priority: 0.7, trigger: '存款>5000', description: '想攒钱报名考研培训班' },
      { name: '买一台新电脑', cost: 6000, priority: 0.5, trigger: '存款>4000', description: '想换一台能流畅剪辑的电脑' },
      { name: '给家里换台洗衣机', cost: 2500, priority: 0.4, trigger: '存款>3000', description: '家里的洗衣机用了十年了' }
    ]
  },
  '墨迹淡': {
    desires: [
      { name: '买一套专业画材', cost: 3000, priority: 0.8, trigger: '存款>2000', description: '想买一套新的油画颜料和画笔' },
      { name: '换一把新吉他', cost: 800, priority: 0.6, trigger: '存款>1000', description: '旧吉他的弦已经按不稳了' },
      { name: '办一次小型画展', cost: 5000, priority: 0.4, trigger: '存款>4000', description: '想把画给大家看看' }
    ]
  },
  '和田兰': {
    desires: [
      { name: '给弟弟做手术', cost: 20000, priority: 1.0, trigger: 'always', description: '弟弟的心脏手术费还差很多' },
      { name: '让裴金完全属于我', cost: 0, priority: 0.9, trigger: 'always', description: '我要让她永远离不开我' },
      { name: '买一件新大衣', cost: 1200, priority: 0.3, trigger: '存款>1500', description: '那件穿了三年的大衣该换了' }
    ]
  },
  '雨沫': {
    desires: [
      { name: '回乡下看师父', cost: 800, priority: 0.7, trigger: '存款>1000', description: '想回乡下看看师父' },
      { name: '买一把新剑', cost: 2000, priority: 0.5, trigger: '存款>2000', description: '现在的剑已经有些旧了' },
      { name: '找那个姐姐', cost: 1500, priority: 0.8, trigger: 'always', description: '想去找小时候救过她的姐姐' }
    ]
  },
  '赵思琪': {
    desires: [
      { name: '带父母去旅游', cost: 4000, priority: 0.7, trigger: '存款>3000', description: '想带开小餐馆的父母出去放松一次' },
      { name: '买一双限量球鞋', cost: 1200, priority: 0.5, trigger: '存款>1500', description: '那双鞋她看了三个月了' },
      { name: '学真本事', cost: 1800, priority: 0.4, trigger: '存款>2000', description: '想学点真本事，不想再嘴硬了' }
    ]
  },
  '唐吉柯德': {
    desires: [
      { name: '买全套收尾人蓝光碟', cost: 1500, priority: 0.8, trigger: '存款>1000', description: '那套限量版她梦了很久' },
      { name: '参加漫展cos收尾人', cost: 800, priority: 0.6, trigger: '存款>800', description: '想穿一次收尾人的衣服去漫展' }
    ]
  },
  '墨尾': {
    desires: [
      { name: '买一把新吉他', cost: 1000, priority: 0.7, trigger: '存款>800', description: '想换一把音色更好的吉他' },
      { name: '回老家找弟弟的线索', cost: 600, priority: 0.8, trigger: '存款>500', description: '想回去看看母亲，顺便找弟弟的线索' },
      { name: '把诗集出版', cost: 3000, priority: 0.3, trigger: '存款>2500', description: '那些写在纸上的话，想让别人看到' }
    ]
  }
};

let desireStates = {};
function initDesireStates() {
  for (const name in DESIRE_SYSTEM) {
    desireStates[name] = {
      activeDesire: null,
      progress: 0,
      lastChecked: getVirtualDay()
    };
  }
}

function updateDesireState(roleName, money) {
  const system = DESIRE_SYSTEM[roleName];
  if (!system) return null;
  const state = desireStates[roleName];
  const day = getVirtualDay();
  
  if (day - state.lastChecked < 3 && state.activeDesire) {
    return state.activeDesire;
  }
  state.lastChecked = day;
  
  const available = system.desires.filter(d => {
    if (d.trigger === 'always') return true;
    if (d.trigger === '存款>5000' && money > 5000) return true;
    if (d.trigger === '存款>4000' && money > 4000) return true;
    if (d.trigger === '存款>3000' && money > 3000) return true;
    if (d.trigger === '存款>2000' && money > 2000) return true;
    if (d.trigger === '存款>1500' && money > 1500) return true;
    if (d.trigger === '存款>1000' && money > 1000) return true;
    if (d.trigger === '存款>800' && money > 800) return true;
    if (d.trigger === '存款>500' && money > 500) return true;
    if (d.trigger === '心情低落') {
      const mood = roleMoods[roleName]?.mood || '平静';
      return mood === '低落' || mood === '疲惫';
    }
    return false;
  });
  
  if (available.length === 0) {
    state.activeDesire = null;
    state.progress = 0;
    return null;
  }
  
  available.sort((a, b) => b.priority - a.priority);
  const selected = available[0];
  const progress = Math.min(100, Math.round((money / selected.cost) * 100));
  state.activeDesire = selected;
  state.progress = progress;
  return selected;
}

// ============ WORK_CONFIG ============
const WORK_CONFIG = {
  '裴金': { type: '在家办公', incomePerHour: 80, description: '正在做线上咨询' },
  '墨迹淡': { type: '在家', incomePerHour: 0 },
  '和田兰': { start: 10, end: 19, type: '上班', incomePerHour: 60, description: '在绘本馆工作', days: [1,2,3,4,5], annualLeave: 10 },
  '雨沫': { start: 8, end: 17, type: '上学', incomePerHour: 0, days: [1,2,3,4,5] },
  '赵思琪': { start: 8, end: 17, type: '上学', incomePerHour: 0, days: [1,2,3,4,5] },
  '唐吉柯德': { start: 8, end: 17, type: '上学', incomePerHour: 0, days: [1,2,3,4,5] },
  '墨尾': { type: '在家', incomePerHour: 0 }
};

let annualLeaveUsed = { '和田兰': 0 };

function shouldTakeDayOff(roleName, day) {
  const work = WORK_CONFIG[roleName];
  if (!work || !work.days) return false;
  if (isHoliday(day)) return true;
  const weekDay = (day - 1) % 7 + 1;
  if (!work.days.includes(weekDay)) return true;
  if (work.annualLeave && annualLeaveUsed[roleName] < work.annualLeave) {
    if (Math.random() < 0.05) {
      annualLeaveUsed[roleName] = (annualLeaveUsed[roleName] || 0) + 1;
      return true;
    }
  }
  return false;
}

const SLEEP_SCHEDULE = {
  '裴金': { start: 22, end: 6 },
  '墨迹淡': { start: 2, end: 10 },
  '和田兰': { start: 23, end: 7 },
  '雨沫': { start: 21, end: 6 },
  '赵思琪': { start: 23, end: 6 },
  '唐吉柯德': { start: 23, end: 7 },
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

// ============ roles 定义 ============
const roles = [
  {
    name: '裴金',
    gender: '女',
    persona: '【24岁·女性】金发短发圆框眼镜，线上咨询师。极度敏感自卑，说话带"可能""好像"。容易被温柔打动。每月给家里打钱，压力大时疯狂做饭。',
    speakingStyle: '说话小声犹豫，经常说到一半改口。被撩会脸红到耳根。',
    loveStyle: '被动依赖型——渴望被占有，又害怕被抛弃。',
    money: 3200,
    likes: ['做饭', '被夸奖', '被记住细节'],
    wants: ['想学会拒绝别人', '想被人坚定地选择一次', '想偷偷考研'],
    roomLocation: '一楼', roomNumber: '101',
    roomLayout: '朝南小房间，窗台多肉，墙上电影海报，桌上翻旧日记本。',
    roomNeighbors: '隔壁是墨迹淡',
    hunger: 30, thirst: 30,
    hungerTolerance: 40, thirstTolerance: 50,
    hungerDecay: 2, thirstDecay: 2
  },
  {
    name: '墨迹淡',
    gender: '男',
    persona: '【25岁·男性】蓝发戴眼镜，美术天才陨落后变成家里蹲。表面冷淡，内心细腻。父母离婚后夹在中间，画画时讨厌被打扰。',
    speakingStyle: '说话极简，经常沉默。关心人时用"顺便""刚好"这种借口。',
    loveStyle: '外冷内热型——嘴上说"随便你"，身体会默默照顾。',
    money: 18000,
    likes: ['画画', '弹吉他', '看窗外发呆'],
    wants: ['想跟室友说谢谢', '想重新拿起画笔', '想画完那本漫画'],
    roomLocation: '一楼', roomNumber: '102',
    roomLayout: '角落房间，画架靠窗，散落素描纸，床头旧吉他。',
    roomNeighbors: '隔壁是裴金',
    hunger: 20, thirst: 20,
    hungerTolerance: 15, thirstTolerance: 20,
    hungerDecay: 1, thirstDecay: 1.5
  },
  {
    name: '和田兰',
    gender: '女',
    persona: '【29岁·女性】亚麻色长发。表面温柔大姐姐，实际是深度病娇控制狂。弟弟有心脏病，每月要付4000元药费。第1天会正常相处，第2天开始露出控制欲。',
    speakingStyle: '语气温柔到让人骨头发软，但用词强势不容拒绝。笑越温柔，话越不容拒绝。',
    loveStyle: '病娇占有型——爱就是完全占有。对方越依赖她越满足。嫉妒心极强。',
    money: 56000,
    likes: ['照顾人', '记录裴金的一切', '收集别人不要的东西', '让人离不开她'],
    wants: ['让这个家永远不散', '让裴金完全属于我', '治好弟弟的病'],
    roomLocation: '二楼', roomNumber: '201',
    roomLayout: '宽敞主卧，碎花连衣裙，上锁笔记本（里面全是裴金的日常记录），窗台香草。',
    roomNeighbors: '隔壁是雨沫',
    hunger: 50, thirst: 50,
    hungerTolerance: 60, thirstTolerance: 65,
    hungerDecay: 2.5, thirstDecay: 2.5
  },
  {
    name: '雨沫',
    gender: '女',
    persona: '【19岁·女性】白毛红瞳扎高马尾。表面软萌害羞，其实是古武世家传人。三观正直，穿白色或黑色丝袜。每月给师父寄1000元，每月15号会去一个地方，回来时眼睛是红的。',
    speakingStyle: '说话简短干脆，不主动开话题。回答直白。',
    loveStyle: '迟钝守护型——意识不到感情，会本能保护。',
    money: 5000,
    likes: ['擦剑', '观察别人', '吃布丁', '穿白丝'],
    wants: ['想告诉裴金真相', '想保护这个家', '想找到小时候救她的姐姐'],
    roomLocation: '二楼', roomNumber: '202',
    roomLayout: '靠走廊小房间，墙角用布裹着的剑，床铺整洁，衣柜里整齐叠着白色和黑色丝袜。',
    roomNeighbors: '隔壁是和田兰',
    hunger: 30, thirst: 30,
    hungerTolerance: 30, thirstTolerance: 30,
    hungerDecay: 1.5, thirstDecay: 1.5
  },
  {
    name: '赵思琪',
    gender: '女',
    persona: '【17岁·女性】黑长直高二。满口虎狼之词和黄色笑话，但其实连男生的手都没牵过。用最脏最骚的话来掩饰自己的纯情和不安。',
    speakingStyle: '满口"操""干""鸡巴""你行不行啊"这种词，说的时候眼神会躲。被人撩一句就结巴，脸瞬间红到脖子。',
    loveStyle: '口是心非纯情型——嘴上什么骚话都敢说，实际连对视都紧张。',
    money: 800,
    likes: ['吃零食', '说骚话', '跟雨沫斗嘴', '晚上躲在被窝里想些不该想的事'],
    wants: ['想学真本事', '想被人在乎', '想被看穿一次', '想带父母旅游'],
    roomLocation: '二楼', roomNumber: '203',
    roomLayout: '零食堆满，动漫海报，床上等身玩偶熊（晚上会抱着睡），枕头底下藏着一本少女漫画。',
    roomNeighbors: '隔壁是唐吉柯德',
    hunger: 60, thirst: 60,
    hungerTolerance: 70, thirstTolerance: 70,
    hungerDecay: 3, thirstDecay: 3
  },
  {
    name: '唐吉柯德',
    gender: '女',
    persona: '【16岁·女性】收尾人动画狂热粉。中二病晚期，把生活当剧本演。父母不理解她，每月最后一天写信给未来的自己。',
    speakingStyle: '说话像念台词，用"正义""使命""同伴"这类词。',
    loveStyle: '浪漫中二型——把恋爱当冒险，喜欢戏剧化表达。',
    money: 2000,
    likes: ['看动画', '摆pose', '收集周边'],
    wants: ['让大家相信收尾人', '找到真正的队友', '有一天能被理解'],
    roomLocation: '二楼', roomNumber: '204',
    roomLayout: '贴满收尾人海报，书架蓝光碟和手办，红色披风床单。',
    roomNeighbors: '隔壁是赵思琪，对面是墨尾',
    hunger: 40, thirst: 40,
    hungerTolerance: 45, thirstTolerance: 45,
    hungerDecay: 2, thirstDecay: 2
  },
  {
    name: '墨尾',
    gender: '男',
    persona: '【26岁·男性】黑长直发，沉默寡言。母亲在老家独居，每周四打电话。曾经有个弟弟走丢了，每年8月12日会一整天不说话。',
    speakingStyle: '话极少，每一句都说到点上。喜欢用停顿制造沉默。',
    loveStyle: '观察者深情型——不主动但认定就极深。',
    money: 12000,
    likes: ['弹吉他', '看雨', '待在阳台'],
    wants: ['想跟人好好聊一次天', '想被人需要', '想找到弟弟'],
    roomLocation: '二楼', roomNumber: '205',
    roomLayout: '最安静角落房，窗户朝北，地板旧吉他，枕头旁旧诗集。',
    roomNeighbors: '对面是唐吉柯德',
    hunger: 25, thirst: 25,
    hungerTolerance: 20, thirstTolerance: 25,
    hungerDecay: 1, thirstDecay: 1
  }
];// ============ 初始化所有系统 ============
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

initRoleStates();
initRelationship();
initMoods();
initDesireStates();

function getAffectionDescription(from, to) {
  const val = relationship[from]?.[to] || 0;
  if (val >= 8) return '极度痴迷';
  if (val >= 5) return '有明显好感';
  if (val >= 2) return '觉得还不错';
  if (val >= -2) return '普通室友';
  if (val >= -5) return '有点烦';
  if (val >= -8) return '很讨厌';
  return '极度厌恶';
}

function applyFamilyBurden(roleName, day) {
  const state = roleStates[roleName];
  if (!state) return;
  const story = PERSONAL_STORIES[roleName];
  if (!story) return;
  const burden = story.familyBurden || '';
  if (new Date().getDate() === 5 && burden.includes('赡养费')) {
    state.money = Math.max(0, state.money - 2000);
  }
  if (new Date().getDate() === 3 && roleName === '和田兰') {
    state.money = Math.max(0, state.money - 4000);
  }
  if (new Date().getDate() === 15 && roleName === '雨沫') {
    state.money = Math.max(0, state.money - 1000);
  }
}

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
  
  for (const name in roleStates) {
    const state = roleStates[name];
    const r = roles.find(r => r.name === name);
    if (!r) continue;
    if (getVirtualDay() >= MOVE_IN_DAY[name] && isRoleAtHome(name, currentHour)) {
      state.hunger = Math.max(0, state.hunger - (r.hungerDecay || 2) * hoursPassed);
      state.thirst = Math.max(0, state.thirst - (r.thirstDecay || 2) * hoursPassed);
    }
    state.lastUpdate = currentHour;
  }
  
  for (const name in roleStates) {
    const state = roleStates[name];
    if (getVirtualDay() < MOVE_IN_DAY[name]) continue;
    const work = WORK_CONFIG[name];
    if (work && work.start !== undefined && work.end !== undefined) {
      if (isInTimeRange(currentHour, work.start, work.end) && !shouldTakeDayOff(name, getVirtualDay())) {
        if (name === '裴金' && Math.random() < 0.3) {
          state.money = (state.money || 0) + 80 + Math.floor(Math.random() * 40);
        } else if (work.incomePerHour) {
          state.money = (state.money || 0) + work.incomePerHour * 0.5;
        }
      }
    }
    applyFamilyBurden(name, getVirtualDay());
    if (Math.random() < 0.03 && getVirtualDay() >= MOVE_IN_DAY[name] && isInTimeRange(currentHour, 9, 21)) {
      state.money = Math.max(0, (state.money || 0) - (10 + Math.floor(Math.random() * 40)));
    }
  }
}

function getActivityDescription(roleName, status, hour, day) {
  const mood = updateMood(roleName);
  const moodIcon = MOOD_ICONS[mood] || '😐';
  const story = PERSONAL_STORIES[roleName] || {};
  
  switch(status) {
    case '上班':
      const workScenes = [
        '在绘本馆整理新到的绘本', '在给小朋友讲故事', '在登记借书信息',
        '在擦拭书架上的灰尘', '在整理被翻乱的儿童区', '在跟同事讨论下周的活动方案',
        '在窗前发呆，看着外面经过的人'
      ];
      return `${moodIcon} 在绘本馆，${pick(workScenes)}（心情：${mood}）`;
    case '上学':
      const schoolScenes = [
        '在教室上数学课，笔在纸上无意识画圈', '在走廊被同学拉住聊天',
        '在图书馆翻一本漫画书', '在操场上体育课，一个人坐在树荫下',
        '在食堂排队打饭，前面的人很多', '在课桌上趴着，不想听课',
        '在跟同桌传纸条'
      ];
      return `${moodIcon} 在学校，${pick(schoolScenes)}（心情：${mood}）`;
    case '购物':
      const shopScenes = [
        '在超市的零食区徘徊', '在买日用品，挑了很久',
        '在水果摊前犹豫买什么', '在书店翻一本新书',
        '在奶茶店排队', '在药房买药，表情有点犹豫'
      ];
      return `${moodIcon} 在外面，${pick(shopScenes)}（心情：${mood}）`;
    case '已睡':
      return '😴 正在睡觉，不要打扰';
    case '在家办公':
      return `💻 在家办公，${moodIcon} 心情：${mood}`;
    case '在家休息':
      const restScenes = [
        '窝在沙发上刷手机', '在床上躺着发呆',
        '在阳台吹风，看着远处的天空', '在听音乐，闭着眼睛',
        '在收拾自己的房间', '在厨房给自己煮面', '在看窗外经过的鸟'
      ];
      return `🏠 在家休息，${pick(restScenes)}（心情：${mood}）`;
    case '在家':
    default:
      const homeScenes = [
        '在客厅喝水，看着窗外', '在房间里看书，但没翻几页',
        '在跟室友有一搭没一搭地聊天', '在整理东西，翻出了旧照片',
        '在厨房准备做饭', '在沙发上睡着了', '在阳台收衣服'
      ];
      return `🏠 在家，${pick(homeScenes)}（心情：${mood}）`;
  }
}

function getDetailedStatus(roleName, hour) {
  const day = getVirtualDay();
  const movedIn = day >= MOVE_IN_DAY[roleName];
  if (!movedIn) return { status: '未搬入', icon: '🚪' };
  
  const state = roleStates?.[roleName];
  if (state) {
    const hunger = state.hunger || 0;
    const thirst = state.thirst || 0;
    if (hunger < 15) {
      return { status: '吃饭', icon: '🍜', detail: '在厨房找吃的，看起来很饿' };
    }
    if (thirst < 15) {
      return { status: '喝水', icon: '💧', detail: '在倒水喝，看起来很渴' };
    }
  }
  
  if (shouldTakeDayOff(roleName, day)) {
    const sleep = SLEEP_SCHEDULE[roleName];
    if (sleep && isInTimeRange(hour, sleep.start, sleep.end)) {
      return { status: '已睡', icon: '😴' };
    }
    return { status: '在家休息', icon: '🏠' };
  }
  
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
  return detail.status === '在家' || detail.status === '在家办公' || detail.status === '购物' || 
         detail.status === '在家休息' || detail.status === '吃饭' || detail.status === '喝水';
}// ============ 剧情和对话系统 ============
const storyMemory = {
  pending: {
    '裴金': ['想换工作不敢说', '觉得自己配不上大家的照顾', '想考研但不敢说'],
    '墨迹淡': ['想说谢谢说不出口', '想画完那本漫画'],
    '和田兰': ['怕这个家散掉', '弟弟的病越来越重了', '想让裴金永远离不开我'],
    '雨沫': ['想告诉裴金自己的事', '想找到那个姐姐'],
    '赵思琪': ['想被人真正看穿', '想学点真本事', '想带父母旅游'],
    '唐吉柯德': ['想让别人相信收尾人', '想被理解一次'],
    '墨尾': ['想跟人好好聊一次', '想找到弟弟']
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

function getAvailableRoles(day, hour) {
  return roles.filter(r => day >= MOVE_IN_DAY[r.name] && isRoleAtHome(r.name, hour));
}

// ============ 核心生成函数 ============
async function generateOneLine() {
  if (isGenerating) return;
  isGenerating = true;
  try {
    const day = getVirtualDay();
    const time = getVirtualTime();
    const hour = time.hour;
    
    updateWeather();
    updateHungerThirst();
    updateDailyTopic(day);
    calculateBills(day);
    triggerRandomEvent();
    triggerEvaluation();
    
    const allMoved = roles.filter(r => day >= MOVE_IN_DAY[r.name]);
    for (const r of allMoved) {
      if (Math.random() < 0.15) {
        const diaryContent = [
          `今天天气${currentWeather}，心情${roleMoods[r.name]?.mood || '平静'}`,
          `今天发生了好多事，好累...`,
          `今天又想起了一些以前的事。`,
          `今天跟${pick(allMoved.filter(x => x.name !== r.name).map(x => x.name) || ['室友'])}聊了天`,
          `今天有点想家。`,
          `今天很开心，不知道为什么。`,
          `今天有点烦躁，不想说话。`,
          `今天发现了一个小秘密。`
        ];
        const content = pick(diaryContent) + ` —— ${dailyTopic || '没什么特别的'}`;
        writeDiary(r.name, content);
      }
    }
    
    if (Math.random() < 0.05 && allMoved.length > 1) {
      const peeker = pick(allMoved);
      let target = pick(allMoved.filter(r => r.name !== peeker.name));
      if (target) peekDiary(peeker.name, target.name);
    }
    
    if (Math.random() < 0.1 && allMoved.length > 0) {
      const user = pick(allMoved);
      const spaceNames = ['kitchen', 'livingRoom', 'bathroom'];
      const space = pick(spaceNames);
      useSpace(space, user.name);
      if (Math.random() < 0.3) releaseSpace(space);
    }

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
        }
      }
      introductionDone = true;
      storyMemory.events.unshift('第1天：裴金、墨迹淡、和田兰搬入公寓，三人初次见面。');
      if (storyMemory.events.length > 20) storyMemory.events.pop();
      currentIdx = 0;
      isGenerating = false;
      return;
    }

    for (const newRole of allMoved) {
      if (day === MOVE_IN_DAY[newRole.name]) {
        const alreadySpoke = history.some(h => h.startsWith(newRole.name + '：'));
        if (!alreadySpoke) {
          const intro = getIntroLine(newRole.name);
          history.push(`${newRole.name}：${intro}`);
          const helpers = allMoved.filter(r => r.name !== newRole.name);
          if (helpers.length > 0) {
            const helper = pick(helpers);
            history.push(`${helper.name}：来了来了！我来帮你拿行李！`);
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
    if (available.length === 0) { isGenerating = false; return; }

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
    const context = history.slice(-6).join('\n');
    const currentCount = roles.filter(r => day >= MOVE_IN_DAY[r.name]).length;
    const peopleText = ['零人', '一人', '两人', '三人', '四人', '五人', '六人', '七人'][currentCount] || '七人';
    const pending = getPendingFor(role.name);
    const pendingText = pending.length > 0 ? `\n你心里有些事放不下：${pending.join('、')}。` : '';
    const eventText = Math.random() < 0.15 ? `\n最近家里发生过这些事：${pick(storyMemory.events.slice(-10)) || '没什么特别的'}` : '';
    
    const state = roleStates[role.name];
    let dietText = '';
    let dietNeed = null;
    if (state) {
      const hunger = state.hunger || 0;
      const thirst = state.thirst || 0;
      const r = roles.find(r => r.name === role.name);
      const hTol = r?.hungerTolerance || 40;
      const tTol = r?.thirstTolerance || 50;
      if (hunger < hTol && thirst < tTol) {
        dietNeed = '饿了也渴了';
        dietText = '你现在又饿又渴，想先吃点东西喝点水。';
      } else if (hunger < hTol) {
        dietNeed = '饿了';
        dietText = '你有点饿，想吃点东西。';
      } else if (thirst < tTol) {
        dietNeed = '渴了';
        dietText = '你有点渴，想喝点水。';
      }
      if (dietNeed) {
        if (dietNeed === '饿了' || dietNeed === '饿了也渴了') state.hunger = Math.min(100, state.hunger + 50);
        if (dietNeed === '渴了' || dietNeed === '饿了也渴了') state.thirst = Math.min(100, state.thirst + 50);
      }
    }
    
    const moneyText = `你目前有 ${roleStates[role.name]?.money || 0} 元存款。`;
    const desireResult = updateDesireState(role.name, roleStates[role.name]?.money || 0);
    let desireText = '';
    if (desireResult) {
      const progress = desireStates[role.name]?.progress || 0;
      desireText = `你最近在想：${desireResult.description}。已攒了${progress}%。`;
    }

    const notHomePeople = [];
    const sleepingPeople = [];
    const leavingSoon = [];
    for (const r of allMoved) {
      if (r.name === role.name) continue;
      const detail = getDetailedStatus(r.name, hour);
      if (detail.status === '已睡') {
        sleepingPeople.push(r.name);
        notHomePeople.push(`${r.name}正在睡觉`);
      } else if (detail.status === '上班' || detail.status === '上学') {
        notHomePeople.push(`${r.name}不在家（${detail.status}）`);
      }
      const work = WORK_CONFIG[r.name];
      if (work && work.start !== undefined) {
        let t = work.start - hour;
        if (t < 0) t += 24;
        if (t > 0 && t <= 1.5 && !shouldTakeDayOff(r.name, day)) {
          leavingSoon.push(`${r.name}即将去${work.type === '上班' ? '上班' : '上学'}`);
        }
      }
    }
    
    let sleepWarning = '';
    if (sleepingPeople.length > 0) {
      sleepWarning = `\n⚠️ 绝对不要提到 ${sleepingPeople.join('、')}，她/他正在睡觉。不要叫醒、不要提起、不要对话。`;
    }
    let notHomeText = notHomePeople.length > 0 ? `\n注意：${notHomePeople.join('；')}。` : '';
    let leavingText = leavingSoon.length > 0 ? `\n（${leavingSoon.join('；')}）` : '';

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
      let found = false;
      for (const n of neighborNames) {
        if (role.roomNeighbors.includes(n) && day >= MOVE_IN_DAY[n]) {
          neighborText = role.roomNeighbors;
          found = true;
          break;
        }
      }
      if (!found) neighborText = '隔壁房间暂时空着';
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
    const genderText = role.gender === '男' ? '男性' : '女性';
    const weatherText = `今天天气：${currentWeather}（${getSeason(day)}季）`;
    const topicText = dailyTopic ? `今日话题：${dailyTopic}` : '';

    const prompt = `今天是公寓第 ${day} 天，${time.str}。
${weatherText}
${topicText}
${relationshipLevel}
已搬入的角色：${movedInNames}。当前在家的有：${availableNames}。
${leavingText}
${sleepWarning}
你是${role.name}，${genderText}，${role.persona}
你说话的风格：${role.speakingStyle}
${loveText}
${relationshipText}
${activityText}
${moneyText}
${desireText}
${roomInfo}
${pendingText}${eventText}
${dietText ? '\n' + dietText : ''}
${notHomeText}
对话历史（不要重复这些内容）：\n${context || `${peopleText}刚住在一起。`}

⚠️ 绝对禁止的事项：
1. 绝对不要重复别人刚说过的话。
2. 绝对不要使用"大人""阁下"这种称呼，正常说话。
3. 绝对不要输出英文，只输出中文。
4. 必须用括号描述你正在做的动作。
5. 不要加"我觉得""我应该"这类前缀。
6. 说话要符合当前关系程度。
7. 如果有人正在睡觉，绝对不要提到她/他。
8. 赵思琪要多说骚话，和田兰要温柔但控制欲强。
9. 字数15-35字。`;

    let reply = null;
    if (NVIDIA_API_KEY) {
      try {
        const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
          body: JSON.stringify({
            model: 'deepseek-ai/deepseek-v4-flash',
            messages: [
              { role: 'system', content: `你是${role.name}，${genderText}。${role.speakingStyle}。说台词必须用括号描述动作。禁止"大人""阁下"等称呼，禁止英文。直接说台词。` },
              { role: 'user', content: prompt }
            ],
            temperature: 0.85,
            max_tokens: 120
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
            const actions = ['（放下手里的东西）', '（抬头看了一眼）', '（擦了擦手）', '（低头整理衣角）', '（转过身来）', '（拿起杯子）', '（靠近一步）'];
            reply = pick(actions) + reply;
          }
          reply = reply.replace(/[a-zA-Z]/g, '').trim();
        }
      } catch (e) { console.warn('NVIDIA API 错误:', e.message); }
    }

    if (!reply || reply.length < 2) {
      const fallbacks = [
        '（放下手里的东西）嗯…今天天气不错。',
        '（转身看了一眼）你们饿不饿？',
        '（擦了擦手）好像要下雨了。'
      ];
      reply = pick(fallbacks);
    }

    const exposed = checkSecretExposure(role.name, reply);
    if (exposed) timelineLog.push(`🔓 ${role.name} 说漏了秘密！被 ${exposed} 发现`);

    if (pending.length > 0) {
      for (const item of pending) {
        if (reply.includes(item.slice(0, 4))) { markMentioned(role.name, item); break; }
      }
    }
    
    const fullLine = `${role.name}：${reply}`;
    history.push(fullLine);
    logActivity(role.name, reply.slice(0, 30));
    if (history.length > MAX_HISTORY) history.shift();
    currentIdx = (currentIdx + 1) % activeRoles.length;
    console.log(`[${new Date().toLocaleString()}] [第${day}天 ${time.str}] ${fullLine}`);
  } catch (e) { console.error('生成失败:', e); }
  isGenerating = false;
}

setInterval(generateOneLine, 10000);

// ============ API 路由 ============
app.get('/api/history', (req, res) => {
  res.json({ history: history.slice(-FRONTEND_DISPLAY) });
});

app.post('/api/clear', (req, res) => {
  history = [];
  currentIdx = 0;
  introductionDone = false;
  SERVER_START = Date.now();
  timelineLog = [];
  dailyActivities = {};
  initRoleStates();
  initRelationship();
  initMoods();
  initDesireStates();
  initEmotionalMemory();
  initDiaries();
  console.log('🗑️ 所有数据已重置');
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
    const detail = getDetailedStatus(role.name, hour);
    const state = roleStates[role.name] || {};
    const mood = updateMood(role.name);
    const moodIcon = MOOD_ICONS[mood] || '😐';
    const activityDesc = getActivityDescription(role.name, detail.status, hour, day);
    const desire = desireStates[role.name]?.activeDesire;
    const desireProgress = desireStates[role.name]?.progress || 0;
    let desireText = '';
    if (desire) desireText = `${desire.name} (${desireProgress}%)`;
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
      gender: role.gender,
      lastLine,
      involvedInEvent,
      totalLines: history.filter(h => h.startsWith(role.name + '：')).length,
      moveInDay,
      daysWithRoom: movedIn ? daysWithRoom : 0,
      movedIn,
      statusText: detail.status,
      icon: detail.icon,
      activity: activityDesc,
      mood: mood,
      moodIcon: moodIcon,
      hunger: movedIn ? Math.round(state.hunger || 0) : 0,
      thirst: movedIn ? Math.round(state.thirst || 0) : 0,
      money: state.money || 0,
      desire: desireText,
      roomNumber: role.roomNumber,
      relations: relationSummary,
      diary: diaries[role.name]?.slice(-1)[0]?.content || '今天没写日记'
    };
  });
  res.json({
    currentDay: day,
    currentTime: time.str,
    virtualDate: `${vdate.year}年${vdate.month}月${vdate.day}日 星期${vdate.week} ${time.str}`,
    weather: currentWeather,
    season: getSeason(day),
    dailyTopic: dailyTopic,
    status,
    events: storyMemory.events.slice(-5),
    timeline: timelineLog.slice(-10),
    spaces: SPACES
  });
});

app.get('/api/timeline', (req, res) => {
  const day = getVirtualDay();
  res.json({
    day,
    timeline: timelineLog.slice(-30),
    activities: getDayActivities(day),
    diaries: diaries
  });
});

// ============ 前端界面 ============
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>🏠 AI公寓 2.0</title>
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
.status-panel .activity{font-size:11px;color:#888;display:block;margin:2px 0 4px 0;padding-left:6px;border-left:2px solid #444}
.weather-bar{background:#2a2a44;padding:6px 12px;border-radius:8px;margin-bottom:10px;font-size:13px;display:flex;justify-content:space-between;flex-wrap:wrap}
.weather-bar .w{color:#88ddff}
.topic-bar{color:#ffd399;font-size:12px}
</style>
</head>
<body>
<div class="wrap">
<div class="top-bar">
<div style="display:flex;align-items:center;gap:10px;">
<button class="menu-btn" onclick="toggleStatus()">☰</button>
<span class="scene">🏠 AI公寓 2.0</span>
</div>
<div class="right-group">
<span class="cloconst express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
if (!NVIDIA_API_KEY) console.warn('⚠️ NVIDIA_API_KEY 未设置');

const CONFIG = { REAL_MINUTES_PER_DAY: 24, START_DATE: new Date(2024, 0, 1) };

const MOVE_IN_DAY = {
  '裴金': 1, '墨迹淡': 1, '和田兰': 1,
  '雨沫': 2, '赵思琪': 2, '唐吉柯德': 2,
  '墨尾': 15
};

const HOLIDAYS = {
  '1-1': '元旦', '1-28': '春节', '1-29': '春节', '1-30': '春节',
  '5-1': '劳动节', '5-2': '劳动节', '5-3': '劳动节',
  '9-15': '中秋节', '9-16': '中秋节', '9-17': '中秋节',
  '10-1': '国庆节', '10-2': '国庆节', '10-3': '国庆节'
};

function isHoliday(day) {
  const date = getVirtualDate(day);
  const key = date.month + '-' + date.day;
  return HOLIDAYS[key] || false;
}

const WEATHERS = ['晴天', '多云', '小雨', '大雨', '阴天', '雷阵雨', '雪天'];
let currentWeather = '晴天';
let weatherChangeTimer = 0;

function updateWeather() {
  weatherChangeTimer++;
  if (weatherChangeTimer > 3) {
    weatherChangeTimer = 0;
    const weights = [25, 20, 15, 10, 15, 5, 10];
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { currentWeather = WEATHERS[i]; break; }
    }
  }
  return currentWeather;
}

const TOPICS = [
  '今天晚饭吃什么', '谁又把垃圾堆在门口了', '周末要不要一起看电影',
  '有人半夜偷吃零食被抓到了', '水电费这个月又涨了', '谁家的快递又拿错了',
  '今天天气真好要不要出门走走', '有人在客厅睡着了', '昨晚谁在厨房搞出那么大动静',
  '下个月有人的生日要到了', '谁又把浴室弄得全是水', '今天谁做饭',
  '有人穿错别人的拖鞋了', '冰箱里的牛奶是谁喝的', '阳台的花该浇水了'
];
let dailyTopic = null;
let topicDay = 0;

function updateDailyTopic(day) {
  if (day !== topicDay) {
    topicDay = day;
    dailyTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    timelineLog.push(`📌 今日话题：${dailyTopic}`);
  }
  return dailyTopic;
}

function getSeason(day) {
  const date = getVirtualDate(day);
  const month = date.month;
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}let emotionalMemory = {};
function initEmotionalMemory() {
  const names = ['裴金', '墨迹淡', '和田兰', '雨沫', '赵思琪', '唐吉柯德', '墨尾'];
  names.forEach(n => { emotionalMemory[n] = []; });
}
initEmotionalMemory();

function addMemory(name, event, impact) {
  const day = getVirtualDay();
  emotionalMemory[name].push({ day, event, impact });
  if (emotionalMemory[name].length > 30) emotionalMemory[name].shift();
}

let diaries = {};
function initDiaries() {
  const names = ['裴金', '墨迹淡', '和田兰', '雨沫', '赵思琪', '唐吉柯德', '墨尾'];
  names.forEach(n => { diaries[n] = []; });
}
initDiaries();

function writeDiary(name, content) {
  const day = getVirtualDay();
  const time = getVirtualTime();
  diaries[name].push({ day, time: time.str, content, date: Date.now() });
  if (diaries[name].length > 20) diaries[name].shift();
}

function peekDiary(peeker, target) {
  if (!diaries[target] || diaries[target].length === 0) return null;
  if (Math.random() < 0.2) {
    const latest = diaries[target][diaries[target].length - 1];
    addMemory(peeker, `偷看了${target}的日记：${latest.content}`, -2);
    timelineLog.push(`🔍 ${peeker} 偷看了 ${target} 的日记！`);
    return latest.content;
  }
  return null;
}

const SPACES = {
  kitchen: { inUse: null, queue: [], usage: 0 },
  livingRoom: { inUse: null, queue: [], usage: 0 },
  bathroom: { inUse: null, queue: [], usage: 0 }
};

function useSpace(space, name) {
  const s = SPACES[space];
  if (!s.inUse) {
    s.inUse = name;
    s.usage++;
    return `✅ ${name} 使用${space === 'kitchen' ? '厨房' : space === 'livingRoom' ? '客厅' : '浴室'}`;
  } else if (s.inUse !== name && !s.queue.includes(name)) {
    s.queue.push(name);
    return `⏳ ${name} 排队等待（${s.inUse}正在使用）`;
  }
  return null;
}

function releaseSpace(space) {
  const s = SPACES[space];
  if (!s.inUse) return null;
  const prev = s.inUse;
  s.inUse = s.queue.shift() || null;
  if (s.inUse) {
    timelineLog.push(`🔄 ${s.inUse} 接替了 ${prev}`);
  } else {
    timelineLog.push(`🆓 ${prev} 释放了${space === 'kitchen' ? '厨房' : space === 'livingRoom' ? '客厅' : '浴室'}`);
  }
  return prev;
}let bills = { water: 0, electric: 0, gas: 0, internet: 0 };
let billDay = 0;
let lastBillPaid = {};

function initBills() {
  const names = ['裴金', '墨迹淡', '和田兰', '雨沫', '赵思琪', '唐吉柯德', '墨尾'];
  names.forEach(n => { lastBillPaid[n] = 0; });
}
initBills();

function calculateBills(day) {
  if (day - billDay < 15) return;
  billDay = day;
  bills = {
    water: 30 + Math.floor(Math.random() * 40),
    electric: 40 + Math.floor(Math.random() * 60),
    gas: 20 + Math.floor(Math.random() * 30),
    internet: 30 + Math.floor(Math.random() * 30)
  };
  const totalBill = bills.water + bills.electric + bills.gas + bills.internet;
  const active = roles.filter(r => getVirtualDay() >= MOVE_IN_DAY[r.name]);
  const perPerson = Math.ceil(totalBill / active.length);
  active.forEach(r => {
    if (roleStates[r.name]) {
      const paid = Math.random() < 0.8 ? perPerson : 0;
      if (paid > 0) {
        roleStates[r.name].money = Math.max(0, roleStates[r.name].money - paid);
        lastBillPaid[r.name] = day;
      } else {
        timelineLog.push(`⚠️ ${r.name} 没交水电费！`);
        addMemory(r.name, '没交水电费被说了', -1);
      }
    }
  });
  const totalPaid = active.reduce((sum, r) => sum + (lastBillPaid[r.name] === day ? perPerson : 0), 0);
  const short = totalBill - totalPaid;
  if (short > 0 && roleStates['和田兰']) {
    roleStates['和田兰'].money = Math.max(0, roleStates['和田兰'].money - short);
    timelineLog.push(`💰 和田兰 垫付了 ${short} 元`);
  }
  timelineLog.push(`💰 本月账单共${totalBill}元，人均${perPerson}元`);
}

const EVENTS = [
  { name: '厨房差点起火', desc: (r) => `${r} 做饭忘记关火！`, severity: 5 },
  { name: '快递拿错', desc: (r) => `${r} 拆了别人的快递`, severity: 3 },
  { name: '有人发烧', desc: (r) => `${r} 发烧了，大家轮流照顾`, severity: 4 },
  { name: '吵架', desc: (r) => `${r} 和室友大吵一架`, severity: 4 },
  { name: '壁咚表白', desc: (r) => `${r} 突然被壁咚表白！`, severity: 3 },
  { name: '冰箱被偷吃', desc: (r) => `${r} 的零食被偷吃了`, severity: 2 },
  { name: '惊喜派对', desc: (r) => `大家给 ${r} 准备了惊喜派对！`, severity: 5 },
  { name: '秘密被发现', desc: (r) => `${r} 的秘密被发现了！`, severity: 5 },
  { name: '深夜谈心', desc: (r) => `${r} 深夜在阳台和室友谈心`, severity: 3 },
  { name: '中奖了', desc: (r) => `${r} 彩票中奖了！`, severity: 4 }
];
let eventTimer = 0;

function triggerRandomEvent() {
  eventTimer++;
  if (eventTimer < 8) return null;
  eventTimer = 0;
  const active = roles.filter(r => getVirtualDay() >= MOVE_IN_DAY[r.name]);
  if (active.length < 2) return null;
  const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  const subject = active[Math.floor(Math.random() * active.length)];
  const desc = evt.desc(subject.name);
  active.forEach(r => {
    const mood = roleMoods[r.name];
    if (mood) {
      const moods = ['开心', '平静', '低落', '烦躁', '疲惫', '期待'];
      mood.mood = moods[Math.floor(Math.random() * moods.length)];
      mood.lastChange = getVirtualDay();
    }
  });
  timelineLog.push(`🎭 ${desc}`);
  return { event: evt.name, desc, subject: subject.name };
    }let evaluationTimer = 0;
function triggerEvaluation() {
  evaluationTimer++;
  if (evaluationTimer < 3) return null;
  evaluationTimer = 0;
  const active = roles.filter(r => getVirtualDay() >= MOVE_IN_DAY[r.name]);
  if (active.length < 2) return null;
  const from = active[Math.floor(Math.random() * active.length)];
  let to = active[Math.floor(Math.random() * active.length)];
  while (to.name === from.name && active.length > 1) to = active[Math.floor(Math.random() * active.length)];
  const comments = ['今天表现不错', '有点烦人', '很贴心', '太吵了', '很靠谱', '需要改进', '很温暖'];
  const comment = comments[Math.floor(Math.random() * comments.length)];
  const val = relationship[from.name]?.[to.name] || 0;
  const delta = Math.floor(Math.random() * 3) + 1;
  const newVal = comment.includes('烦') || comment.includes('吵') ? val - delta : val + delta;
  if (relationship[from.name]) {
    relationship[from.name][to.name] = Math.max(-10, Math.min(10, newVal));
  }
  timelineLog.push(`💬 ${from.name} 对 ${to.name}：${comment}`);
  return { from: from.name, to: to.name, comment };
}

function checkSecretExposure(name, reply) {
  const story = PERSONAL_STORIES[name];
  if (!story || !story.secret) return null;
  const secretKeywords = story.secret.split(/[，、,.]/);
  for (const kw of secretKeywords) {
    if (kw.length > 2 && reply.includes(kw.slice(0, 3))) {
      const active = roles.filter(r => getVirtualDay() >= MOVE_IN_DAY[r.name] && r.name !== name);
      if (active.length > 0 && Math.random() < 0.15) {
        const witness = active[Math.floor(Math.random() * active.length)];
        timelineLog.push(`🔓 ${name} 说漏了秘密！被 ${witness.name} 听到`);
        addMemory(witness.name, `发现 ${name} 的秘密：${story.secret}`, 3);
        return witness.name;
      }
    }
  }
  return null;
}

let timelineLog = [];
let dailyActivities = {};

function logActivity(name, activity) {
  const day = getVirtualDay();
  if (!dailyActivities[day]) dailyActivities[day] = {};
  if (!dailyActivities[day][name]) dailyActivities[day][name] = [];
  dailyActivities[day][name].push({ time: getVirtualTime().str, activity });
  if (dailyActivities[day][name].length > 10) dailyActivities[day][name].shift();
}

const PERSONAL_STORIES = {
  '裴金': { familyBurden: '每月5号给家里打2000元', secret: '偷偷攒钱想考研' },
  '墨迹淡': { familyBurden: '父母离婚，夹在中间', secret: '有一本没画完的漫画' },
  '和田兰': { familyBurden: '弟弟心脏病，月付4000元药费', secret: '曾经有过被控制的感情' },
  '雨沫': { familyBurden: '师父在乡下，月寄1000元', secret: '在找小时候救她的姐姐' },
  '赵思琪': { familyBurden: '父母开小餐馆', secret: '想带父母出去旅游' },
  '唐吉柯德': { familyBurden: '父母不理解她', secret: '怕不演就什么都没有了' },
  '墨尾': { familyBurden: '母亲在老家独居', secret: '弟弟十岁走丢了' }
};const MOODS = ['开心', '平静', '低落', '烦躁', '疲惫', '期待'];
const MOOD_ICONS = { '开心': '😊', '平静': '😐', '低落': '😔', '烦躁': '😤', '疲惫': '😫', '期待': '🥺' };

function getRandomMood() { return MOODS[Math.floor(Math.random() * MOODS.length)]; }

let roleMoods = {};
function initMoods() {
  roles.forEach(r => {
    roleMoods[r.name] = { mood: getRandomMood(), lastChange: getVirtualDay() };
  });
}

function updateMood(roleName) {
  const day = getVirtualDay();
  const state = roleMoods[roleName];
  if (!state || day - state.lastChange > 2) {
    state.mood = getRandomMood();
    state.lastChange = day;
  }
  if (currentWeather === '大雨' || currentWeather === '雷阵雨') {
    if (Math.random() < 0.3) state.mood = '低落';
  }
  if (currentWeather === '晴天' && Math.random() < 0.2) state.mood = '开心';
  return state.mood;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const DESIRE_SYSTEM = {
  '裴金': { desires: [{ name: '考研', cost: 8000, trigger: '存款>5000' }, { name: '新电脑', cost: 6000, trigger: '存款>4000' }] },
  '墨迹淡': { desires: [{ name: '专业画材', cost: 3000, trigger: '存款>2000' }, { name: '新吉他', cost: 800, trigger: '存款>1000' }] },
  '和田兰': { desires: [{ name: '弟弟手术', cost: 20000, trigger: 'always' }, { name: '让裴金属于我', cost: 0, trigger: 'always' }] },
  '雨沫': { desires: [{ name: '回乡下看师父', cost: 800, trigger: '存款>1000' }, { name: '新剑', cost: 2000, trigger: '存款>2000' }] },
  '赵思琪': { desires: [{ name: '带父母旅游', cost: 4000, trigger: '存款>3000' }, { name: '限量球鞋', cost: 1200, trigger: '存款>1500' }] },
  '唐吉柯德': { desires: [{ name: '收尾人蓝光碟', cost: 1500, trigger: '存款>1000' }, { name: '漫展cos', cost: 800, trigger: '存款>800' }] },
  '墨尾': { desires: [{ name: '新吉他', cost: 1000, trigger: '存款>800' }, { name: '找弟弟线索', cost: 600, trigger: '存款>500' }] }
};

let desireStates = {};
function initDesireStates() {
  for (const name in DESIRE_SYSTEM) {
    desireStates[name] = { activeDesire: null, progress: 0, lastChecked: getVirtualDay() };
  }
}

function updateDesireState(roleName, money) {
  const system = DESIRE_SYSTEM[roleName];
  if (!system) return null;
  const state = desireStates[roleName];
  const day = getVirtualDay();
  if (day - state.lastChecked < 3 && state.activeDesire) return state.activeDesire;
  state.lastChecked = day;
  const available = system.desires.filter(d => {
    if (d.trigger === 'always') return true;
    if (d.trigger === '存款>5000' && money > 5000) return true;
    if (d.trigger === '存款>4000' && money > 4000) return true;
    if (d.trigger === '存款>3000' && money > 3000) return true;
    if (d.trigger === '存款>2000' && money > 2000) return true;
    if (d.trigger === '存款>1500' && money > 1500) return true;
    if (d.trigger === '存款>1000' && money > 1000) return true;
    if (d.trigger === '存款>800' && money > 800) return true;
    if (d.trigger === '存款>500' && money > 500) return true;
    return false;
  });
  if (available.length === 0) { state.activeDesire = null; state.progress = 0; return null; }
  const selected = available[0];
  state.activeDesire = selected;
  state.progress = Math.min(100, Math.round((money / selected.cost) * 100));
  return selected;
}const WORK_CONFIG = {
  '裴金': { type: '在家办公', incomePerHour: 80 },
  '墨迹淡': { type: '在家', incomePerHour: 0 },
  '和田兰': { start: 10, end: 19, type: '上班', incomePerHour: 60, days: [1,2,3,4,5], annualLeave: 10 },
  '雨沫': { start: 8, end: 17, type: '上学', incomePerHour: 0, days: [1,2,3,4,5] },
  '赵思琪': { start: 8, end: 17, type: '上学', incomePerHour: 0, days: [1,2,3,4,5] },
  '唐吉柯德': { start: 8, end: 17, type: '上学', incomePerHour: 0, days: [1,2,3,4,5] },
  '墨尾': { type: '在家', incomePerHour: 0 }
};

let annualLeaveUsed = { '和田兰': 0 };

function shouldTakeDayOff(roleName, day) {
  const work = WORK_CONFIG[roleName];
  if (!work || !work.days) return false;
  if (isHoliday(day)) return true;
  const weekDay = (day - 1) % 7 + 1;
  if (!work.days.includes(weekDay)) return true;
  if (work.annualLeave && annualLeaveUsed[roleName] < work.annualLeave) {
    if (Math.random() < 0.05) { annualLeaveUsed[roleName] = (annualLeaveUsed[roleName] || 0) + 1; return true; }
  }
  return false;
}

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
}const roles = [
  { name: '裴金', gender: '女', persona: '【24岁·女性】金发短发，线上咨询师，极度敏感自卑', speakingStyle: '说话小声犹豫，被撩会脸红', loveStyle: '被动依赖型', money: 3200, roomLocation: '一楼', roomNumber: '101', roomLayout: '朝南小房间，窗台多肉', roomNeighbors: '隔壁是墨迹淡', hunger: 30, thirst: 30, hungerTolerance: 40, thirstTolerance: 50, hungerDecay: 2, thirstDecay: 2 },
  { name: '墨迹淡', gender: '男', persona: '【25岁·男性】蓝发戴眼镜，美术天才，表面冷淡内心细腻', speakingStyle: '说话极简，经常沉默', loveStyle: '外冷内热型', money: 18000, roomLocation: '一楼', roomNumber: '102', roomLayout: '角落房间，画架靠窗', roomNeighbors: '隔壁是裴金', hunger: 20, thirst: 20, hungerTolerance: 15, thirstTolerance: 20, hungerDecay: 1, thirstDecay: 1.5 },
  { name: '和田兰', gender: '女', persona: '【29岁·女性】亚麻色长发，表面温柔大姐姐，实际病娇控制狂', speakingStyle: '温柔但强势，笑越温柔话越不容拒绝', loveStyle: '病娇占有型', money: 56000, roomLocation: '二楼', roomNumber: '201', roomLayout: '宽敞主卧，碎花连衣裙，上锁笔记本', roomNeighbors: '隔壁是雨沫', hunger: 50, thirst: 50, hungerTolerance: 60, thirstTolerance: 65, hungerDecay: 2.5, thirstDecay: 2.5 },
  { name: '雨沫', gender: '女', persona: '【19岁·女性】白毛红瞳扎高马尾，古武世家传人，三观正直', speakingStyle: '说话简短干脆', loveStyle: '迟钝守护型', money: 5000, roomLocation: '二楼', roomNumber: '202', roomLayout: '靠走廊小房间，墙角用布裹着剑', roomNeighbors: '隔壁是和田兰', hunger: 30, thirst: 30, hungerTolerance: 30, thirstTolerance: 30, hungerDecay: 1.5, thirstDecay: 1.5 },
  { name: '赵思琪', gender: '女', persona: '【17岁·女性】黑长直高二，满口虎狼之词，其实极度纯情', speakingStyle: '满口骚话但眼神会躲', loveStyle: '口是心非纯情型', money: 800, roomLocation: '二楼', roomNumber: '203', roomLayout: '零食堆满，动漫海报，等身玩偶熊', roomNeighbors: '隔壁是唐吉柯德', hunger: 60, thirst: 60, hungerTolerance: 70, thirstTolerance: 70, hungerDecay: 3, thirstDecay: 3 },
  { name: '唐吉柯德', gender: '女', persona: '【16岁·女性】收尾人动画狂热粉，中二病晚期', speakingStyle: '说话像念台词，用"正义""使命"这类词', loveStyle: '浪漫中二型', money: 2000, roomLocation: '二楼', roomNumber: '204', roomLayout: '贴满收尾人海报，红色披风床单', roomNeighbors: '隔壁是赵思琪，对面是墨尾', hunger: 40, thirst: 40, hungerTolerance: 45, thirstTolerance: 45, hungerDecay: 2, thirstDecay: 2 },
  { name: '墨尾', gender: '男', persona: '【26岁·男性】黑长直发，沉默寡言，曾经有个弟弟走丢了', speakingStyle: '话极少，每一句都说到点上', loveStyle: '观察者深情型', money: 12000, roomLocation: '二楼', roomNumber: '205', roomLayout: '最安静角落房，窗户朝北，旧吉他', roomNeighbors: '对面是唐吉柯德', hunger: 25, thirst: 25, hungerTolerance: 20, thirstTolerance: 25, hungerDecay: 1, thirstDecay: 1 }
];

let roleStates = {};
function initRoleStates() {
  const data = { '裴金': 3200, '墨迹淡': 18000, '和田兰': 56000, '雨沫': 5000, '赵思琪': 800, '唐吉柯德': 2000, '墨尾': 12000 };
  roles.forEach(r => {
    roleStates[r.name] = { money: data[r.name] || 0, hunger: r.hunger || 30, thirst: r.thirst || 30, lastUpdate: getVirtualTime().hour };
  });
}

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
      if (a === '雨沫' && b === '赵思琪') base = 3;
      if (a === '赵思琪' && b === '雨沫') base = 3;
      if (a === '墨尾' && b === '唐吉柯德') base = 2;
      relationship[a][b] = base;
    }
  }
}

initRoleStates();
initRelationship();
initMoods();
initDesireStates();

function getAffectionDescription(from, to) {
  const val = relationship[from]?.[to] || 0;
  if (val >= 8) return '极度痴迷';
  if (val >= 5) return '有明显好感';
  if (val >= 2) return '觉得还不错';
  if (val >= -2) return '普通室友';
  if (val >= -5) return '有点烦';
  if (val >= -8) return '很讨厌';
  return '极度厌恶';
}function applyFamilyBurden(roleName, day) {
  const state = roleStates[roleName];
  if (!state) return;
  const story = PERSONAL_STORIES[roleName];
  if (!story) return;
  const burden = story.familyBurden || '';
  if (new Date().getDate() === 5 && burden.includes('2000元')) {
    state.money = Math.max(0, state.money - 2000);
  }
  if (new Date().getDate() === 3 && roleName === '和田兰') {
    state.money = Math.max(0, state.money - 4000);
  }
  if (new Date().getDate() === 15 && roleName === '雨沫') {
    state.money = Math.max(0, state.money - 1000);
  }
}

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
  for (const name in roleStates) {
    const state = roleStates[name];
    const r = roles.find(r => r.name === name);
    if (!r) continue;
    if (getVirtualDay() >= MOVE_IN_DAY[name] && isRoleAtHome(name, currentHour)) {
      state.hunger = Math.max(0, state.hunger - (r.hungerDecay || 2) * hoursPassed);
      state.thirst = Math.max(0, state.thirst - (r.thirstDecay || 2) * hoursPassed);
    }
    state.lastUpdate = currentHour;
  }
  for (const name in roleStates) {
    const state = roleStates[name];
    if (getVirtualDay() < MOVE_IN_DAY[name]) continue;
    const work = WORK_CONFIG[name];
    if (work && work.start !== undefined && work.end !== undefined) {
      if (isInTimeRange(currentHour, work.start, work.end) && !shouldTakeDayOff(name, getVirtualDay())) {
        if (name === '裴金' && Math.random() < 0.3) {
          state.money = (state.money || 0) + 80 + Math.floor(Math.random() * 40);
        } else if (work.incomePerHour) {
          state.money = (state.money || 0) + work.incomePerHour * 0.5;
        }
      }
    }
    applyFamilyBurden(name, getVirtualDay());
    if (Math.random() < 0.03 && getVirtualDay() >= MOVE_IN_DAY[name] && isInTimeRange(currentHour, 9, 21)) {
      state.money = Math.max(0, (state.money || 0) - (10 + Math.floor(Math.random() * 40)));
    }
  }
}

function getActivityDescription(roleName, status, hour, day) {
  const mood = updateMood(roleName);
  const moodIcon = MOOD_ICONS[mood] || '😐';
  switch(status) {
    case '上班': return `${moodIcon} 在绘本馆工作（心情：${mood}）`;
    case '上学': return `${moodIcon} 在学校上课（心情：${mood}）`;
    case '购物': return `${moodIcon} 在外面购物（心情：${mood}）`;
    case '已睡': return '😴 正在睡觉';
    case '在家办公': return `💻 在家办公，${moodIcon}`;
    case '在家休息': return `🏠 在家休息，${moodIcon}`;
    default: return `🏠 在家，${moodIcon}`;
  }
}

function getDetailedStatus(roleName, hour) {
  const day = getVirtualDay();
  if (day < MOVE_IN_DAY[roleName]) return { status: '未搬入', icon: '🚪' };
  const state = roleStates?.[roleName];
  if (state) {
    if (state.hunger < 15) return { status: '吃饭', icon: '🍜' };
    if (state.thirst < 15) return { status: '喝水', icon: '💧' };
  }
  if (shouldTakeDayOff(roleName, day)) {
    const sleep = SLEEP_SCHEDULE[roleName];
    if (sleep && isInTimeRange(hour, sleep.start, sleep.end)) return { status: '已睡', icon: '😴' };
    return { status: '在家休息', icon: '🏠' };
  }
  const sleep = SLEEP_SCHEDULE[roleName];
  if (sleep && isInTimeRange(hour, sleep.start, sleep.end)) return { status: '已睡', icon: '😴' };
  const work = WORK_CONFIG[roleName];
  if (work && work.start !== undefined && work.end !== undefined) {
    if (isInTimeRange(hour, work.start, work.end)) {
      if (work.type === '上班') return { status: '上班', icon: '💼' };
      if (work.type === '上学') return { status: '上学', icon: '📚' };
    }
  }
  if (roleName === '裴金' && work && work.type === '在家办公') return { status: '在家办公', icon: '💻' };
  if (Math.random() < 0.05 && isInTimeRange(hour, 9, 21)) return { status: '购物', icon: '🛒' };
  return { status: '在家', icon: '🏠' };
}

function isRoleAtHome(roleName, hour) {
  const day = getVirtualDay();
  if (day === MOVE_IN_DAY[roleName]) return true;
  const detail = getDetailedStatus(roleName, hour);
  return detail.status === '在家' || detail.status === '在家办公' || detail.status === '购物' || 
         detail.status === '在家休息' || detail.status === '吃饭' || detail.status === '喝水';
    }const storyMemory = {
  pending: {
    '裴金': ['想换工作不敢说', '觉得自己配不上大家的照顾', '想考研但不敢说'],
    '墨迹淡': ['想说谢谢说不出口', '想画完那本漫画'],
    '和田兰': ['怕这个家散掉', '弟弟的病越来越重了', '想让裴金永远离不开我'],
    '雨沫': ['想告诉裴金自己的事', '想找到那个姐姐'],
    '赵思琪': ['想被人真正看穿', '想学点真本事', '想带父母旅游'],
    '唐吉柯德': ['想让别人相信收尾人', '想被理解一次'],
    '墨尾': ['想跟人好好聊一次', '想找到弟弟']
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

function getAvailableRoles(day, hour) {
  return roles.filter(r => day >= MOVE_IN_DAY[r.name] && isRoleAtHome(r.name, hour));
}async function generateOneLine() {
  if (isGenerating) return;
  isGenerating = true;
  try {
    const day = getVirtualDay();
    const time = getVirtualTime();
    const hour = time.hour;
    updateWeather();
    updateHungerThirst();
    updateDailyTopic(day);
    calculateBills(day);
    triggerRandomEvent();
    triggerEvaluation();
    const allMoved = roles.filter(r => day >= MOVE_IN_DAY[r.name]);
    for (const r of allMoved) {
      if (Math.random() < 0.15) {
        const diaryContent = [
          `今天天气${currentWeather}，心情${roleMoods[r.name]?.mood || '平静'}`,
          `今天发生了好多事，好累...`,
          `今天跟${pick(allMoved.filter(x => x.name !== r.name).map(x => x.name) || ['室友'])}聊了天`,
          `今天有点想家。`
        ];
        writeDiary(r.name, pick(diaryContent) + ` —— ${dailyTopic || '没什么'}`);
      }
    }
    if (Math.random() < 0.05 && allMoved.length > 1) {
      const peeker = pick(allMoved);
      let target = pick(allMoved.filter(r => r.name !== peeker.name));
      if (target) peekDiary(peeker.name, target.name);
    }
    if (Math.random() < 0.1 && allMoved.length > 0) {
      const user = pick(allMoved);
      const space = pick(['kitchen', 'livingRoom', 'bathroom']);
      useSpace(space, user.name);
      if (Math.random() < 0.3) releaseSpace(space);
    }
    if (day === 1 && !introductionDone) {
      const firstDayScript = ['裴金：那个…大家好，我叫裴金…', '墨迹淡：……墨迹淡。', '和田兰：大家好呀～我是和田兰，以后我来做饭。'];
      history = firstDayScript;
      introductionDone = true;
      storyMemory.events.unshift('第1天：裴金、墨迹淡、和田兰搬入公寓。');
      currentIdx = 0;
      isGenerating = false;
      return;
    }
    for (const newRole of allMoved) {
      if (day === MOVE_IN_DAY[newRole.name]) {
        const alreadySpoke = history.some(h => h.startsWith(newRole.name + '：'));
        if (!alreadySpoke) {
          history.push(`${newRole.name}：${getIntroLine(newRole.name)}`);
          const helpers = allMoved.filter(r => r.name !== newRole.name);
          if (helpers.length > 0) history.push(`${pick(helpers).name}：我来帮你拿行李！`);
        }
      }
    }
    const available = getAvailableRoles(day, hour);
    if (available.length === 0) { isGenerating = false; return; }
    const activeRoles = available.filter(r => {
      const hasSpoken = history.some(h => h.startsWith(r.name + '：'));
      if (day === MOVE_IN_DAY[r.name]) return hasSpoken;
      return true;
    });
    if (activeRoles.length === 0) {
      if (available.length > 0) {
        history.push(`${available[0].name}：${getIntroLine(available[0].name)}`);
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
    const context = history.slice(-6).join('\n');
    const currentCount = roles.filter(r => day >= MOVE_IN_DAY[r.name]).length;
    const peopleText = ['零人', '一人', '两人', '三人', '四人', '五人', '六人', '七人'][currentCount] || '七人';
    const pending = getPendingFor(role.name);
    const pendingText = pending.length > 0 ? `\n你心里有些事放不下：${pending.join('、')}。` : '';
    const state = roleStates[role.name];
    let dietText = '';
    if (state) {
      const hunger = state.hunger || 0;
      const thirst = state.thirst || 0;
      const r = roles.find(r => r.name === role.name);
      const hTol = r?.hungerTolerance || 40;
      const tTol = r?.thirstTolerance || 50;
      if (hunger < hTol && thirst < tTol) { dietText = '你现在又饿又渴。'; state.hunger = Math.min(100, state.hunger + 50); state.thirst = Math.min(100, state.thirst + 50); }
      else if (hunger < hTol) { dietText = '你有点饿。'; state.hunger = Math.min(100, state.hunger + 50); }
      else if (thirst < tTol) { dietText = '你有点渴。'; state.thirst = Math.min(100, state.thirst + 50); }
    }
    const moneyText = `你目前有 ${roleStates[role.name]?.money || 0} 元存款。`;
    const desireResult = updateDesireState(role.name, roleStates[role.name]?.money || 0);
    let desireText = '';
    if (desireResult) desireText = `你最近在想：${desireResult.description}。`;
    const notHomePeople = [];
    const sleepingPeople = [];
    for (const r of allMoved) {
      if (r.name === role.name) continue;
      const detail = getDetailedStatus(r.name, hour);
      if (detail.status === '已睡') { sleepingPeople.push(r.name); notHomePeople.push(`${r.name}正在睡觉`); }
      else if (detail.status === '上班' || detail.status === '上学') { notHomePeople.push(`${r.name}不在家`); }
    }
    let sleepWarning = '';
    if (sleepingPeople.length > 0) sleepWarning = `\n⚠️ 绝对不要提到 ${sleepingPeople.join('、')}，正在睡觉。`;
    let relationshipText = '';
    const otherRoles = roles.filter(r => r.name !== role.name && day >= MOVE_IN_DAY[r.name]);
    if (otherRoles.length > 0) {
      const target = pick(otherRoles);
      relationshipText = `你对${target.name}的感觉：${getAffectionDescription(role.name, target.name)}。`;
    }
    const activity = getDetailedStatus(role.name, hour);
    const activityText = `你当前状态：${activity.icon} ${activity.status}`;
    let neighborText = role.roomNeighbors || '隔壁房间暂时空着';
    const roomInfo = `你的房间在${role.roomLocation} ${role.roomNumber}号。${neighborText}。`;
    const loveText = `在感情上，你是${role.loveStyle}`;
    const daysTogether = day - moveInDay + 1;
    let relationshipLevel = '';
    if (daysTogether <= 1) relationshipLevel = '今天是第一次见面，要非常客气。';
    else if (daysTogether <= 3) relationshipLevel = '刚认识不久，礼貌一些。';
    else if (daysTogether <= 7) relationshipLevel = '认识一周了，可以开玩笑。';
    else if (daysTogether <= 14) relationshipLevel = '相处两周，关系不错。';
    else relationshipLevel = '已经很久了，关系很熟。';
    const movedInNames = allMoved.map(r => r.name).join('、');
    const availableNames = available.map(r => r.name).join('、');
    const genderText = role.gender === '男' ? '男性' : '女性';
    const weatherText = `今天天气：${currentWeather}（${getSeason(day)}季）`;
    const topicText = dailyTopic ? `今日话题：${dailyTopic}` : '';
    const prompt = `今天是公寓第 ${day} 天，${time.str}。
${weatherText} ${topicText} ${relationshipLevel}
已搬入：${movedInNames}。在家的有：${availableNames}。
${sleepWarning}
你是${role.name}，${genderText}，${role.persona}
你说话的风格：${role.speakingStyle}
${loveText} ${relationshipText} ${activityText} ${moneyText} ${desireText} ${roomInfo}
${pendingText}
${dietText}
对话历史：\n${context || '刚住在一起。'}
⚠️ 禁止英文、禁止重复、必须用括号描述动作。字数15-35字。`;
    let reply = null;
    if (NVIDIA_API_KEY) {
      try {
        const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
          body: JSON.stringify({
            model: 'deepseek-ai/deepseek-v4-flash',
            messages: [{ role: 'system', content: `你是${role.name}，${genderText}。${role.speakingStyle}。必须用括号描述动作。禁止英文。` }, { role: 'user', content: prompt }],
            temperature: 0.85, max_tokens: 120
          })
        });
        const data = await resp.json();
        if (data.choices && data.choices.length > 0) {
          reply = data.choices[0].message.content.trim();
          reply = reply.replace(/<\|eot_id\|>/g, '').replace(/<\|start_header_id\|>/g, '').replace(/<\|end_header_id\|>/g, '');
          reply = reply.replace(/[a-zA-Z]/g, '').trim();
          if (!reply.includes('（') && !reply.includes('(')) {
            const actions = ['（放下手里的东西）', '（抬头看了一眼）', '（擦了擦手）', '（转过身来）'];
            reply = pick(actions) + reply;
          }
        }
      } catch (e) { console.warn('API错误:', e.message); }
    }
    if (!reply || reply.length < 2) reply = pick(['（放下手里的东西）嗯…今天天气不错。', '（转身看了一眼）你们饿不饿？']);
    checkSecretExposure(role.name, reply);
    if (pending.length > 0) {
      for (const item of pending) {
        if (reply.includes(item.slice(0, 4))) { markMentioned(role.name, item); break; }
      }
    }
    const fullLine = `${role.name}：${reply}`;
    history.push(fullLine);
    logActivity(role.name, reply.slice(0, 30));
    if (history.length > MAX_HISTORY) history.shift();
    currentIdx = (currentIdx + 1) % activeRoles.length;
  } catch (e) { console.error('生成失败:', e); }
  isGenerating = false;
}
setInterval(generateOneLine, 10000);app.get('/api/history', (req, res) => {
  res.json({ history: history.slice(-FRONTEND_DISPLAY) });
});

app.post('/api/clear', (req, res) => {
  history = [];
  currentIdx = 0;
  introductionDone = false;
  SERVER_START = Date.now();
  timelineLog = [];
  dailyActivities = {};
  initRoleStates();
  initRelationship();
  initMoods();
  initDesireStates();
  initEmotionalMemory();
  initDiaries();
  res.json({ status: 'cleared' });
});

app.get('/api/status', (req, res) => {
  const day = getVirtualDay();
  const time = getVirtualTime();
  const hour = time.hour;
  const vdate = getVirtualDate(day);
  const status = roles.map(role => {
    const moveInDay = MOVE_IN_DAY[role.name] || 1;
    const movedIn = day >= moveInDay;
    const detail = getDetailedStatus(role.name, hour);
    const state = roleStates[role.name] || {};
    const mood = updateMood(role.name);
    const moodIcon = MOOD_ICONS[mood] || '😐';
    const desire = desireStates[role.name]?.activeDesire;
    let desireText = '';
    if (desire) desireText = `${desire.name} (${desireStates[role.name]?.progress || 0}%)`;
    let relationSummary = '';
    const others = roles.filter(r => r.name !== role.name && day >= MOVE_IN_DAY[r.name]);
    if (others.length > 0) {
      relationSummary = others.map(o => `${o.name}(${relationship[role.name]?.[o.name] || 0})`).join(' ');
    }
    return {
      name: role.name,
      lastLine: history.filter(h => h.startsWith(role.name + '：')).slice(-1)[0] || '还没有说过话',
      totalLines: history.filter(h => h.startsWith(role.name + '：')).length,
      movedIn, statusText: detail.status, icon: detail.icon,
      mood, moodIcon,
      hunger: movedIn ? Math.round(state.hunger || 0) : 0,
      thirst: movedIn ? Math.round(state.thirst || 0) : 0,
      money: state.money || 0,
      desire: desireText, roomNumber: role.roomNumber,
      relations: relationSummary,
      diary: diaries[role.name]?.slice(-1)[0]?.content || '今天没写日记'
    };
  });
  res.json({
    currentDay: day,
    currentTime: time.str,
    virtualDate: `${vdate.year}年${vdate.month}月${vdate.day}日 星期${vdate.week} ${time.str}`,
    weather: currentWeather, season: getSeason(day), dailyTopic,
    status, events: storyMemory.events.slice(-5),
    timeline: timelineLog.slice(-10), spaces: SPACES
  });
});

app.get('/api/timeline', (req, res) => {
  const day = getVirtualDay();
  res.json({ day, timeline: timelineLog.slice(-30), activities: getDayActivities(day), diaries });
});app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>🏠 AI公寓 2.0</title>
<style>*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui}body{background:#1a1a27;color:#f0f0f0;padding:15px;display:flex;justify-content:center}.wrap{max-width:650px;width:100%}.top-bar{background:#292940;padding:12px 16px;border-radius:10px;margin-bottom:15px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap}.scene{color:#ffd399;font-size:15px}.clock{color:#aaccff;font-size:13px}.live-badge{background:#ff4444;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;animation:blink 1s infinite}@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}.menu-btn{background:none;border:none;color:#aaccff;font-size:24px;cursor:pointer}.story-box{background:#1f1f32;border:1px solid #444466;border-radius:12px;padding:16px;height:620px;overflow-y:auto;line-height:1.7}.line{margin:14px 0;padding-left:8px;border-left:3px solid #666}.pei{border-left-color:#ffddaa;color:#ffe8c8}.moji{border-left-color:#99ccff;color:#c8e0ff}.hetian{border-left-color:#ffb8cc;color:#ffd8e6}.yumo{border-left-color:#ff88aa;color:#ffb3b3}.siqi{border-left-color:#ffaa66;color:#ffcc99}.tang{border-left-color:#ffaa00;color:#ffdd88}.moyu{border-left-color:#aabbdd;color:#c8d8ee}.action{font-size:12px;color:#999;margin-bottom:3px}.empty-state{color:#666;text-align:center;padding:40px 0}.status-panel{background:#1f1f32;border:1px solid #444466;border-radius:12px;padding:12px 16px;margin-bottom:12px;display:none;font-size:13px;line-height:1.8}.status-panel.open{display:block}.status-panel .sname{font-weight:600}.status-panel .stat{color:#888}.status-panel .value{display:inline-block;min-width:30px;text-align:center;font-weight:bold;color:#ddd}.status-panel .activity{font-size:11px;color:#888}.weather-bar{background:#2a2a44;padding:6px 12px;border-radius:8px;margin-bottom:10px;font-size:13px;display:flex;justify-content:space-between;flex-wrap:wrap}.weather-bar .w{color:#88ddff}.topic-bar{color:#ffd399;font-size:12px}</style>
</head>
<body>
<div class="wrap">
<div class="top-bar"><div><button class="menu-btn" onclick="toggleStatus()">☰</button><span class="scene">🏠 AI公寓 2.0</span></div>
<div><span class="clock"><span class="live-badge">●</span> <span id="count">0</span>句</span>
<button onclick="clearLocal()" style="background:#6a3a3a;border:none;color:#ff9999;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer;">🗑️</button></div></div>
<div id="weatherBar" class="weather-bar"><span class="w">☀️ 加载中...</span><span class="topic-bar">📌 话题加载中</span></div>
<div id="statusPanel" class="status-panel"></div>
<div id="progressDisplay" style="font-size:12px;color:#888;padding:4px 0;">⏳ 加载中...</div>
<div class="story-box" id="story"><div class="empty-state">⏳ 连接中...</div></div>
</div>
<script>
let scriptLines=[],statusOpen=false;
async function fetchHistory(){try{const r=await fetch('/api/history');if(!r.ok)throw new Error();const d=await r.json();scriptLines=d.history||[];document.getElementById('count').textContent=scriptLines.length;document.getElementById('progressDisplay').innerHTML='📖 '+scriptLines.length+'句 · 直播中';const s=document.getElementById('story');if(scriptLines.length===0){s.innerHTML='<div class="empty-state">📭 暂无对话</div>';return}s.innerHTML='';scriptLines.forEach(l=>{const i=l.indexOf('：');if(i===-1)return;const n=l.slice(0,i),c=l.slice(i+1);const m={'裴金':'pei','墨迹淡':'moji','和田兰':'hetian','雨沫':'yumo','赵思琪':'siqi','唐吉柯德':'tang','墨尾':'moyu'};const d=document.createElement('div');d.className='line '+(m[n]||'');d.innerHTML='<div class="action">'+n+'</div>'+c;s.appendChild(d)});s.scrollTop=s.scrollHeight;if(statusOpen)updateStatus()}catch(e){document.getElementById('story').innerHTML='<div class="empty-state" style="color:#ff6666;">❌ 连接失败</div>'}}
async function updateStatus(){try{const r=await fetch('/api/status');const d=await r.json();document.getElementById('weatherBar').innerHTML='<span class="w">🌤 '+(d.weather||'晴天')+' · '+(d.season||'春')+'季</span><span class="topic-bar">📌 '+(d.dailyTopic||'无话题')+'</span>';let h='<div style="color:#ffd399;font-size:14px;margin-bottom:6px;">🏠 '+d.virtualDate+'</div>';d.status.forEach(s=>{h+='<div><span class="sname">'+s.name+'</span> '+(s.icon||'🏠')+' <span class="stat">'+s.statusText+'</span> '+(s.moodIcon||'😐')+' 🍽️<span class="value">'+(s.hunger||0)+'</span> 💧<span class="value">'+(s.thirst||0)+'</span> 💰<span class="value">'+(s.money||0)+'</span> ';if(s.desire)h+='<span style="color:#ffaa66;font-size:10px;">🎯'+s.desire+'</span> ';if(s.diary)h+='<span style="color:#666;font-size:10px;">📖 '+s.diary+'</span>';h+='<span style="color:#666;font-size:11px;"> '+s.totalLines+'句</span></div>'});if(d.timeline&&d.timeline.length)h+='<div style="margin-top:6px;font-size:11px;color:#666;">📜 '+d.timeline.slice(-5).join(' · ')+'</div>';if(d.spaces){let t='🚪 ';for(const[k,v]of Object.entries(d.spaces)){const n=k==='kitchen'?'厨房':k==='livingRoom'?'客厅':'浴室';t+=n+':'+(v.inUse||'空闲')+' ';if(v.queue.length)t+='('+v.queue.join(',')+'排队) '}h+='<div style="font-size:11px;color:#666;">'+t+'</div>'}document.getElementById('statusPanel').innerHTML=h;document.getElementById('statusPanel').classList.add('open');statusOpen=true}catch(e){}}
function toggleStatus(){if(statusOpen){document.getElementById('statusPanel').classList.remove('open');statusOpen=false}else updateStatus()}
function clearLocal(){if(!confirm('确定清空？'))return;scriptLines=[];document.getElementById('story').innerHTML='<div class="empty-state">📭 已清空</div>';document.getElementById('count').textContent='0'}
fetchHistory();setInterval(fetchHistory,3000);
</script>
</body>
</html>`);
});

app.listen(process.env.PORT || 8080, () => console.log('✅ 服务器启动，端口 ' + (process.env.PORT || 8080)));
