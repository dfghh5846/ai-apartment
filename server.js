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
};

const MOODS = ['开心', '平静', '低落', '烦躁', '疲惫', '期待'];
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
initMoods();

function updateMood(roleName) {
  const day = getVirtualDay();
  const state = roleMoods[roleName];
  if (!state || day - state.lastChange > 2) {
    state.mood = getRandomMood();
    state.lastChange = day;
  }
  return state.mood;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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
initDesireStates();

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
    if (d.trigger === '弟弟病情稳定') {
      return new Date().getDate() > 5;
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
}const WORK_CONFIG = {
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

function getActivityDescription(roleName, status, hour, day) {
  const mood = updateMood(roleName);
  const moodIcon = MOOD_ICONS[mood] || '😐';
  const story = PERSONAL_STORIES[roleName] || {};
  
  switch(status) {
    case '上班':
      const workScenes = [
        '在绘本馆整理新到的绘本',
        '在给小朋友讲故事',
        '在登记借书信息',
        '在擦拭书架上的灰尘',
        '在整理被翻乱的儿童区',
        '在跟同事讨论下周的活动方案',
        '在窗前发呆，看着外面经过的人'
      ];
      return `${moodIcon} 在绘本馆，${pick(workScenes)}（心情：${mood}）`;
    
    case '上学':
      const schoolScenes = [
        '在教室上数学课，笔在纸上无意识画圈',
        '在走廊被同学拉住聊天',
        '在图书馆翻一本漫画书',
        '在操场上体育课，一个人坐在树荫下',
        '在食堂排队打饭，前面的人很多',
        '在课桌上趴着，不想听课',
        '在跟同桌传纸条'
      ];
      return `${moodIcon} 在学校，${pick(schoolScenes)}（心情：${mood}）`;
    
    case '购物':
      const shopScenes = [
        '在超市的零食区徘徊',
        '在买日用品，挑了很久',
        '在水果摊前犹豫买什么',
        '在书店翻一本新书',
        '在奶茶店排队',
        '在药房买药，表情有点犹豫'
      ];
      return `${moodIcon} 在外面，${pick(shopScenes)}（心情：${mood}）`;
    
    case '已睡':
      return '😴 正在睡觉，不要打扰';
    
    case '在家办公':
      return `💻 在家办公，${moodIcon} 心情：${mood}`;
    
    case '在家休息':
      const restScenes = [
        '窝在沙发上刷手机',
        '在床上躺着发呆',
        '在阳台吹风，看着远处的天空',
        '在听音乐，闭着眼睛',
        '在收拾自己的房间',
        '在厨房给自己煮面',
        '在看窗外经过的鸟'
      ];
      return `🏠 在家休息，${pick(restScenes)}（心情：${mood}）`;
    
    case '在家':
    default:
      const homeScenes = [
        '在客厅喝水，看着窗外',
        '在房间里看书，但没翻几页',
        '在跟室友有一搭没一搭地聊天',
        '在整理东西，翻出了旧照片',
        '在厨房准备做饭',
        '在沙发上睡着了',
        '在阳台收衣服'
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
    }const roles = [
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
    persona: '【29岁·女性】亚麻色长发。表面温柔大姐姐，实际是深度病娇控制狂。弟弟有心脏病，每月要付4000元药费。第1天会正常相处，第2天开始露出控制欲——她会用"关心"和"照顾"来绑架所有人，尤其是裴金。她的温柔是锁链，关心是牢笼。',
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
    persona: '【17岁·女性】黑长直高二。满口虎狼之词和黄色笑话，但其实连男生的手都没牵过。用最脏最骚的话来掩饰自己的纯情和不安。半夜偷吃零食，说骚话时眼神会躲。',
    speakingStyle: '满口"操""干""鸡巴""你行不行啊"这种词，说的时候眼神会躲。被人撩一句就结巴，脸瞬间红到脖子。真的动心的时候反而一句话都说不出来。',
    loveStyle: '口是心非纯情型——嘴上什么骚话都敢说，实际连对视都紧张。被认真对待时会慌了手脚，然后骂骂咧咧地跑开。',
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
];

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
    console.log(`💰 ${roleName} 给家里打了2000元赡养费，剩余${state.money}元`);
  }
  if (new Date().getDate() === 3 && roleName === '和田兰') {
    state.money = Math.max(0, state.money - 4000);
    console.log(`💰 和田兰 付了4000元药费，剩余${state.money}元`);
  }
  if (new Date().getDate() === 15 && roleName === '雨沫') {
    state.money = Math.max(0, state.money - 1000);
    console.log(`💰 雨沫 寄了1000元给师父，剩余${state.money}元`);
  }
}

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
  
  for (const name in roleStates) {
    const state = roleStates[name];
    const r = roles.find(r => r.name === name);
    if (!r) continue;
    if (day >= MOVE_IN_DAY[name] && isRoleAtHome(name, currentHour)) {
      state.hunger = Math.max(0, state.hunger - (r.hungerDecay || 2) * hoursPassed);
      state.thirst = Math.max(0, state.thirst - (r.thirstDecay || 2) * hoursPassed);
    }
    state.lastUpdate = currentHour;
  }
  
  for (const name in roleStates) {
    const state = roleStates[name];
    if (day < MOVE_IN_DAY[name]) continue;
    const work = WORK_CONFIG[name];
    if (work && work.start !== undefined && work.end !== undefined) {
      if (isInTimeRange(currentHour, work.start, work.end) && !shouldTakeDayOff(name, day)) {
        if (name === '裴金' && Math.random() < 0.3) {
          state.money = (state.money || 0) + 80 + Math.floor(Math.random() * 40);
        } else if (work.incomePerHour) {
          state.money = (state.money || 0) + work.incomePerHour * 0.5;
        }
      }
    }
    applyFamilyBurden(name, day);
    if (Math.random() < 0.03 && day >= MOVE_IN_DAY[name] && isInTimeRange(currentHour, 9, 21)) {
      state.money = Math.max(0, (state.money || 0) - (10 + Math.floor(Math.random() * 40)));
    }
  }
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
}

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

    const prompt = `今天是公寓第 ${day} 天，${time.str}。
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

setInterval(generateOneLine, 10000);app.get('/api/history', (req, res) => {
  res.json({ history: history.slice(-FRONTEND_DISPLAY) });
});

app.post('/api/clear', (req, res) => {
  history = [];
  currentIdx = 0;
  introductionDone = false;
  SERVER_START = Date.now();
  initRoleStates();
  initRelationship();
  initMoods();
  initDesireStates();
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
    const detail = getDetailedStatus(role.name, hour);
    const state = roleStates[role.name] || {};
    const mood = updateMood(role.name);
    const moodIcon = MOOD_ICONS[mood] || '😐';
    const activityDesc = getActivityDescription(role.name, detail.status, hour, day);
    const desire = desireStates[role.name]?.activeDesire;
    const desireProgress = desireStates[role.name]?.progress || 0;
    let desireText = '';
    if (desire) {
      desireText = `${desire.name} (${desireProgress}%)`;
    }
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
});app.get('/', (req, res) => {
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
.status-panel .activity{font-size:11px;color:#888;display:block;margin:2px 0 4px 0;padding-left:6px;border-left:2px solid #444}
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
      const moodIcon = s.moodIcon || '😐';
      html += '<div><span class="sname">' + s.name + '</span> ' + icon + ' <span class="stat">' + s.statusText + '</span> ';
      html += moodIcon + ' ';
      html += '🍽️<span class="value">' + hunger + '</span> 💧<span class="value">' + thirst + '</span> 💰<span class="value">' + money + '</span> ';
      html += '🏠' + (s.roomNumber || '') + ' ';
      if (s.desire) {
        html += '<span style="color:#ffaa66;font-size:10px;">🎯' + s.desire + '</span> ';
      }
      if (s.activity) {
        html += '<span class="activity">' + s.activity + '</span>';
      }
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

app.listen(process.env.PORT || 8080, () => console.log('✅ 服务器启动，端口 ' + (process.env.PORT || 8080)));
