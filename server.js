// ========== server.js (第1段) ==========
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// ---------- 配置 ----------
const MAX_HISTORY = 40;
const FRONTEND_DISPLAY = 15;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';

// ---------- 角色数据（全部确认，含长期目标） ----------
const roles = [
  {
    name: '裴金',
    gender: '女',
    height: '164cm', weight: '60kg',
    appearance: '金发短金发，金框眼镜',
    persona: '极度脆弱敏感，害怕被讨厌，内心纠结反复，像没断奶的小奶猫',
    speakingStyle: '犹豫、自我否定、总道歉，说话带"我是不是说错话了"',
    roomLocation: '东侧', roomNumber: '101', roomNeighbors: '隔壁是墨迹淡',
    loveStyle: '渴望被爱又不敢靠近',
    hungerTolerance: 40, thirstTolerance: 50, fatigueTolerance: 60,
    goals: ['被大家接纳', '不再害怕说错话', '找到一个能依赖的人']
  },
  {
    name: '墨迹淡',
    gender: '男',
    height: '174cm', weight: '65kg',
    appearance: '蓝发',
    persona: '天才少年，外表像榴莲带刺，接近会被毒舌戳破，但敲开外壳内心甜蜜',
    speakingStyle: '尖锐毒舌，偶尔流露出温柔',
    roomLocation: '东侧', roomNumber: '102', roomNeighbors: '隔壁是裴金',
    loveStyle: '口是心非型',
    hungerTolerance: 50, thirstTolerance: 40, fatigueTolerance: 50,
    background: '用数字策略合法套现32000元，与父母有分歧',
    goals: ['证明自己不是怪人', '找到一个能理解自己的人', '做出点真正厉害的事']
  },
  {
    name: '雨沫',
    gender: '女',
    height: '169cm', weight: '65kg',
    appearance: '白发红瞳萝莉，喜欢穿丝袜',
    persona: '三观正直，武术高手，世外高人徒弟，可肉身躲避子弹',
    speakingStyle: '坚定、正气凛然',
    roomLocation: '西侧', roomNumber: '103', roomNeighbors: '隔壁是何田兰',
    loveStyle: '正直专一',
    hungerTolerance: 45, thirstTolerance: 45, fatigueTolerance: 40,
    goals: ['守护大家', '提升自己的武艺', '弄清楚师父的秘密']
  },
  {
    name: '何田兰',
    gender: '女',
    height: '176cm', weight: '60kg',
    appearance: '棕色长发，看起来很亲近',
    persona: '病娇变态，控制欲极强，笑容从不达眼底，喜欢在别人水杯里加料',
    speakingStyle: '甜腻温柔，话里有刺，喜欢用"亲爱的"',
    roomLocation: '西侧', roomNumber: '104', roomNeighbors: '隔壁是雨沫',
    loveStyle: '操控型病娇',
    hungerTolerance: 30, thirstTolerance: 30, fatigueTolerance: 40,
    goals: ['掌控每个人', '让所有人都依赖我', '挖掘每个人的弱点']
  },
  {
    name: '赵思琪',
    gender: '女',
    height: '168cm', weight: '55kg',
    appearance: '黑长直，戴细框眼镜，身材曲线明显',
    persona: '满口黄腔但实际纯真，初吻还在，处女，什么都不懂',
    speakingStyle: '口无遮拦，但一聊到实际经验就脸红结巴',
    roomLocation: '南侧', roomNumber: '105', roomNeighbors: '隔壁是唐吉柯德',
    loveStyle: '嘴上老司机内心纯情',
    hungerTolerance: 35, thirstTolerance: 35, fatigueTolerance: 45,
    goals: ['体验真正的恋爱', '摆脱自己的纯真形象', '学会撩人但不尴尬']
  },
  {
    name: '唐吉柯德',
    gender: '女',
    height: '155cm', weight: '45kg',
    appearance: '少女体型，眼神充满幻想',
    persona: '中二少女，疯狂迷恋名为"追尾人"的游戏，充满幻想，有点疯癫',
    speakingStyle: '充满激情，把游戏台词带入日常',
    roomLocation: '南侧', roomNumber: '106', roomNeighbors: '隔壁是赵思琪',
    loveStyle: '对游戏角色单相思',
    hungerTolerance: 40, thirstTolerance: 40, fatigueTolerance: 50,
    goals: ['在现实中找到"追尾人"的踪迹', '让更多人知道这个游戏', '成为游戏里的英雄']
  },
  {
    name: '墨尾',
    gender: '男',
    height: '186cm', weight: '78kg',
    appearance: '黑长发及腰，左眼泛白右眼泛黑，黑色长袍',
    persona: '理性与感性的完美结合，平常看起来笨笨的，实则因两方冲突导致思考卡顿',
    speakingStyle: '讲话卡顿、撤回、又继续说，但一针见血，让每个人都不反感',
    roomLocation: '北侧', roomNumber: '107', roomNeighbors: '独享一侧',
    loveStyle: '理性克制',
    hungerTolerance: 50, thirstTolerance: 50, fatigueTolerance: 40,
    goals: ['找到理性与感性的平衡点', '帮助每个人看清自己的内心', '解开自己异色瞳的秘密']
  }
];

const MOVE_IN_DAY = {
  '裴金': 1, '墨迹淡': 1, '何田兰': 1,
  '雨沫': 3, '赵思琪': 5, '唐吉柯德': 7, '墨尾': 10
};
const MOOD_ICONS = { '开心': '😄', '平静': '😐', '低落': '😔', '烦躁': '😤', '疲惫': '😩' };
const ACTION_STATES = {
  SLEEPING: { phases: ['入睡', '熟睡', '做梦', '浅眠'] },
  EATING: { phases: ['准备', '用餐', '收拾'] },
  DRINKING: { phases: ['倒水', '喝水', '放杯子'] },
  TOILET: { phases: ['进去', '冲水', '出来'] },
  RESTING: { phases: ['放松', '发呆', '深呼吸'] },
  SOCIAL: { phases: ['打招呼', '闲聊', '告别'] },
  CLEANING: { phases: ['清扫', '擦拭', '整理'] },
  HOBBY: { phases: ['专注', '创作', '欣赏'] },
  WALKING: { phases: ['穿鞋', '散步', '回来'] },
  READING: { phases: ['翻开书', '阅读', '合上书'] },
  WRITING: { phases: ['思考', '动笔', '修改'] }
};
const ACTION_DURATION = {
  SLEEPING: 20, EATING: 4, DRINKING: 3, TOILET: 3,
  RESTING: 5, SOCIAL: 3, CLEANING: 4, HOBBY: 5,
  WALKING: 4, READING: 4, WRITING: 4
};

// 新增：所有可用动作列表（供决策随机选择）
const ALL_ACTIONS = ['SOCIAL', 'CLEANING', 'HOBBY', 'WALKING', 'READING', 'WRITING', 'RESTING'];

// ---------- 全局状态 ----------
let history = [];
let currentIdx = 0;
let introductionDone = false;
let SERVER_START = Date.now();
let timelineLog = [];
let dailyActivities = {};
let currentWeather = '晴天';
let dailyTopic = '';
let storyMemory = { events: [] };

let roleStates = {};
let relationship = {};
let desireStates = {};
let emotionalMemory = {};
let diaries = {};
let actionStates = {};
let SPACES = {
  kitchen: { inUse: null, queue: [] },
  livingRoom: { inUse: null, queue: [] },
  bathroom: { inUse: null, queue: [] }
};

// ---------- 辅助工具 ----------
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function isInTimeRange(hour, start, end) { return hour >= start && hour < end; }

// ---------- 初始化函数 ----------
function initRoleStates() {
  roles.forEach(r => {
    roleStates[r.name] = {
      money: r.name === '墨迹淡' ? 32000 : 1000 + Math.floor(Math.random() * 500),
      hunger: 60 + Math.floor(Math.random() * 30),
      thirst: 60 + Math.floor(Math.random() * 30),
      fatigue: 20 + Math.floor(Math.random() * 30),
      action: null,
      actionTimer: 0,
      actionPhase: 0,
      isSleeping: false,
      lastActionEnd: 0,
      mood: '平静',
      // 新增：短期欲望系统
      desire: null,           // 动作类型
      desireStrength: 0,      // 0-1
      // 新增：社交倾向（临时，用于对话选择）
      wantToTalk: false,
      talkTarget: null
    };
  });
}
function initRelationship() {
  roles.forEach(r => {
    relationship[r.name] = {};
    roles.forEach(o => {
      if (r.name !== o.name) relationship[r.name][o.name] = 0;
    });
  });
}
function initMoods() { /* mood 已包含在 roleStates */ }
function initDesireStates() {
  roles.forEach(r => {
    desireStates[r.name] = { activeDesire: null, progress: 0 };
  });
}
function initEmotionalMemory() {
  roles.forEach(r => { emotionalMemory[r.name] = []; });
}
function initDiaries() {
  roles.forEach(r => { diaries[r.name] = []; });
}
function initActionStates() {
  roles.forEach(r => { actionStates[r.name] = { action: null, phase: 0 }; });
}

initRoleStates();
initRelationship();
initMoods();
initDesireStates();
initEmotionalMemory();
initDiaries();
initActionStates();// ========== server.js (第2段) ==========
const DAY_START = new Date('2025-01-01T00:00:00Z').getTime();
const MIN_PER_DAY = 24;

function getVirtualDay() {
  const elapsed = (Date.now() - SERVER_START) / (1000 * 60);
  return Math.floor(elapsed / MIN_PER_DAY) + 1;
}
function getVirtualTime() {
  const totalMinutes = (Date.now() - SERVER_START) / (1000 * 60);
  const dayMinutes = totalMinutes % MIN_PER_DAY;
  const hour = Math.floor(dayMinutes / 60) % 24;
  const minute = Math.floor(dayMinutes % 60);
  const str = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return { hour, minute, str };
}
function getVirtualDate(day) {
  const base = new Date('2025-01-01');
  const d = new Date(base.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), week: weekdays[d.getDay()] };
}
function getSeason(day) {
  const m = ((day - 1) % 365);
  if (m < 90) return '春';
  if (m < 180) return '夏';
  if (m < 270) return '秋';
  return '冬';
}

function updateWeather() {
  const day = getVirtualDay();
  const weathers = ['晴天', '多云', '阴天', '小雨', '大雪', '大风'];
  if (day % 3 === 0) currentWeather = pick(weathers);
}
function updateHungerThirst() {
  roles.forEach(r => {
    const s = roleStates[r.name];
    if (!s) return;
    s.hunger = clamp(s.hunger - 0.2, 0, 100);
    s.thirst = clamp(s.thirst - 0.3, 0, 100);
    s.fatigue = clamp(s.fatigue + 0.1, 0, 100);
  });
}
function updateDailyTopic(day) {
  const topics = ['今日推荐电影', '周末计划', '星座运势', '新开餐厅', '环保话题', '科技新闻'];
  if (day % 2 === 0) dailyTopic = pick(topics);
}

function getAvailableRoles(day, hour) {
  const allMoved = roles.filter(r => day >= MOVE_IN_DAY[r.name]);
  const isWeekend = (day % 7 === 0 || day % 7 === 6);
  return allMoved.filter(r => {
    if (isWeekend) return true;
    return !(hour >= 8 && hour < 18);
  });
}

// ---------- 核心：高级决策系统（让AI自己决定干什么） ----------
function decideAction(role, day, hour) {
  const state = roleStates[role.name];
  if (!state) return null;
  if (state.action && state.actionTimer > 0) return null;
  if (state.isSleeping) return null;

  // 1. 如果有强烈的短期欲望，执行它
  if (state.desire && state.desireStrength > 0.6) {
    const action = state.desire;
    if (ACTION_DURATION[action]) {
      state.desireStrength = 0;
      state.desire = null;
      return { action, duration: ACTION_DURATION[action] };
    }
  }

  // 2. 长期目标影响：以一定概率执行与目标相关的动作
  const goals = role.goals || [];
  if (goals.length > 0 && Math.random() < 0.2) {
    const goalActionMap = {
      '被大家接纳': 'SOCIAL',
      '不再害怕说错话': 'SOCIAL',
      '找到一个能依赖的人': 'SOCIAL',
      '证明自己不是怪人': 'WRITING',
      '找到能理解自己的人': 'SOCIAL',
      '做出真正厉害的事': 'HOBBY',
      '守护大家': 'CLEANING',
      '提升武艺': 'HOBBY',
      '弄清楚师父的秘密': 'READING',
      '掌控每个人': 'SOCIAL',
      '让所有人都依赖我': 'SOCIAL',
      '挖掘弱点': 'READING',
      '体验真正的恋爱': 'SOCIAL',
      '摆脱纯真形象': 'WRITING',
      '学会撩人': 'SOCIAL',
      '找到追尾人踪迹': 'WALKING',
      '成为英雄': 'WRITING',
      '找到平衡点': 'WALKING',
      '帮助每个人': 'SOCIAL',
      '解开异色瞳秘密': 'READING'
    };
    for (const goal of goals) {
      if (goalActionMap[goal]) {
        const act = goalActionMap[goal];
        if (ACTION_DURATION[act]) {
          return { action: act, duration: ACTION_DURATION[act] };
        }
      }
    }
  }

  // 3. 基于生理需求（优先级降低）
  if ((hour >= 22 || hour < 6) && state.fatigue > 50) {
    return { action: 'SLEEPING', duration: ACTION_DURATION.SLEEPING };
  }
  if (state.hunger < 30) {
    return { action: 'EATING', duration: ACTION_DURATION.EATING };
  }
  if (state.thirst < 30) {
    return { action: 'DRINKING', duration: ACTION_DURATION.DRINKING };
  }
  if (state.fatigue > 70) {
    return { action: 'RESTING', duration: ACTION_DURATION.RESTING };
  }

  // 4. 完全随机自主行动（模拟真实人类）
  if (Math.random() < 0.3) {
    const randomAct = pick(ALL_ACTIONS);
    return { action: randomAct, duration: ACTION_DURATION[randomAct] };
  }

  // 5. 什么也不做（保持空闲）
  return null;
}

// 启动一个动作
function startAction(roleName, action, duration) {
  const state = roleStates[roleName];
  if (!state) return;
  state.action = action;
  state.actionTimer = duration || ACTION_DURATION[action] || 3;
  state.actionPhase = 0;
  if (action === 'SLEEPING') {
    state.isSleeping = true;
  }
  // 生成个性化动作描述
  const actionPhrases = {
    SLEEPING: '去睡觉了，困死了',
    EATING: '去吃饭了，饿得不行',
    DRINKING: '去喝点水',
    TOILET: '去一下洗手间',
    RESTING: '去休息会儿',
    SOCIAL: '去找人聊天',
    CLEANING: '去打扫一下房间',
    HOBBY: '去搞点兴趣',
    WALKING: '出去走走',
    READING: '去看书',
    WRITING: '去写点东西'
  };
  const msg = `🔔 ${roleName} ${actionPhrases[action] || '去做事了'}`;
  history.push(msg);
  if (history.length > MAX_HISTORY) history.shift();
}

// 更新所有角色的动作计时器
function updateActions() {
  for (const role of roles) {
    const state = roleStates[role.name];
    if (!state) continue;
    if (state.action && state.actionTimer > 0) {
      state.actionTimer--;
      state.actionPhase++;
      if (state.actionTimer === 0) {
        const ended = state.action;
        state.action = null;
        state.isSleeping = false;
        // 状态恢复
        if (ended === 'SLEEPING') {
          state.fatigue = 0;
          state.hunger = clamp(state.hunger - 10, 0, 100);
          state.thirst = clamp(state.thirst - 10, 0, 100);
        } else if (ended === 'EATING') {
          state.hunger = clamp(state.hunger + 40, 0, 100);
        } else if (ended === 'DRINKING') {
          state.thirst = clamp(state.thirst + 40, 0, 100);
        } else if (ended === 'RESTING') {
          state.fatigue = clamp(state.fatigue - 30, 0, 100);
        } else if (ended === 'SOCIAL') {
          // 社交后可能提升心情
          state.mood = pick(['开心', '平静']);
        }
        // 随机产生新的欲望
        if (Math.random() < 0.4) {
          const newDesire = pick(ALL_ACTIONS);
          state.desire = newDesire;
          state.desireStrength = 0.3 + Math.random() * 0.5;
        }
        history.push(`🔔 ${role.name} 结束了${ended}`);
        if (history.length > MAX_HISTORY) history.shift();
      }
    }
  }
}

// 获取详细状态（含动作进度）
function getDetailedStatus(name, hour) {
  const state = roleStates[name];
  if (!state) return { status: '未知', icon: '❓', detail: '' };
  if (state.isSleeping) return { status: '睡觉中', icon: '💤', detail: '睡得正香' };
  if (state.action) {
    const phases = ACTION_STATES[state.action]?.phases || [];
    const phaseText = phases[state.actionPhase % phases.length] || '';
    const map = {
      SLEEPING: '睡觉', EATING: '吃饭', DRINKING: '喝水',
      TOILET: '上厕所', RESTING: '休息', SOCIAL: '社交',
      CLEANING: '打扫', HOBBY: '爱好', WALKING: '散步',
      READING: '阅读', WRITING: '写作'
    };
    return { status: map[state.action] || '行为中', icon: '🎯', detail: phaseText };
  }
  if (hour >= 8 && hour < 18) return { status: '空闲', icon: '🏠', detail: '在公寓里' };
  return { status: '休息中', icon: '😌', detail: '在房间' };
}// ========== server.js (第3段) ==========
let isGenerating = false;

function getIntroLine(name) {
  const map = {
    '裴金': '大家好…我、我是裴金…希望不会给大家添麻烦…',
    '墨迹淡': '……墨迹淡。',
    '何田兰': '大家好呀～我是何田兰，以后我来做饭哦～',
    '雨沫': '各位好，我是雨沫，请多指教。',
    '赵思琪': '嗨～想姐姐了吗？嘿嘿～',
    '唐吉柯德': '追尾人的勇士们！我来了！',
    '墨尾': '……嗯，我是墨尾。'
  };
  return map[name] || '大家好。';
}

async function callAI(role, prompt, retries = 2) {
  if (!NVIDIA_API_KEY) return null;
  try {
    const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-v4-flash',
        messages: [
          { role: 'system', content: `你是${role.name}，${role.gender}。${role.speakingStyle}。直接说你说的话，可以自然地表达你想做的事，但绝对不要用括号或旁白描述。像真人一样说话，禁止英文。` },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9, max_tokens: 150
      })
    });
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
    return null;
  }
}

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

    // 更新所有动作计时
    updateActions();

    const allMoved = roles.filter(r => day >= MOVE_IN_DAY[r.name]);
    const available = getAvailableRoles(day, hour);

    // 为每个空闲角色决策动作
    for (const role of available) {
      const state = roleStates[role.name];
      if (!state) continue;
      if (!state.action || state.actionTimer <= 0) {
        const decision = decideAction(role, day, hour);
        if (decision) {
          startAction(role.name, decision.action, decision.duration);
        }
      }
    }

    // 搬入首日脚本
    if (day === 1 && !introductionDone) {
      const firstDayScript = [
        '裴金：那个…大家好，我叫裴金…',
        '墨迹淡：……墨迹淡。',
        '何田兰：大家好呀～我是何田兰，以后我来做饭。'
      ];
      history = firstDayScript;
      introductionDone = true;
      storyMemory.events.unshift('第1天：裴金、墨迹淡、何田兰搬入公寓。');
      currentIdx = 0;
      isGenerating = false;
      return;
    }

    // 新角色搬入
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

    // 筛选可以说话的角色（不在动作中或动作是SOCIAL）
    const talkers = available.filter(r => {
      const state = roleStates[r.name];
      return state && (!state.action || state.action === 'SOCIAL' || state.actionTimer <= 0);
    });

    if (talkers.length === 0) {
      isGenerating = false;
      return;
    }

    if (currentIdx >= talkers.length) currentIdx = 0;
    const role = talkers[currentIdx % talkers.length];

    const state = roleStates[role.name];
    const context = history.slice(-6).join('\n');
    const activity = getDetailedStatus(role.name, hour);
    const mood = state?.mood || '平静';
    const hunger = Math.round(state?.hunger || 0);
    const thirst = Math.round(state?.thirst || 0);
    const fatigue = Math.round(state?.fatigue || 0);
    const money = state?.money || 0;

    // 构建更丰富的 Prompt
    const prompt = `今天是公寓第 ${day} 天，${time.str}。
天气：${currentWeather}，${getSeason(day)}季。
你是${role.name}，${role.gender}，身高${role.height}，${role.appearance}。
性格：${role.persona}
说话风格：${role.speakingStyle}
当前状态：${activity.status}${activity.detail ? '：' + activity.detail : ''}
饥饿：${hunger}，口渴：${thirst}，疲劳：${fatigue}，存款：${money}元。
你的长期目标：${role.goals.join('、')}
${context ? '对话历史：\n' + context : '刚住在一起。'}

请说一句话（15-35字），像真人一样自然。如果你想做某事（如吃饭、睡觉、休息、散步、看书、找人聊天），可以直接说出来。尽量表达你的个性。`;

    let reply = await callAI(role, prompt);
    if (!reply || reply.length < 2) {
      const fallbacks = ['嗯…今天天气不错。', '你们饿不饿？', '我去休息一下。', '好累啊…', '想做点什么呢…'];
      reply = pick(fallbacks);
    }

    // ---------- 从回复中提取欲望/动作意图 ----------
    const actionKeywords = {
      '睡': 'SLEEPING', '睡觉': 'SLEEPING', '休息': 'RESTING',
      '吃饭': 'EATING', '吃': 'EATING', '喝水': 'DRINKING',
      '厕所': 'TOILET', '上厕所': 'TOILET', '打扫': 'CLEANING',
      '看书': 'READING', '读书': 'READING', '散步': 'WALKING', '走走': 'WALKING',
      '写': 'WRITING', '聊天': 'SOCIAL', '找人': 'SOCIAL',
      '画画': 'HOBBY', '弹琴': 'HOBBY', '练武': 'HOBBY'
    };
    let triggered = false;
    for (const [kw, act] of Object.entries(actionKeywords)) {
      if (reply.includes(kw)) {
        const s = roleStates[role.name];
        if (s && (!s.action || s.actionTimer <= 0) && !s.isSleeping) {
          startAction(role.name, act, ACTION_DURATION[act]);
          const confirmMap = {
            SLEEPING: '我去睡了，晚安。', EATING: '好饿，我去吃点东西。',
            DRINKING: '有点渴，我去喝点水。', RESTING: '我休息一下。',
            TOILET: '我去一下洗手间。', CLEANING: '我去打扫一下。',
            READING: '我去看会儿书。', WALKING: '我出去走走。',
            WRITING: '我去写点东西。', SOCIAL: '我去找人聊聊天。',
            HOBBY: '我去搞点兴趣。'
          };
          reply = confirmMap[act] || reply;
          triggered = true;
        }
        break;
      }
    }

    // 如果没有触发动作，但是AI提到了一些关键词，也可以作为欲望存储（留给下一次）
    if (!triggered && Math.random() < 0.2) {
      const possibleDesires = ['READING', 'WALKING', 'SOCIAL', 'WRITING', 'HOBBY'];
      const newDesire = pick(possibleDesires);
      const s = roleStates[role.name];
      if (s && !s.action) {
        s.desire = newDesire;
        s.desireStrength = 0.5 + Math.random() * 0.3;
      }
    }

    const fullLine = `${role.name}：${reply}`;
    history.push(fullLine);
    if (history.length > MAX_HISTORY) history.shift();
    currentIdx = (currentIdx + 1) % talkers.length;

    timelineLog.push(`💬 ${role.name}: ${reply.slice(0, 20)}`);
    if (timelineLog.length > 50) timelineLog.shift();

    // 随机触发事件
    if (Math.random() < 0.03) {
      const evts = ['停电半小时', '水管爆裂', '有人生日', '快递包裹堆积', '邻居敲门'];
      const e = pick(evts);
      storyMemory.events.unshift(`⚡ 事件：${e}`);
      timelineLog.push(`⚡ ${e}`);
    }

  } catch (e) {
    console.error('生成失败:', e);
  }
  isGenerating = false;
}

setInterval(generateOneLine, 10000);

// ---------- API 端点 ----------
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
  initActionStates();
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
    const mood = state.mood || '平静';
    const moodIcon = MOOD_ICONS[mood] || '😐';
    let actionProgress = 0;
    if (state.action && state.actionTimer > 0 && ACTION_DURATION[state.action]) {
      const total = ACTION_DURATION[state.action];
      const elapsed = total - state.actionTimer;
      actionProgress = Math.round((elapsed / total) * 100);
    }
    return {
      name: role.name,
      lastLine: history.filter(h => h.startsWith(role.name + '：')).slice(-1)[0] || '还没有说过话',
      totalLines: history.filter(h => h.startsWith(role.name + '：')).length,
      movedIn, statusText: detail.status + (detail.detail ? '：' + detail.detail : ''),
      icon: detail.icon, mood, moodIcon,
      hunger: movedIn ? Math.round(state.hunger || 0) : 0,
      thirst: movedIn ? Math.round(state.thirst || 0) : 0,
      fatigue: movedIn ? Math.round(state.fatigue || 0) : 0,
      money: state.money || 0,
      actionProgress,
      roomNumber: role.roomNumber,
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
  res.json({ day, timeline: timelineLog.slice(-30), diaries });
});

app.post('/api/event', (req, res) => {
  const evts = ['停电半小时', '水管爆裂', '有人生日', '快递包裹堆积', '邻居敲门'];
  const e = pick(evts);
  storyMemory.events.unshift(`⚡ 事件：${e}`);
  timelineLog.push(`⚡ ${e}`);
  res.json({ status: 'event_triggered' });
});// ========== server.js (第4段) ==========
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
.weather-bar{background:#1a1a2e;padding:8px 14px;border-radius:10px;margin-bottom:12px;font-size:13px;display:flex;justify-content:space-between;flex-wrap:wrap}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-bottom:16px}
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
<div class="top-bar">
<div class="scene">🏠 AI公寓 3.0</div>
<div>
<span class="clock"><span class="live-badge">●</span> <span id="count">0</span>句</span>
<span class="top-actions">
<button onclick="clearLocal()">🗑️清空</button>
<button onclick="triggerEvent()">🎲事件</button>
</span>
</div>
</div>
<div id="weatherBar" class="weather-bar">
<span id="weatherDisplay">☀️ 加载中...</span>
<span id="topicDisplay">📌 话题加载中</span>
</div>
<div id="cardGrid" class="card-grid"></div>
<div class="story-box" id="story"><div class="empty-state">⏳ 连接中...</div></div>
</div>
<script>
let scriptLines=[];
async function fetchData(){
try{
const r=await fetch('/api/status');
const d=await r.json();
document.getElementById('weatherDisplay').textContent='🌤 '+d.weather+' · '+d.season+'季';
document.getElementById('topicDisplay').textContent='📌 '+(d.dailyTopic||'无话题');
let grid=document.getElementById('cardGrid');
grid.innerHTML='';
d.status.forEach(s=>{
let card=document.createElement('div');
card.className='card';
let actionText=s.statusText||'空闲';
let prog=s.actionProgress||0;
card.innerHTML='<div class="header"><span class="name">'+s.name+'</span><span class="mood">'+(s.moodIcon||'😐')+'</span></div>'+
'<div class="action-area"><div class="action-text">'+(s.icon||'🏠')+' '+actionText+'</div>'+
'<div class="progress"><div class="progress-bar" style="width:'+prog+'%"></div></div></div>'+
'<div class="stats"><span>🍽️ <span class="val">'+s.hunger+'</span></span>'+
'<span>💧 <span class="val">'+s.thirst+'</span></span>'+
'<span>💪 <span class="val">'+s.fatigue+'</span></span>'+
'<span>💰 <span class="val">'+s.money+'</span></span></div>';
grid.appendChild(card);
});
const h=await fetch('/api/history');
const hd=await h.json();
scriptLines=hd.history||[];
document.getElementById('count').textContent=scriptLines.length;
const story=document.getElementById('story');
if(scriptLines.length===0){story.innerHTML='<div class="empty-state">📭 暂无对话</div>';return;}
story.innerHTML='';
scriptLines.forEach(l=>{
const div=document.createElement('div');
div.className='line';
if(l.startsWith('🔔')){div.classList.add('system');div.textContent=l;}
else{const idx=l.indexOf('：');if(idx===-1)return;div.innerHTML='<span class="speaker">'+l.slice(0,idx)+'</span>：'+l.slice(idx+1);}
story.appendChild(div);
});
story.scrollTop=story.scrollHeight;
}catch(e){console.error(e);}
}
function clearLocal(){if(!confirm('确定清空？'))return;fetch('/api/clear',{method:'POST'}).then(()=>fetchData());}
function triggerEvent(){fetch('/api/event',{method:'POST'}).then(()=>fetchData());}
fetchData();
setInterval(fetchData,3000);
</script>
</body>
</html>`);
});

app.listen(PORT, () => console.log('✅ 服务器启动，端口 ' + PORT));
