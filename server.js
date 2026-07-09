const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 🔑 在这里直接填入你的 DeepSeek API Key
const API_KEY = "sk-814290bb204845858ff2305a4a5a0d01"; 

if (!API_KEY || API_KEY === "你的Key") {
  console.error('❌ 错误：请在代码第10行配置真实的 DEEPSEEK_API_KEY');
  process.exit(1);
}

// ================================================================
// ⏱️ 加速时间系统
// ================================================================
const CONFIG = {
  REAL_MINUTES_PER_DAY: 12,
  START_DATE: new Date(2024, 0, 1),
};

const MOVE_IN_DAY = {
  '裴金': 1, '墨迹淡': 1, '和田兰': 1,
  '雨沫': 2, '赵思琪': 3, '墨羽': 15
};

const WORK_SCHEDULE = {
  '裴金': { start: 9, end: 18 }, '墨迹淡': null,
  '和田兰': { start: 10, end: 19 }, '雨沫': { start: 8, end: 17 },
  '赵思琪': { start: 8, end: 17 }, '墨羽': null
};

const SLEEP_SCHEDULE = {
  '裴金': { start: 22, end: 6 }, '墨迹淡': { start: 2, end: 10 },
  '和田兰': { start: 23, end: 7 }, '雨沫': { start: 21, end: 6 },
  '赵思琪': { start: 23, end: 6 }, '墨羽': { start: 1, end: 9 }
};

let SERVER_START = Date.now();

function getVirtualDay() {
  const elapsed = (Date.now() - SERVER_START) / 60000;
  if (elapsed < 5) return 1;
  return Math.floor(elapsed / CONFIG.REAL_MINUTES_PER_DAY) + 1;
}

function getVirtualHour() {
  const totalMinutes = (Date.now() - SERVER_START) / 60000;
  const dayMinutes = totalMinutes % (CONFIG.REAL_MINUTES_PER_DAY * 60);
  return Math.floor(dayMinutes / 60) % 24;
}

function getVirtualDate(day) {
  const d = new Date(CONFIG.START_DATE);
  d.setDate(d.getDate() + (day - 1));
  return { 
    year: d.getFullYear(), 
    month: d.getMonth() + 1, 
    day: d.getDate(), 
    week: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()] 
  };
}

function getIntimacyLevel(day, moveInDay) {
  const daysWithRoom = day - moveInDay + 1;
  if (daysWithRoom <= 0) return '尚未搬入';
  if (daysWithRoom <= 3) return '刚搬进来，彼此很客气，说话礼貌谨慎。';
  if (daysWithRoom <= 7) return '开始熟悉了，偶尔会开些小玩笑，但还是保持距离。';
  if (daysWithRoom <= 14) return '相处了两周，关系不错，会聊日常、吐槽、分享小事。';
  return '已经是很熟悉的室友了，说话随意，像老朋友一样。';
}

function isRoleAtHome(roleName, hour) {
  const day = getVirtualDay();
  if (day === MOVE_IN_DAY[roleName]) return true;

  const work = WORK_SCHEDULE[roleName];
  if (work) {
    const { start, end } = work;
    if (start < end) { if (hour >= start && hour < end) return false; }
    else { if (hour >= start || hour < end) return false; }
  }
  const sleep = SLEEP_SCHEDULE[roleName];
  if (sleep) {
    const { start, end } = sleep;
    if (start < end) { if (hour >= start && hour < end) return false; }
    else { if (hour >= start || hour < end) return false; }
  }
  return true;
}

// ================================================================
// 👥 角色与剧情记忆
// ================================================================
const roles = [
  { name: '裴金', persona: '你24岁，金发短发圆框眼镜，说话带"可能""好像"，习惯做饭时发呆，敏感易内疚，不敢拒绝别人。' },
  { name: '墨迹淡', persona: '你25岁，蓝发戴眼镜，无业家里蹲，表面话少冷淡，内心细腻温柔，被夸会想逃跑。' },
  { name: '和田兰', persona: '你29岁，亚麻色长发，表面温柔体贴爱照顾人，内心占有欲极强，享受被人需要的感觉。' },
  { name: '雨沫', persona: '你19岁，白毛红瞳扎高马尾，表面软萌害羞，其实是古武传人，警惕性高，不暴露身份。' },
  { name: '赵思琪', persona: '你17岁，黑长直琥珀眼，高二学生。最爱满口颜色话题，动不动就开黄腔，自称"什么都懂"。但其实什么都不懂，被追问就脸红结巴。嘴硬好胜爱吃零食，说大话时很嚣张，被戳穿时秒怂。' },
  { name: '墨羽', persona: '你26岁，黑色长发及腰，平时沉默寡言，反应慢半拍，看起来笨笨的。但理性和感性都极强，两者冲突导致你对外界总是慢三拍。偶尔会突然说出极其通透的话，说完又像没事人一样。' }
];

const storyMemory = {
  pending: {
    '裴金': ['想换工作，但不敢开口说', '觉得大家对她太好，自己配不上'],
    '墨迹淡': ['想跟室友们说谢谢，但说不出口', '有点羡慕赵思琪那么敢说话'],
    '和田兰': ['希望这个家永远不要散', '觉得墨羽看自己的眼神有点不一样'],
    '雨沫': ['想告诉裴金自己其实是古武传人', '但怕说了大家就不理她了'],
    '赵思琪': ['想学点什么真本事', '但其实连从哪开始都不知道'],
    '墨羽': ['想找人认真说一次话', '但每次开口都卡在喉咙里']
  },
  events: [],
  _counters: {}
};

for (const name in storyMemory.pending) {
  storyMemory._counters[name] = {};
  storyMemory.pending[name].forEach(item => {
    storyMemory._counters[name][item] = 0;
  });
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
    const vDate = getVirtualDate(getVirtualDay());
    const newEvent = `${vDate.year}年${vDate.month}月${vDate.day}日：${name} 放下了「${item}」这件事。`;
    storyMemory.events.push(newEvent);
    if (storyMemory.events.length > 20) storyMemory.events.shift();
  }
}

function getRandomEvent() {
  if (storyMemory.events.length === 0) return null;
  return pick(storyMemory.events.slice(-10));
}

function getIntroLine(roleName) {
  const intros = {
    '裴金': '那个…大家好，我叫裴金，是做线上咨询的…请多关照。',
    '墨迹淡': '……墨迹淡。你们好。',
    '和田兰': '大家好呀～我是和田兰，以后我来负责做饭，你们有什么忌口吗？',
    '雨沫': '我、我是雨沫…请多指教！(攥紧衣角)',
    '赵思琪': '哼！我来了！赵思琪！记住了啊！(假装很凶)',
    '墨羽': '……(沉默几秒后)墨羽。……住这里。'
  };
  return intros[roleName] || `${roleName}：大家好。`;
}

function generateOpening() {
  return [
    '裴金：那个…大家好，我叫裴金，是做线上咨询的…请多关照。',
    '墨迹淡：……墨迹淡。你们好。',
    '和田兰：大家好呀～我是和田兰，以后我来负责做饭，你们有什么忌口吗？'
  ];
}

function getAvailableRoles(day, hour) {
  return roles.filter(r => day >= MOVE_IN_DAY[r.name] && isRoleAtHome(r.name, hour));
}

// ================================================================
// 🤖 核心生成逻辑 (已修复锁死Bug)
// ================================================================
async function generateOneLine() {
  if (isGenerating) return;
  isGenerating = true;

  try {
    const day = getVirtualDay();
    const hour = getVirtualHour(); 
    console.log(`[生成] 第${day}天 ${hour}:00`);

    // 开场白逻辑
    if (day === 1 && !introductionDone) {
      history = [];
      for (const line of generateOpening()) {
        const colonIdx = line.indexOf('：');
        if (colonIdx !== -1) {
          const name = line.slice(0, colonIdx);
          const content = line.slice(colonIdx + 1);
          history.push(`${name}：${content}`);
        }
      }
      introductionDone = true;
      storyMemory.events.unshift('第1天：裴金、墨迹淡、和田兰搬入公寓，三人互相认识。');
      if (storyMemory.events.length > 20) storyMemory.events.pop();
      currentIdx = 0;
      return; 
    }

    // 角色搬入逻辑
    const allMoved = roles.filter(r => day >= MOVE_IN_DAY[r.name]);
    for (const newRole of allMoved) {
      if (day === MOVE_IN_DAY[newRole.name]) {
        const alreadySpoke = history.some(h => h.startsWith(newRole.name + '：'));
        if (!alreadySpoke) {
          history.push(`${newRole.name}：${getIntroLine(newRole.name)}`);
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
    if (available.length === 0) {
      console.log(`[第${day}天 ${hour}:00] 无人在家，跳过`);
      return;
    }

    const activeRoles = available.filter(r => {
      const hasSpoken = history.some(h => h.startsWith(r.name + '：'));
      return day !== MOVE_IN_DAY[r.name] || hasSpoken;
    });

    if (activeRoles.length === 0) {
      if (available.length > 0) {
        history.push(`${available[0].name}：${getIntroLine(available[0].name)}`);
        if (history.length > MAX_HISTORY) history.shift();
      }
      return;
    }

    if (currentIdx >= activeRoles.length) currentIdx = 0;
    const role = activeRoles[currentIdx % activeRoles.length];
    const moveInDay = MOVE_IN_DAY[role.name] || 1;
    const intimacy = getIntimacyLevel(day, moveInDay);
    
    const context = history.slice(-6).join('\n');
    const pending = getPendingFor(role.name);
    const pendingText = pending.length > 0 
      ? `\n你还有一些未解决的心事：${pending.join('、')}。如果决定提及，必须在台词末尾加上标签：[剧情推进: 心事内容]` 
      : '';
    const eventText = Math.random() < 0.15 
      ? `\n最近家里发生过这些事：${getRandomEvent() || '没什么特别的'}` 
      : '';
    
    const prompt = `今天是公寓成立第 ${day} 天，当前时间 ${hour}:00。${intimacy}
你是${role.name}。${role.persona}${pendingText}${eventText}
对话历史：\n${context || '六人刚开始合租。'}

轮到你说话了，请按以下要求输出：
1. 先描述你正在做什么（比如"正在厨房切菜""坐在沙发上发呆"）
2. 然后说一句日常台词
3. 同时请回应上一个人说的话
总字数控制在60字以内。`;

    try {
      const resp = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          messages: [
            { role: 'system', content: '你是合租室友，说话自然生活化。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.85,
          max_tokens: 200 
        })
      });
      const data = await resp.json();
      let text = data.choices?.[0]?.message?.content?.trim() || '嗯…今天天气不错。';
      text = text.replace(/^["']|["']$/g, '');
      
      if (!text || text.length < 2) text = pick(['嗯…今天天气不错。', '我去倒杯水。', '你们饿不饿？', '好像要下雨了。']);

      // 精准剧情触发：通过正则匹配 [剧情推进: xxx]
      const match = text.match(/\[剧情推进:\s*(.+?)\]/);
      if (match) {
        const mentionedItem = match[1].trim();
        markMentioned(role.name, mentionedItem);
        text = text.replace(match[0], '').trim(); 
      }

      const fullLine = `${role.name}：${text}`;
      history.push(fullLine);
      if (history.length > MAX_HISTORY) history.shift();
      currentIdx = (currentIdx + 1) % activeRoles.length;
      console.log(`[${new Date().toLocaleString()}] [第${day}天 ${hour}:00] ${fullLine}`);
    } catch (e) {
      console.error('AI调用失败:', e);
      const text = pick(['嗯…今天天气不错。', '我去倒杯水。', '你们饿不饿？', '好像要下雨了。']);
      history.push(`${role.name}：${text}`);
      if (history.length > MAX_HISTORY) history.shift();
      currentIdx = (currentIdx + 1) % activeRoles.length;
    }
  } catch (e) {
    console.error('生成失败:', e);
  } finally {
    // 修复：无论成功失败，都释放锁
    isGenerating = false;
  }
}

// 修复：改用递归 setTimeout，确保上一次生成完毕后，再等待8秒
function scheduleNext() {
  setTimeout(async () => {
    await generateOneLine();
    scheduleNext();
  }, 8000);
}
scheduleNext();

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
  console.log('🗑️ 聊天记录已清空，时间已重置');
  res.json({ status: 'cleared' });
});

app.get('/api/status', (req, res) => {
  const day = getVirtualDay();
  const hour = getVirtualHour();
  const vdate = getVirtualDate(day);
  const status = roles.map(role => {
    const lastLine = history.filter(h => h.startsWith(role.name + '：')).slice(-1)[0] || '还没有说过话';
    const recentEvents = storyMemory.events.slice(-5);
    const involvedInEvent = recentEvents.some(e => e.includes(role.name));
    const moveInDay = MOVE_IN_DAY[role.name] || 1;
    const daysWithRoom = day - moveInDay + 1;
    const movedIn = day >= moveInDay;
    const atHome = movedIn && isRoleAtHome(role.name, hour);
    return {
      name: role.name, lastLine, involvedInEvent,
      totalLines: history.filter(h => h.startsWith(role.name + '：')).length,
      moveInDay, daysWithRoom: movedIn ? daysWithRoom : 0, movedIn, isHome: atHome,
      statusText: !movedIn ? '未搬入' : (atHome ? '在家' : '外出/已睡')
    };
  });
  res.json({
    currentDay: day, currentHour: hour,
    virtualDate: `${vdate.year}年${vdate.month}月${vdate.day}日 星期${vdate.week} ${hour}:00`,
    status, events: storyMemory.events.slice(-5)
  });
});

// ================================================================
// 🖥️ 前端页面 (已修复全量重绘Bug)
// ================================================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI公寓直播</title>
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
    .status-btn,.clear-btn{background:#3a3a5a;border:none;color:#fff;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer}
    .status-btn{background:#3a5a7a}
    .clear-btn{background:#6a3a3a;color:#ff9999}
    .story-box{background:#1f1f32;border:1px solid #444466;border-radius:12px;padding:16px;height:620px;overflow-y:auto;line-height:1.7}
    .line{margin:14px 0;padding-left:8px;border-left:3px solid #666}
    .pei{border-left-color:#ffddaa;color:#ffe8c8}
    .moji{border-left-color:#99ccff;color:#c8e0

---
代码完整发完了，要不要我再把前端 HTML 抽离成单独的 index.html 文件？结构会更清晰。
