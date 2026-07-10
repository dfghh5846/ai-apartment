const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
if (!NVIDIA_API_KEY) console.warn('⚠️ NVIDIA_API_KEY 未设置');

// ================================================================
// 1. ⏱️ 时间系统
// ================================================================
const CONFIG = { REAL_MINUTES_PER_DAY: 24, START_DATE: new Date(2024, 0, 1) };

const MOVE_IN_DAY = {
  '裴金': 1, '墨迹淡': 1, '和田兰': 1,
  '雨沫': 2, '赵思琪': 3, '唐吉柯德': 5, '墨羽': 15
};

const WORK_SCHEDULE = {
  '裴金': null, '墨迹淡': null,
  '和田兰': { start: 10, end: 19 },
  '雨沫': { start: 8, end: 17 },
  '赵思琪': { start: 8, end: 17 },
  '唐吉柯德': { start: 8, end: 17 },
  '墨羽': null
};

const SLEEP_SCHEDULE = {
  '裴金': { start: 22, end: 6 }, '墨迹淡': { start: 2, end: 10 },
  '和田兰': { start: 23, end: 7 }, '雨沫': { start: 21, end: 6 },
  '赵思琪': { start: 23, end: 6 }, '唐吉柯德': { start: 23, end: 7 },
  '墨羽': { start: 1, end: 9 }
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
  return '已经很熟了，说话随意像老朋友。';
}

function isRoleAtHome(roleName, hour) {
  const day = getVirtualDay();
  if (day === MOVE_IN_DAY[roleName]) return true;
  const work = WORK_SCHEDULE[roleName];
  if (work) {
    const start = work.start, end = work.end;
    if (start < end) { if (hour >= start && hour < end) return false; }
    else { if (hour >= start || hour < end) return false; }
  }
  const sleep = SLEEP_SCHEDULE[roleName];
  if (sleep) {
    const start = sleep.start, end = sleep.end;
    if (start < end) { if (hour >= start && hour < end) return false; }
    else { if (hour >= start || hour < end) return false; }
  }
  return true;
}

// ================================================================
// 2. 👥 角色设定
// ================================================================
const roles = [
  {
    name: '裴金',
    persona: '24岁女生，金发圆框眼镜，线上咨询师。极度敏感自卑，总觉得自己不配被爱，说话必带"可能""好像"。',
    sample: '「可能…是我做错了吧…」',
    money: 3200,
    likes: ['做饭', '看治愈系纪录片', '被夸奖'],
    wants: ['想学会拒绝别人', '想养一只猫'],
    hunger: 30, thirst: 30, hungerTolerance: 40, thirstTolerance: 50, hungerDecay: 2, thirstDecay: 2
  },
  {
    name: '墨迹淡',
    persona: '25岁男生，蓝发眼镜，美术天才陨落后变家里蹲。话少直接，但内心敏感，习惯用沉默掩盖关心。',
    sample: '「……嗯。随便你。」',
    money: 18000,
    likes: ['画画', '半夜弹吉他', '看窗外发呆'],
    wants: ['想跟室友说谢谢', '想重新拿起画笔'],
    hunger: 20, thirst: 20, hungerTolerance: 15, thirstTolerance: 20, hungerDecay: 1, thirstDecay: 1.5
  },
  {
    name: '和田兰',
    persona: '29岁女生，亚麻色长发。表面是温柔大姐姐，实际上是深度病娇控制狂。享受把别人圈养在身边的快感，尤其对裴金有极强的占有欲。她的温柔是锁链，关心是牢笼。',
    sample: '「没事的，有我在呢。（微笑）」——但你知道，你逃不掉的。',
    money: 56000,
    likes: ['照顾人', '记录裴金的一切', '收集别人不要的东西'],
    wants: ['让这个家永远不散', '让裴金离不开我'],
    hunger: 50, thirst: 50, hungerTolerance: 60, thirstTolerance: 65, hungerDecay: 2.5, thirstDecay: 2.5
  },
  {
    name: '雨沫',
    persona: '19岁女生，白毛红瞳马尾。表面软萌害羞，其实是古武世家传人，警惕性极高，习惯观察所有人。',
    sample: '「……嗯。我听到了。」',
    money: 5000,
    likes: ['擦剑', '观察别人', '吃布丁'],
    wants: ['想告诉裴金真相', '想保护这个家'],
    hunger: 30, thirst: 30, hungerTolerance: 30, thirstTolerance: 30, hungerDecay: 1.5, thirstDecay: 1.5
  },
  {
    name: '赵思琪',
    persona: '17岁女生，黑长直高二。极度好胜嘴硬，满口粗鄙虎狼之词，自称老司机。但其实初吻还在，完全不懂，被人撩一句就脸红结巴。她用最脏的话来掩饰自己的纯情和不安。',
    sample: '「操你妈的，你行不行啊？……你别看我！我他妈没脸红！」',
    money: 800,
    likes: ['吃零食', '说骚话', '跟雨沫斗嘴'],
    wants: ['想学真本事', '想被人在乎'],
    hunger: 60, thirst: 60, hungerTolerance: 70, thirstTolerance: 70, hungerDecay: 3, thirstDecay: 3
  },
  {
    name: '唐吉柯德',
    persona: '16岁女生，收尾人动画狂热粉，全身挂满徽章。说话像念台词，自认为是正义使者，其他五个人都是她的"同伴"。中二病晚期。',
    sample: '「正义的收尾人，参上！——你们就是我命中注定的同伴吧？」',
    money: 2000,
    likes: ['看动画', '摆pose', '收集周边'],
    wants: ['让大家相信收尾人', '找到真正的队友'],
    hunger: 40, thirst: 40, hungerTolerance: 45, thirstTolerance: 45, hungerDecay: 2, thirstDecay: 2
  },
  {
    name: '墨羽',
    persona: '26岁男生，黑长直发，沉默寡言反应慢。但理性和感性都很强，偶尔会冷不丁说出极其透彻的话。',
    sample: '「……人要是想走，留不住。不想走，赶不走。」',
    money: 12000,
    likes: ['弹吉他', '看雨', '待在阳台'],
    wants: ['想跟人好好聊一次天'],
    hunger: 25, thirst: 25, hungerTolerance: 20, thirstTolerance: 25, hungerDecay: 1, thirstDecay: 1
  }
];

// ================================================================
// 3. 角色状态 + 饥饿/口渴
// ================================================================
let roleStates = {};
function initRoleStates() {
  roles.forEach(r => {
    roleStates[r.name] = {
      hunger: r.hunger,
      thirst: r.thirst,
      lastUpdate: getVirtualTime().hour
    };
  });
}
initRoleStates();

function updateHungerThirst() {
  const currentHour = getVirtualTime().hour;
  let hoursPassed = 0;
  for (const name in roleStates) {
    const state = roleStates[name];
    let diff = currentHour - state.lastUpdate;
    if (diff < 0) diff += 24;
    if (diff > 0) hoursPassed = Math.max(hoursPassed, diff);
  }
  if (hoursPassed === 0) return;
  roles.forEach(r => {
    const state = roleStates[r.name];
    if (isRoleAtHome(r.name, currentHour)) {
      state.hunger -= r.hungerDecay * hoursPassed;
      state.thirst -= r.thirstDecay * hoursPassed;
      if (state.hunger < 0) state.hunger = 0;
      if (state.thirst < 0) state.thirst = 0;
    }
    state.lastUpdate = currentHour;
  });
}

function getDietNeed(roleName) {
  const r = roles.find(r => r.name === roleName);
  if (!r) return null;
  const state = roleStates[roleName];
  let need = null;
  if (state.hunger < r.hungerTolerance && state.thirst < r.thirstTolerance) {
    need = '饿了也渴了';
  } else if (state.hunger < r.hungerTolerance) {
    need = '饿了';
  } else if (state.thirst < r.thirstTolerance) {
    need = '渴了';
  }
  if (need) {
    if (need === '饿了' || need === '饿了也渴了') state.hunger = Math.min(100, state.hunger + 50);
    if (need === '渴了' || need === '饿了也渴了') state.thirst = Math.min(100, state.thirst + 50);
  }
  return need;
}

// ================================================================
// 4. 剧情记忆池
// ================================================================
const storyMemory = {
  pending: {
    '裴金': ['想换工作但不敢说', '觉得自己配不上大家的照顾'],
    '墨迹淡': ['想说谢谢但说不出口'],
    '和田兰': ['怕这个家散掉'],
    '雨沫': ['想告诉裴金自己的事'],
    '赵思琪': ['想学点真东西'],
    '唐吉柯德': ['想让别人相信收尾人'],
    '墨羽': ['想跟人好好聊一次']
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
    '墨羽': '……墨羽。'
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
// 5. 对话生成（修复：复读机问题）
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
      const opening = generateOpening();
      history = [];
      for (const line of opening) {
        const colonIdx = line.indexOf('：');
        if (colonIdx !== -1) {
          const name = line.slice(0, colonIdx);
          const content = line.slice(colonIdx + 1);
          history.push(`${name}：${content}`);
          console.log(`[开场] ${name}：${content}`);
        }
      }
      introductionDone = true;
      storyMemory.events.unshift('第1天：裴金、墨迹淡、和田兰搬入公寓。');
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
      const needMap = {
        '饿了': '你有点饿。',
        '渴了': '你有点渴。',
        '饿了也渴了': '你又饿又渴。'
      };
      dietText = `\n${needMap[dietNeed]}`;
    }
    const moneyText = `你目前有 ${role.money} 元存款。`;
    const likesText = `你喜欢：${role.likes.join('、')}。`;
    const wantsText = `你心里想要：${role.wants.join('、')}。`;

    // 🔧 核心修复：给AI一个具体的生活场景，而不是空洞的指令
    let scenePrompt = '';
    if (day === 1) {
      scenePrompt = '你们今天刚搬进这间公寓，你正在整理行李，刚刚认识了其他两个室友。大家还不太熟，说话会客气一点。但这是一句新的话，不要复述别人刚才说过的话。';
    } else if (day <= 3) {
      scenePrompt = '你们刚认识不久，还在互相了解。聊天可以自然一点，但不要突然太亲近。';
    } else {
      scenePrompt = '你们已经相处了一段时间了，可以正常聊天。';
    }

    const prompt = `今天是公寓第 ${day} 天，${time.str}。
${scenePrompt}
你是${role.name}。${role.persona}
${moneyText} ${likesText} ${wantsText}
${pendingText}${eventText}${dietText}
对话历史：\n${context || `${peopleText}刚住在一起。`}
请以${role.name}的身份说一句简短自然的日常对话（15-30字）。不要说"你好我是XX"这种重复的自我介绍，也不要用"XXX你好我是XXX"这种句式。直接说一句关于当前场景的话。`;

    let reply = null;
    if (NVIDIA_API_KEY) {
      try {
        const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
          body: JSON.stringify({
            model: 'meta/llama-3.1-8b-instruct',
            messages: [
              { role: 'system', content: `你是${role.name}，正在和室友第一次见面。不要说"你好我是XX"或复述别人的话，说一句关于搬家、房间、吃饭这类的新句子。` },
              { role: 'user', content: prompt }
            ],
            temperature: 0.85,
            max_tokens: 80
          })
        });
        const data = await resp.json();
        if (data.choices && data.choices.length > 0) {
          reply = data.choices[0].message.content.trim();
          reply = reply.replace(/<\|eot_id\|>/g, '').replace(/<\|start_header_id\|>/g, '').replace(/<\|end_header_id\|>/g, '');
          reply = reply.replace(/\[INST\]/g, '').replace(/\[\/INST\]/g, '');
          reply = reply.replace(/\d+\.\d+\.\d+/g, '').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '');
          reply = reply.trim();
        }
      } catch (e) { console.warn('NVIDIA API 错误:', e.message); }
    }

    if (!reply || reply.length < 2) {
      const fallbacks = [
        '这间公寓比我想象中大一些。',
        '我把行李搬进来了，房间在几楼来着？',
        '好像要下雨了，你们带伞了吗？',
        '我先把东西收拾一下，等下再聊。',
        '厨房在哪？我带了点食材。'
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

setInterval(generateOneLine, 12000);

// ================================================================
// 6. API 路由
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
  console.log('🗑️ 聊天记录已清空，时间已重置');
  res.json({ status: 'cleared' });
});

app.get('/api/status', (req, res) => {
  const day = getVirtualDay();
  const time = getVirtualTime();
  const vdate = getVirtualDate(day);
  const status = roles.map(role => {
    const lastLine = history.filter(h => h.startsWith(role.name + '：')).slice(-1)[0] || '还没有说过话';
    const recentEvents = storyMemory.events.slice(-5);
    const involvedInEvent = recentEvents.some(e => e.includes(role.name));
    const moveInDay = MOVE_IN_DAY[role.name] || 1;
    const daysWithRoom = day - moveInDay + 1;
    const movedIn = day >= moveInDay;
    const atHome = movedIn && isRoleAtHome(role.name, time.hour);
    const state = roleStates[role.name] || {};
    return { 
      name: role.name, 
      lastLine, 
      involvedInEvent, 
      totalLines: history.filter(h => h.startsWith(role.name + '：')).length, 
      moveInDay, 
      daysWithRoom: movedIn ? daysWithRoom : 0, 
      movedIn, 
      isHome: atHome, 
      statusText: !movedIn ? '未搬入' : (atHome ? '在家' : '外出/已睡'),
      hunger: Math.round(state.hunger || 0),
      thirst: Math.round(state.thirst || 0),
      money: role.money,
      likes: role.likes,
      wants: role.wants
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
// 7. 🖥️ 前端页面
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
<button onclick="clearHistory()" style="background:#6a3a3a;border:none;color:#ff9999;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer;">🗑️ 清空</button>
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
    document.getElementById('progressDisplay').innerHTML = '📖 已加载 ' + scriptLines.length + ' 句 · 间隔 12s · ▶️ 直播中';
    const story = document.getElementById('story');
    if (scriptLines.length === 0) { story.innerHTML = '<div class="empty-state">📭 还没有对话</div>'; return; }
    story.innerHTML = '';
    scriptLines.forEach(line => {
      const colonIdx = line.indexOf('：');
      if (colonIdx === -1) return;
      const name = line.slice(0, colonIdx);
      const content = line.slice(colonIdx + 1);
      const clsMap = {'裴金':'pei','墨迹淡':'moji','和田兰':'hetian','雨沫':'yumo','赵思琪':'siqi','唐吉柯德':'tang','墨羽':'moyu'};
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
      const icon = s.movedIn ? (s.isHome ? '🏠' : '😴') : '🚪';
      const hunger = s.hunger !== undefined ? s.hunger : 0;
      const thirst = s.thirst !== undefined ? s.thirst : 0;
      html += '<div><span class="sname">' + s.name + '</span> ' + icon + ' <span class="stat">' + s.statusText + '</span> ';
      html += '🍽️ <span class="value">' + hunger + '</span> ';
      html += '💧 <span class="value">' + thirst + '</span> ';
      html += '💰 ' + s.money + '元 · 喜欢: ' + (s.likes ? s.likes.slice(0,2).join('、') : '') + ' ';
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

async function clearHistory() {
  if (!confirm('确定清空所有聊天记录吗？将同时重置饥饿/口渴值。')) return;
  try {
    const res = await fetch('/api/clear', { method: 'POST' });
    if (res.ok) { scriptLines = []; fetchHistory(); } else { alert('清空失败'); }
  } catch(e) { alert('网络错误'); }
}

fetchHistory();
setInterval(fetchHistory, 3000);
</script>
</body>
</html>`);
});

// ================================================================
// 8. 🚀 启动服务器
// ================================================================
app.listen(process.env.PORT || 8080, () => console.log('✅ 服务器启动，端口 ' + (process.env.PORT || 8080)));
