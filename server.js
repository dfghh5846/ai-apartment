const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

const MAX_HISTORY = 40;
const FRONTEND_DISPLAY = 15;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';

const roles = [
  {
    name: '裴金', gender: '女', height: '164cm', weight: '60kg',
    appearance: '金发短金发，金框眼镜',
    persona: '极度脆弱敏感，害怕被讨厌，内心纠结反复，像没断奶的小奶猫',
    speakingStyle: '犹豫、自我否定、总道歉，说话轻声细语，经常说"那个…""我…""对不起"',
    roomLocation: '东侧', roomNumber: '101', roomNeighbors: '隔壁是墨迹淡',
    loveStyle: '渴望被爱又不敢靠近',
    hungerTolerance: 40, thirstTolerance: 50, fatigueTolerance: 60,
    goals: ['被大家接纳', '不再害怕说错话', '找到一个能依赖的人'],
    sleepStart: 21, sleepTolerance: 30, sleepDuration: 18,
    roomDesc: '床单是浅粉色的，枕头边放着一只旧布熊，书桌上摆着一盆快枯的绿萝。'
  },
  {
    name: '墨迹淡', gender: '男', height: '174cm', weight: '65kg',
    appearance: '蓝发，眼神冷淡',
    persona: '天才少年，外表像榴莲带刺，接近会被毒舌戳破，但敲开外壳内心甜蜜',
    speakingStyle: '尖锐毒舌，偶尔流露出温柔，话很少，喜欢说"……""哦。""所以呢？""随便。"',
    roomLocation: '东侧', roomNumber: '102', roomNeighbors: '隔壁是裴金',
    loveStyle: '口是心非型',
    hungerTolerance: 50, thirstTolerance: 40, fatigueTolerance: 50,
    background: '用数字策略合法套现32000元，与父母有分歧',
    goals: ['证明自己不是怪人', '找到一个能理解自己的人', '做出点真正厉害的事'],
    sleepStart: 2, sleepTolerance: 60, sleepDuration: 16,
    roomDesc: '一张干净到几乎空白的桌子，只有一台笔记本和一支笔。床是深灰色的。'
  },
  {
    name: '雨沫', gender: '女', height: '169cm', weight: '65kg',
    appearance: '白发红瞳萝莉，喜欢穿丝袜',
    persona: '三观正直，武术高手，世外高人徒弟，可肉身躲避子弹',
    speakingStyle: '坚定、正气凛然，说话干脆，不拖泥带水',
    roomLocation: '西侧', roomNumber: '103', roomNeighbors: '隔壁是何田兰',
    loveStyle: '正直专一',
    hungerTolerance: 45, thirstTolerance: 45, fatigueTolerance: 40,
    goals: ['守护大家', '提升自己的武艺', '弄清楚师父的秘密'],
    sleepStart: 22, sleepTolerance: 40, sleepDuration: 16,
    roomDesc: '床上铺着白色床单，枕边放着一本《内家拳法》，墙上挂着一把木剑。'
  },
  {
    name: '何田兰', gender: '女', height: '176cm', weight: '60kg',
    appearance: '棕色长发，看起来很亲近，笑容甜得发腻',
    persona: '病娇变态，控制欲极强，笑容从不达眼底，喜欢在别人水杯里加料',
    speakingStyle: '甜腻温柔，话里有刺，喜欢用"亲爱的""宝贝"来称呼别人',
    roomLocation: '西侧', roomNumber: '104', roomNeighbors: '隔壁是雨沫',
    loveStyle: '操控型病娇',
    hungerTolerance: 30, thirstTolerance: 30, fatigueTolerance: 40,
    goals: ['掌控每个人', '让所有人都依赖我', '挖掘每个人的弱点'],
    sleepStart: 23, sleepTolerance: 35, sleepDuration: 16,
    roomDesc: '窗帘是深红色的，床上堆着好几个抱枕，梳妆台上摆满了瓶瓶罐罐。'
  },
  {
    name: '赵思琪', gender: '女', height: '168cm', weight: '55kg',
    appearance: '黑长直，戴细框眼镜，身材曲线明显',
    persona: '满口黄腔但实际纯真，初吻还在，处女，什么都不懂',
    speakingStyle: '口无遮拦，喜欢开黄腔撩人，但一被反撩就脸红结巴',
    roomLocation: '南侧', roomNumber: '105', roomNeighbors: '隔壁是唐吉柯德',
    loveStyle: '嘴上老司机内心纯情',
    hungerTolerance: 35, thirstTolerance: 35, fatigueTolerance: 45,
    goals: ['体验真正的恋爱', '摆脱自己的纯真形象', '学会撩人但不尴尬'],
    sleepStart: 20, sleepTolerance: 25, sleepDuration: 18,
    roomDesc: '墙上贴满了动漫海报，书桌上摆着几本言情小说和一支没用过的口红。'
  },
  {
    name: '唐吉柯德', gender: '女', height: '155cm', weight: '45kg',
    appearance: '少女体型，眼神充满幻想',
    persona: '中二少女，疯狂迷恋名为"追尾人"的游戏，充满幻想，有点疯癫',
    speakingStyle: '充满激情，把游戏台词带入日常，说话夸张',
    roomLocation: '南侧', roomNumber: '106', roomNeighbors: '隔壁是赵思琪',
    loveStyle: '对游戏角色单相思',
    hungerTolerance: 40, thirstTolerance: 40, fatigueTolerance: 50,
    goals: ['在现实中找到"追尾人"的踪迹', '让更多人知道这个游戏', '成为游戏里的英雄'],
    sleepStart: 1, sleepTolerance: 55, sleepDuration: 18,
    roomDesc: '墙上贴满了"追尾人"的剪报和手绘地图，床上放着游戏角色的抱枕。'
  },
  {
    name: '墨尾', gender: '男', height: '186cm', weight: '78kg',
    appearance: '黑长发及腰，左眼泛白右眼泛黑，黑色长袍',
    persona: '理性与感性的完美结合，平常看起来笨笨的，实则因两方冲突导致思考卡顿',
    speakingStyle: '讲话卡顿、撤回、又继续说，但一针见血，喜欢说"呃…""那个…""算了…"',
    roomLocation: '北侧', roomNumber: '107', roomNeighbors: '独享一侧',
    loveStyle: '理性克制',
    hungerTolerance: 50, thirstTolerance: 50, fatigueTolerance: 40,
    goals: ['找到理性与感性的平衡点', '帮助每个人看清自己的内心', '解开自己异色瞳的秘密'],
    sleepStart: 0, sleepTolerance: 45, sleepDuration: 16,
    roomDesc: '房间出奇地空，只有一张床、一张书桌、一把椅子，桌上放着一本摊开的《道德经》。'
  }
];

const MOVE_IN_DAY = { '裴金': 1, '墨迹淡': 1, '何田兰': 1, '雨沫': 2, '赵思琪': 3, '唐吉柯德': 4, '墨尾': 5 };
const MOOD_ICONS = { '开心': '😄', '平静': '😐', '低落': '😔', '烦躁': '😤', '疲惫': '😩' };
const ACTION_STATES = { SLEEPING: { phases: ['入睡', '熟睡', '做梦', '浅眠'] }, EATING: { phases: ['准备', '用餐', '收拾'] }, DRINKING: { phases: ['倒水', '喝水', '放杯子'] }, TOILET: { phases: ['进去', '冲水', '出来'] }, RESTING: { phases: ['放松', '发呆', '深呼吸'] }, SOCIAL: { phases: ['打招呼', '闲聊', '告别'] }, CLEANING: { phases: ['清扫', '擦拭', '整理'] }, HOBBY: { phases: ['专注', '创作', '欣赏'] }, WALKING: { phases: ['穿鞋', '散步', '回来'] }, READING: { phases: ['翻开书', '阅读', '合上书'] }, WRITING: { phases: ['思考', '动笔', '修改'] } };
const ACTION_DURATION = { SLEEPING: 20, EATING: 4, DRINKING: 3, TOILET: 3, RESTING: 5, SOCIAL: 3, CLEANING: 4, HOBBY: 5, WALKING: 4, READING: 4, WRITING: 4 };
const ALL_ACTIONS = ['SOCIAL', 'CLEANING', 'HOBBY', 'WALKING', 'READING', 'WRITING', 'RESTING'];

let history = [], currentIdx = 0, introductionDone = false;
let SERVER_START = new Date('2025-01-01T08:00:00Z').getTime();
let timelineLog = [], dailyActivities = {}, currentWeather = '晴天', dailyTopic = '', storyMemory = { events: [] }, todayEvents = [];
let roleStates = {}, relationship = {}, desireStates = {}, emotionalMemory = {}, diaries = {}, actionStates = {};
let SPACES = { kitchen: { inUse: null, queue: [] }, livingRoom: { inUse: null, queue: [] }, bathroom: { inUse: null, queue: [] } };

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

function initRoleStates() { roles.forEach(r => { roleStates[r.name] = { money: r.name === '墨迹淡' ? 32000 : 1000 + Math.floor(Math.random() * 500), hunger: 60 + Math.floor(Math.random() * 30), thirst: 60 + Math.floor(Math.random() * 30), fatigue: 20 + Math.floor(Math.random() * 30), action: null, actionTimer: 0, actionPhase: 0, isSleeping: false, lastActionEnd: 0, mood: '平静', desire: null, desireStrength: 0 }; }); }
function initRelationship() { roles.forEach(r => { relationship[r.name] = {}; roles.forEach(o => { if (r.name !== o.name) relationship[r.name][o.name] = 0; }); }); }
function initMoods() {}
function initDesireStates() { roles.forEach(r => { desireStates[r.name] = { activeDesire: null, progress: 0 }; }); }
function initEmotionalMemory() { roles.forEach(r => { emotionalMemory[r.name] = []; }); }
function initDiaries() { roles.forEach(r => { diaries[r.name] = []; }); }
function initActionStates() { roles.forEach(r => { actionStates[r.name] = { action: null, phase: 0 }; }); }

initRoleStates(); initRelationship(); initMoods(); initDesireStates(); initEmotionalMemory(); initDiaries(); initActionStates();

const MIN_PER_DAY = 24;
const HOLIDAYS = { '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '4-5': '清明节', '5-1': '劳动节', '6-1': '儿童节', '8-15': '中秋节', '9-10': '教师节', '10-1': '国庆节', '12-25': '圣诞节' };
const BIRTHDAYS = { '裴金': '3-15', '墨迹淡': '5-21', '何田兰': '8-8', '雨沫': '2-28', '赵思琪': '7-10', '唐吉柯德': '11-5', '墨尾': '9-30' };

function getVirtualDay() { const elapsed = (Date.now() - SERVER_START) / (1000 * 60); return Math.floor(elapsed / MIN_PER_DAY) + 1; }
function getVirtualTime() { const totalMinutes = (Date.now() - SERVER_START) / (1000 * 60); const dayMinutes = totalMinutes % MIN_PER_DAY; const hour = Math.floor(dayMinutes / 60) % 24; const minute = Math.floor(dayMinutes % 60); return { hour, minute, str: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` }; }
function getVirtualDate(day) {
  const base = new Date('2025-01-01T08:00:00Z');
  const d = new Date(base.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), week: weekdays[d.getDay()], dateStr: `${d.getMonth()+1}-${d.getDate()}` };
}
function getSeason(day) {
  const m = ((day - 1) % 365);
  if (m < 90) return '春';
  if (m < 180) return '夏';
  if (m < 270) return '秋';
  return '冬';
}

function checkTodayEvents(day, dateStr) { const events = []; if (HOLIDAYS[dateStr]) events.push({ type: 'holiday', name: HOLIDAYS[dateStr] }); for (const [name, bday] of Object.entries(BIRTHDAYS)) { if (bday === dateStr) events.push({ type: 'birthday', name: name }); } return events; }

function updateTodayEvents() { const day = getVirtualDay(); const vdate = getVirtualDate(day); todayEvents = checkTodayEvents(day, vdate.dateStr); for (const ev of todayEvents) { if (ev.type === 'birthday') { storyMemory.events.unshift(`🎂 今天是 ${ev.name} 的生日！`); timelineLog.push(`🎂 ${ev.name} 过生日啦`); } else if (ev.type === 'holiday') { storyMemory.events.unshift(`🎉 今天是 ${ev.name}！`); timelineLog.push(`🎉 ${ev.name}`); } } }

function updateWeather() {
  const day = getVirtualDay();
  const season = getSeason(day);
  let weathers = [];
  if (season === '夏') {
    weathers = ['晴天', '多云', '阴天', '小雨', '雷阵雨', '大风'];
  } else if (season === '冬') {
    weathers = ['晴天', '多云', '阴天', '小雪', '大雪', '大风'];
  } else if (season === '春' || season === '秋') {
    weathers = ['晴天', '多云', '阴天', '小雨', '大风'];
  }
  if (day % 3 === 0) {
    currentWeather = pick(weathers);
  }
}

function updateHungerThirst() { roles.forEach(r => { const s = roleStates[r.name]; if (!s) return; s.hunger = clamp(s.hunger - 0.3, 0, 100); s.thirst = clamp(s.thirst - 0.4, 0, 100); s.fatigue = clamp(s.fatigue + 0.15, 0, 100); }); }
function updateDailyTopic(day) { const topics = ['今日推荐电影', '周末计划', '星座运势', '新开餐厅', '环保话题', '科技新闻']; if (day % 2 === 0) dailyTopic = pick(topics); }

function getAvailableRoles(day, hour) {
  const allMoved = roles.filter(r => day >= MOVE_IN_DAY[r.name]);
  const isWeekend = (day % 7 === 0 || day % 7 === 6);
  return allMoved.filter(r => {
    if (isWeekend) return true;
    return !(hour >= 8 && hour < 18);
  });
}

function decideAction(role, day, hour) {
  const state = roleStates[role.name]; if (!state) return null; if (state.action && state.actionTimer > 0) return null; if (state.isSleeping) return null;

  if (day === 1 && !state.isSleeping) {
    if (Math.random() < 0.6) { return { action: 'SOCIAL', duration: ACTION_DURATION.SOCIAL }; }
    if (Math.random() < 0.3) { return { action: 'CLEANING', duration: ACTION_DURATION.CLEANING }; }
  }

  const sleepStart = role.sleepStart !== undefined ? role.sleepStart : 22;
  const sleepTolerance = role.sleepTolerance !== undefined ? role.sleepTolerance : 50;
  const sleepDuration = role.sleepDuration !== undefined ? role.sleepDuration : 16;
  if (hour >= sleepStart || hour < 6) {
    if (state.fatigue > sleepTolerance) {
      return { action: 'SLEEPING', duration: sleepDuration };
    }
  }

  for (const ev of todayEvents) {
    if (ev.type === 'birthday' && ev.name === role.name) { if (Math.random() < 0.5) return { action: 'SOCIAL', duration: ACTION_DURATION.SOCIAL }; return { action: 'RESTING', duration: ACTION_DURATION.RESTING }; }
    if (ev.type === 'birthday' && ev.name !== role.name) { if (Math.random() < 0.4) return { action: 'HOBBY', duration: ACTION_DURATION.HOBBY }; return { action: 'SOCIAL', duration: ACTION_DURATION.SOCIAL }; }
    if (ev.type === 'holiday') { if (Math.random() < 0.3) return { action: 'SOCIAL', duration: ACTION_DURATION.SOCIAL }; if (Math.random() < 0.2) return { action: 'CLEANING', duration: ACTION_DURATION.CLEANING }; return { action: 'RESTING', duration: ACTION_DURATION.RESTING }; }
  }

  if (state.desire && state.desireStrength > 0.6) { const action = state.desire; if (ACTION_DURATION[action]) { state.desireStrength = 0; state.desire = null; return { action, duration: ACTION_DURATION[action] }; } }

  const goals = role.goals || [];
  if (goals.length > 0 && Math.random() < 0.2) {
    const goalActionMap = { '被大家接纳': 'SOCIAL', '不再害怕说错话': 'SOCIAL', '找到一个能依赖的人': 'SOCIAL', '证明自己不是怪人': 'WRITING', '找到能理解自己的人': 'SOCIAL', '做出真正厉害的事': 'HOBBY', '守护大家': 'CLEANING', '提升武艺': 'HOBBY', '弄清楚师父的秘密': 'READING', '掌控每个人': 'SOCIAL', '让所有人都依赖我': 'SOCIAL', '挖掘弱点': 'READING', '体验真正的恋爱': 'SOCIAL', '摆脱纯真形象': 'WRITING', '学会撩人': 'SOCIAL', '找到追尾人踪迹': 'WALKING', '成为英雄': 'WRITING', '找到平衡点': 'WALKING', '帮助每个人': 'SOCIAL', '解开异色瞳秘密': 'READING' };
    for (const goal of goals) { if (goalActionMap[goal]) { const act = goalActionMap[goal]; if (ACTION_DURATION[act]) return { action: act, duration: ACTION_DURATION[act] }; } }
  }

  const hungerThreshold = role.hungerTolerance !== undefined ? role.hungerTolerance : 30;
  const thirstThreshold = role.thirstTolerance !== undefined ? role.thirstTolerance : 30;
  if (state.hunger < hungerThreshold) return { action: 'EATING', duration: ACTION_DURATION.EATING };
  if (state.thirst < thirstThreshold) return { action: 'DRINKING', duration: ACTION_DURATION.DRINKING };
  if (state.fatigue > 75) return { action: 'RESTING', duration: ACTION_DURATION.RESTING };
  if (Math.random() < 0.3) { const randomAct = pick(ALL_ACTIONS); return { action: randomAct, duration: ACTION_DURATION[randomAct] }; }
  return null;
}

function sayAction(roleName, action, duration) {
  const state = roleStates[roleName]; if (!state) return null;
  state.action = action;
  state.actionTimer = duration || ACTION_DURATION[action] || 3;
  state.actionPhase = 0;
  if (action === 'SLEEPING') state.isSleeping = true;

  const actionDialogue = {
    SLEEPING: [
      `好困啊...我先睡了，谁也别吵我。`,
      `不行了...眼皮直打架，我撑不住了...`,
      `晚安...世界...我睡着了...`
    ],
    EATING: [
      `饿死我了...我去找点吃的。`,
      `肚子咕咕叫，我先去吃饭了。`,
      `不行了，我要饿晕了，去吃饭！`
    ],
    DRINKING: [
      `渴死了...我去喝点水。`,
      `嗓子冒烟了，我去倒杯水。`
    ],
    TOILET: [
      `哎呀...我去一下洗手间。`,
      `憋不住了...我先去个厕所。`
    ],
    RESTING: [
      `好累啊...让我躺会儿。`,
      `世界太吵了...我需要静静...`,
      `累死了...我休息一下。`
    ],
    SOCIAL: [
      `嘿，聊会儿天呗？一个人待着好无聊。`,
      `过来坐嘛～聊聊呗。`,
      `你们在聊什么？加我一个！`
    ],
    CLEANING: [
      `这地方怎么这么脏？我来打扫一下。`,
      `干干净净才舒服嘛～我收拾收拾。`,
      `闲着也是闲着，我擦擦桌子吧。`
    ],
    HOBBY: [
      `终于有空搞搞我的小爱好了～`,
      `最近迷上这个了，太有意思了。`
    ],
    WALKING: [
      `闷死了...我出去走走。`,
      `出去透透气，顺便散散步。`
    ],
    READING: [
      `这本书真有意思...我看会儿书。`,
      `沉迷看书，别打扰我～`
    ],
    WRITING: [
      `有点灵感...我去写点东西。`,
      `嗯...这句怎么改好呢...我写写看。`
    ]
  };
  const dialogues = actionDialogue[action] || [`我去${action.toLowerCase()}`];
  return pick(dialogues);
}

function updateActions() {
  for (const role of roles) { const state = roleStates[role.name]; if (!state) continue; if (state.action && state.actionTimer > 0) { state.actionTimer--; state.actionPhase++; if (state.actionTimer === 0) { const ended = state.action; state.action = null; state.isSleeping = false; if (ended === 'SLEEPING') { state.fatigue = 0; state.hunger = clamp(state.hunger - 10, 0, 100); state.thirst = clamp(state.thirst - 10, 0, 100); } else if (ended === 'EATING') state.hunger = clamp(state.hunger + 45, 0, 100); else if (ended === 'DRINKING') state.thirst = clamp(state.thirst + 45, 0, 100); else if (ended === 'RESTING') state.fatigue = clamp(state.fatigue - 30, 0, 100); else if (ended === 'SOCIAL') state.mood = pick(['开心', '平静']); for (const ev of todayEvents) { if (ev.type === 'birthday' && ev.name !== role.name) relationship[role.name][ev.name] = (relationship[role.name][ev.name] || 0) + 5; } if (Math.random() < 0.4) { const newDesire = pick(ALL_ACTIONS); state.desire = newDesire; state.desireStrength = 0.3 + Math.random() * 0.5; } } } }
}

function getDetailedStatus(name, hour) {
  const state = roleStates[name]; if (!state) return { status: '未知', icon: '❓', detail: '' }; if (state.isSleeping) return { status: '睡觉中', icon: '💤', detail: '睡得正香' }; if (state.action) { const phases = ACTION_STATES[state.action]?.phases || []; const phaseText = phases[state.actionPhase % phases.length] || ''; const map = { SLEEPING: '睡觉', EATING: '吃饭', DRINKING: '喝水', TOILET: '上厕所', RESTING: '休息', SOCIAL: '社交', CLEANING: '打扫', HOBBY: '爱好', WALKING: '散步', READING: '阅读', WRITING: '写作' }; return { status: map[state.action] || '行为中', icon: '🎯', detail: phaseText }; } if (hour >= 8 && hour < 18) return { status: '空闲', icon: '🏠', detail: '在公寓里' }; return { status: '休息中', icon: '😌', detail: '在房间' };
                                                                                                                                                                                                                       }let isGenerating = false, isPaused = false, generationTimer = null;
function startGeneration() { if (generationTimer) clearInterval(generationTimer); generationTimer = setInterval(() => { if (!isPaused) generateOneLine(); }, 15000); }
function stopGeneration() { if (generationTimer) { clearInterval(generationTimer); generationTimer = null; } }
startGeneration();

function getIntroLine(name) { const map = { '裴金': '那个…大家好，我叫裴金…请多关照…（声音越来越小）', '墨迹淡': '……墨迹淡。', '何田兰': '大家好呀～我是何田兰，以后我来做饭哦～', '雨沫': '各位好，我是雨沫，请多指教。', '赵思琪': '嗨～想姐姐了吗？嘿嘿～', '唐吉柯德': '追尾人的勇士们！我来了！', '墨尾': '呃…我是墨尾…嗯…就这样。' }; return map[name] || '大家好。'; }

async function callAI(role, prompt, retryCount = 0) {
  if (!NVIDIA_API_KEY) return null;
  const maxRetries = 2;
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-v4-flash',
        messages: [
          { role: 'system', content: `你叫${role.name}，${role.gender}，你的性格是：${role.persona}。你的说话风格是：${role.speakingStyle}。不要用括号描述动作，直接用角色身份说话，要像真人一样自然、有情绪。不要说“你好”“再见”这种生硬的词，要像日常聊天。禁止英文。` },
          { role: 'user', content: prompt }
        ],
        temperature: 1.0,
        max_tokens: 120
      })
    });
    
    if (resp.status === 429) {
      if (retryCount < maxRetries) {
        const waitTime = (retryCount + 1) * 3000;
        console.warn(`API限流(429)，${waitTime/1000}秒后重试 (第${retryCount+1}次)`);
        await delay(waitTime);
        return callAI(role, prompt, retryCount + 1);
      } else {
        console.warn('API限流，已达最大重试次数，使用本地回复');
        return null;
      }
    }
    
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.choices && data.choices.length > 0) {
      let reply = data.choices[0].message.content.trim();
      reply = reply.replace(/<\|eot_id\|>/g, '').replace(/<\|start_header_id\|>/g, '').replace(/<\|end_header_id\|>/g, '');
      reply = reply.replace(/[a-zA-Z]/g, '').trim();
      reply = reply.replace(/[（(][^）)]*[）)]/g, '').trim();
      return reply;
    }
    return null;
  } catch (e) {
    console.warn('API错误:', e.message);
    if (retryCount < maxRetries) {
      const waitTime = (retryCount + 1) * 2000;
      await delay(waitTime);
      return callAI(role, prompt, retryCount + 1);
    }
    return null;
  }
}

async function generateOneLine() {
  if (isGenerating) return; isGenerating = true;
  try {
    const day = getVirtualDay(), time = getVirtualTime(), hour = time.hour;
    updateWeather(); updateHungerThirst(); updateDailyTopic(day); updateTodayEvents(); updateActions();
    const allMoved = roles.filter(r => day >= MOVE_IN_DAY[r.name]); const available = getAvailableRoles(day, hour);
    for (const role of available) {
      const state = roleStates[role.name]; if (!state) continue;
      if (!state.action || state.actionTimer <= 0) {
        const decision = decideAction(role, day, hour);
        if (decision) {
          const dialogue = sayAction(role.name, decision.action, decision.duration);
          if (dialogue) {
            history.push(`${role.name}：${dialogue}`);
            if (history.length > MAX_HISTORY) history.shift();
          }
        }
      }
    }

    if (day === 1 && !introductionDone) {
      history = [
        '裴金：那个…大家好，我叫裴金…那个…以后请多关照…（声音越来越小，低头看地板）',
        '墨迹淡：……墨迹淡。（简短点头，没看任何人）',
        '何田兰：（笑着摆手）哎呀别紧张嘛～我是何田兰！以后咱们就是室友了，今晚我下厨？',
        '裴金：（慌张抬头）啊…不、不用麻烦你…我、我自己可以解决…',
        '墨迹淡：……随便。（转身走到窗边，背对大家）',
        '何田兰：（歪头笑）别客气嘛～我去看看厨房有什么，你们先收拾行李～',
        '裴金：（小声）那…我帮你洗菜吧…',
        '墨迹淡：（侧头，淡淡地）……饭好了叫我。'
      ];
      introductionDone = true;
      storyMemory.events.unshift('🏠 第1天：三人搬入，客气中带着生疏。');
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

    const talkers = available.filter(r => {
      const state = roleStates[r.name];
      return state && (!state.action || state.action === 'SOCIAL' || state.actionTimer <= 0) && !state.isSleeping;
    });
    if (talkers.length === 0) { isGenerating = false; return; }
    if (currentIdx >= talkers.length) currentIdx = 0; const role = talkers[currentIdx % talkers.length];
    const state = roleStates[role.name]; const context = history.slice(-6).join('\n'); const activity = getDetailedStatus(role.name, hour);

    let eventText = ''; for (const ev of todayEvents) { if (ev.type === 'birthday') { if (ev.name === role.name) eventText += '🎂 今天是你生日！大家可能会为你庆祝。'; else eventText += `🎂 今天是 ${ev.name} 的生日，你可以说些祝福的话。`; } else if (ev.type === 'holiday') eventText += `🎉 今天是 ${ev.name}！是个值得庆祝的日子。`; }

    const prompt = `你现在是${role.name}，${role.gender}。今天是公寓第 ${day} 天，虚拟时间 ${time.str}，${getSeason(day)}季，${currentWeather}。${eventText}
你的性格：${role.persona}
你的说话风格：${role.speakingStyle}
你的房间：${role.roomDesc}
当前状态：${activity.status}${activity.detail ? '：' + activity.detail : ''}。饥饿：${Math.round(state.hunger)}，口渴：${Math.round(state.thirst)}，疲劳：${Math.round(state.fatigue)}，存款：${state.money}元。
你的长期目标：${role.goals.join('、')}。
对话历史：${context || '刚住在一起，还不熟。'}

请用非常自然、口语化的中文说一句话（15-35字），要符合你的性格，像个真人一样说话。不要用括号或旁白，直接说出你想说的话。`;

    let reply = await callAI(role, prompt);
    if (!reply || reply.length < 2) {
      const fallbacks = {
        '裴金': ['那个…今天天气不错…', '我…我去倒杯水…', '你们饿不饿？', '嗯…我先回房间了…'],
        '墨迹淡': ['……嗯。', '哦。', '随便。', '……行吧。'],
        '何田兰': ['亲爱的，要不要喝茶？', '今天心情不错呢～', '我来做饭吧。', '你们想吃什么？'],
        '雨沫': ['没问题，交给我。', '我先去练功了。', '大家注意安全。', '有需要叫我。'],
        '赵思琪': ['想姐姐了？嘿嘿～', '哎呀，你脸红了！', '来，坐我旁边～', '别害羞嘛～'],
        '唐吉柯德': ['以追尾人之名！', '这就是命运的选择！', '我感受到了召唤！', '世界在等着我们！'],
        '墨尾': ['呃…我…我觉得…算了。', '那个…其实…嗯…', '我觉得…这样挺好的。', '我…我先想想…']
      };
      reply = pick(fallbacks[role.name] || ['嗯…今天天气不错。']);
    }

    history.push(`${role.name}：${reply}`);
    if (history.length > MAX_HISTORY) history.shift();
    currentIdx = (currentIdx + 1) % talkers.length;
    timelineLog.push(`💬 ${role.name}: ${reply.slice(0, 20)}`);
    if (timelineLog.length > 50) timelineLog.shift();

    if (Math.random() < 0.03) {
      const evts = ['停电半小时', '水管爆裂', '快递堆积', '邻居敲门'];
      const e = pick(evts);
      storyMemory.events.unshift(`⚡ 事件：${e}`);
      timelineLog.push(`⚡ ${e}`);
    }
  } catch (e) { console.error('生成失败:', e); }
  isGenerating = false;
}

app.get('/api/history', (req, res) => { res.json({ history: history.slice(-FRONTEND_DISPLAY) }); });
app.post('/api/clear', (req, res) => { history = []; currentIdx = 0; introductionDone = false; SERVER_START = new Date('2025-01-01T08:00:00Z').getTime(); timelineLog = []; dailyActivities = {}; initRoleStates(); initRelationship(); initMoods(); initDesireStates(); initEmotionalMemory(); initDiaries(); initActionStates(); res.json({ status: 'cleared' }); });
app.get('/api/status', (req, res) => {
  const day = getVirtualDay(); const time = getVirtualTime(); const hour = time.hour; const vdate = getVirtualDate(day);
  const status = roles.map(role => {
    const moveInDay = MOVE_IN_DAY[role.name] || 1;
    const movedIn = day >= moveInDay;
    const detail = movedIn ? getDetailedStatus(role.name, hour) : { status: '未入住', icon: '🚪', detail: '' };
    const state = movedIn ? (roleStates[role.name] || {}) : {};
    const mood = movedIn ? (state.mood || '平静') : '未入住';
    const moodIcon = movedIn ? (MOOD_ICONS[mood] || '😐') : '🚫';
    let actionProgress = 0;
    if (movedIn && state.action && state.actionTimer > 0 && ACTION_DURATION[state.action]) {
      const total = ACTION_DURATION[state.action];
      const elapsed = total - state.actionTimer;
      actionProgress = Math.round((elapsed / total) * 100);
    }
    return {
      name: role.name,
      lastLine: movedIn ? (history.filter(h => h.startsWith(role.name + '：')).slice(-1)[0] || '还没有说过话') : '尚未搬入',
      totalLines: movedIn ? history.filter(h => h.startsWith(role.name + '：')).length : 0,
      movedIn, moveInDay,
      statusText: detail.status + (detail.detail ? '：' + detail.detail : ''),
      icon: detail.icon, mood, moodIcon,
      hunger: movedIn ? Math.round(state.hunger || 0) : null,
      thirst: movedIn ? Math.round(state.thirst || 0) : null,
      fatigue: movedIn ? Math.round(state.fatigue || 0) : null,
      money: movedIn ? state.money || 0 : null,
      actionProgress, roomNumber: role.roomNumber,
      diary: movedIn ? (diaries[role.name]?.slice(-1)[0]?.content || '今天没写日记') : '未入住'
    };
  });
  status.sort((a, b) => { if (a.movedIn && !b.movedIn) return -1; if (!a.movedIn && b.movedIn) return 1; return a.moveInDay - b.moveInDay; });
  res.json({
    currentDay: day, currentTime: time.str,
    virtualDate: `${vdate.year}年${vdate.month}月${vdate.day}日 星期${vdate.week}`,
    virtualTime: time.str,
    weather: currentWeather, season: getSeason(day), dailyTopic,
    status, events: storyMemory.events.slice(-5),
    timeline: timelineLog.slice(-10), spaces: SPACES
  });
});
app.get('/api/timeline', (req, res) => { const day = getVirtualDay(); res.json({ day, timeline: timelineLog.slice(-30), diaries }); });
app.post('/api/event', (req, res) => { const evts = ['停电半小时', '水管爆裂', '快递堆积', '邻居敲门']; const e = pick(evts); storyMemory.events.unshift(`⚡ 事件：${e}`); timelineLog.push(`⚡ ${e}`); res.json({ status: 'event_triggered' }); });
app.post('/api/pause', (req, res) => { const { action } = req.body; if (action === 'pause') { isPaused = true; res.json({ status: 'paused' }); } else if (action === 'resume') { isPaused = false; if (!generationTimer) startGeneration(); res.json({ status: 'resumed' }); } else res.status(400).json({ error: 'invalid action' }); });
app.get('/api/export', (req, res) => { const limit = parseInt(req.query.limit) || 0; const format = req.query.format || 'json'; let data = history.slice(); if (limit > 0) data = data.slice(-limit); if (format === 'txt') { const text = data.join('\n'); res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename=chat_history_${Date.now()}.txt`); res.send(text); } else { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename=chat_history_${Date.now()}.json`); res.json(data); } });

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>🏠 AI公寓 3.0</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif}
body{background:#0e0e1a;color:#e0e0e0;padding:16px;display:flex;justify-content:center}
.wrap{max-width:1100px;width:100%}
.top-bar{background:#1e1e30;padding:12px 20px;border-radius:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap}
.scene{font-size:20px;font-weight:bold;color:#ffd399}
.clock{color:#88ccff;font-size:14px}
.live-badge{background:#ff4444;padding:2px 10px;border-radius:20px;font-size:12px;animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
.top-actions button{background:#3a3a5a;border:none;color:#fff;padding:6px 16px;border-radius:20px;cursor:pointer;margin-left:8px}
.top-actions button:hover{background:#555577}
.weather-bar{background:#1a1a2e;padding:8px 14px;border-radius:10px;margin-bottom:12px;font-size:13px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap}
.weather-bar .left{display:flex;gap:20px;flex-wrap:wrap}
.weather-bar .right button{background:none;border:1px solid #666;color:#aaa;padding:2px 12px;border-radius:12px;cursor:pointer;font-size:13px;margin-left:4px}
.weather-bar .right button:hover{background:#2a2a44;color:#fff}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-bottom:16px;transition:all 0.3s}
.card-grid.hidden{display:none}
.card{background:#1a1a2e;border:1px solid #3a3a5a;border-radius:14px;padding:12px;transition:0.2s}
.card:hover{border-color:#6666aa}
.card .header{display:flex;justify-content:space-between;align-items:center}
.card .name{font-weight:bold;font-size:15px}
.card .mood{font-size:20px}
.card .action-area{margin:6px 0}
.card .action-text{font-size:12px;color:#aaccff}
.card .progress{background:#2a2a44;height:5px;border-radius:3px;margin:4px 0;overflow:hidden}
.card .progress-bar{height:100%;background:linear-gradient(90deg,#ffaa66,#ff8844);width:0%;transition:width 0.5s}
.card .stats{display:flex;flex-wrap:wrap;gap:2px 8px;font-size:11px;color:#aaa;margin-top:4px}
.card .stats span{display:flex;align-items:center;gap:2px}
.card .stats .val{color:#fff;font-weight:bold}
.story-box{background:#12121f;border:1px solid #3a3a5a;border-radius:14px;padding:16px;height:380px;overflow-y:auto;line-height:1.8}
.story-box .line{margin:6px 0;padding-left:8px;border-left:3px solid #666}
.story-box .line.system{color:#888;border-left-color:#888;font-style:italic}
.story-box .line .speaker{font-weight:600}
.empty-state{color:#666;text-align:center;padding:40px 0}
</style>
</head>
<body>
<div class="wrap">
<div class="top-bar"><div class="scene">🏠 AI公寓 3.0</div><div><span class="clock"><span class="live-badge" id="liveDot">●</span> <span id="count">0</span>句</span><span class="top-actions"><button onclick="clearLocal()">🗑️清空</button><button onclick="triggerEvent()">🎲事件</button><button id="pauseBtn" onclick="togglePause()">⏸️暂停</button><button onclick="exportLog()">📥导出</button></span></div></div>
<div id="weatherBar" class="weather-bar">
  <div class="left">
    <span id="datetimeDisplay">📅 加载中...</span>
    <span id="weatherDisplay">☀️ 加载中...</span>
    <span id="topicDisplay">📌 加载中...</span>
  </div>
  <div class="right">
    <button id="toggleBtn" onclick="toggleCards()">📋 收起状态</button>
  </div>
</div>
<div id="cardGrid" class="card-grid"></div>
<div class="story-box" id="story"><div class="empty-state">⏳ 连接中...</div></div>
</div>
<script>
let scriptLines=[], cardsVisible=true, isPaused=false, fetchInterval=null;
function toggleCards(){const g=document.getElementById('cardGrid'),b=document.getElementById('toggleBtn');if(cardsVisible){g.classList.add('hidden');b.textContent='📋 展开状态';}else{g.classList.remove('hidden');b.textContent='📋 收起状态';}cardsVisible=!cardsVisible;}
async function togglePause(){const b=document.getElementById('pauseBtn');if(isPaused){const r=await fetch('/api/pause',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'resume'})});if(r.ok){isPaused=false;b.textContent='⏸️暂停';document.getElementById('liveDot').style.background='#ff4444';if(fetchInterval)clearInterval(fetchInterval);fetchInterval=setInterval(fetchData,3000);}}else{const r=await fetch('/api/pause',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'pause'})});if(r.ok){isPaused=true;b.textContent='▶️继续';document.getElementById('liveDot').style.background='#888';if(fetchInterval){clearInterval(fetchInterval);fetchInterval=null;}}}}
async function exportLog(){const choice=confirm('点击"确定"导出全部，点击"取消"导出最近200条');const limit=choice?0:200;const format=confirm('点击"确定"导出JSON，点击"取消"导出TXT')?'json':'txt';window.open('/api/export?limit='+limit+'&format='+format,'_blank');}
async function fetchData(){try{const r=await fetch('/api/status');const d=await r.json();
document.getElementById('datetimeDisplay').textContent='⏰ 虚拟时间：'+d.virtualDate+' '+d.virtualTime;
document.getElementById('weatherDisplay').textContent='🌤 '+d.weather+' · '+d.season+'季';
document.getElementById('topicDisplay').textContent='📌 '+(d.dailyTopic||'无话题');
let grid=document.getElementById('cardGrid');grid.innerHTML='';
d.status.forEach(s=>{let card=document.createElement('div');card.className='card';if(!s.movedIn){card.innerHTML='<div class="header"><span class="name">'+s.name+'</span><span class="mood">🚪</span></div><div class="action-area"><div class="action-text">未入住</div></div><div class="stats"><span style="color:#666;">等待搬入...</span></div>';}else{let actionText=s.statusText||'空闲';let prog=s.actionProgress||0;card.innerHTML='<div class="header"><span class="name">'+s.name+'</span><span class="mood">'+(s.moodIcon||'😐')+'</span></div><div class="action-area"><div class="action-text">'+(s.icon||'🏠')+' '+actionText+'</div><div class="progress"><div class="progress-bar" style="width:'+prog+'%"></div></div></div><div class="stats"><span>🍽️ <span class="val">'+s.hunger+'</span></span><span>💧 <span class="val">'+s.thirst+'</span></span><span>💪 <span class="val">'+s.fatigue+'</span></span><span>💰 <span class="val">'+s.money+'</span></span></div>';}grid.appendChild(card);});
const h=await fetch('/api/history');const hd=await h.json();scriptLines=hd.history||[];document.getElementById('count').textContent=scriptLines.length;const story=document.getElementById('story');if(scriptLines.length===0){story.innerHTML='<div class="empty-state">📭 暂无对话</div>';return;}story.innerHTML='';scriptLines.forEach(l=>{const div=document.createElement('div');div.className='line';if(l.startsWith('🔔')){div.classList.add('system');div.textContent=l;}else{const idx=l.indexOf('：');if(idx===-1)return;div.innerHTML='<span class="speaker">'+l.slice(0,idx)+'</span>：'+l.slice(idx+1);}story.appendChild(div);});story.scrollTop=story.scrollHeight;}catch(e){console.error(e);}}
function clearLocal(){if(!confirm('确定清空？'))return;fetch('/api/clear',{method:'POST'}).then(()=>fetchData());}
function triggerEvent(){fetch('/api/event',{method:'POST'}).then(()=>fetchData());}
fetchData();fetchInterval=setInterval(fetchData,3000);
</script>
</body>
</html>`);
});

app.listen(PORT, () => console.log('✅ 服务器启动，端口 ' + PORT));
