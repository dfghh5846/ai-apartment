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
  '雨沫': 2, '赵思琪': 3, '唐吉柯德': 5, '墨羽': 15
};

const WORK_SCHEDULE = {
  '裴金': null,
  '墨迹淡': null,
  '和田兰': { start: 10, end: 19 },
  '雨沫': { start: 8, end: 17 },
  '赵思琪': { start: 8, end: 17 },
  '唐吉柯德': { start: 8, end: 17 },
  '墨羽': null
};

const SLEEP_SCHEDULE = {
  '裴金': { start: 22, end: 6 },
  '墨迹淡': { start: 2, end: 10 },
  '和田兰': { start: 23, end: 7 },
  '雨沫': { start: 21, end: 6 },
  '赵思琪': { start: 23, end: 6 },
  '唐吉柯德': { start: 23, end: 7 },
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
// 👥 角色设定（7人含唐吉柯德）
// ================================================================
const roles = [
  { name: '裴金', persona: '24岁女性，金发短发圆框眼镜，线上咨询师（在家）。说话带"可能""好像"，敏感易内疚。' },
  { name: '墨迹淡', persona: '25岁男性，蓝发眼镜，曾是美术天才，因家庭原因自我放弃变成家里蹲。表面冷淡，内心细腻。' },
  { name: '和田兰', persona: '29岁女性，亚麻色长发。表面温柔体贴，内心占有欲极强，用"温柔"控制别人。对裴金有极强占有欲。' },
  { name: '雨沫', persona: '19岁女性，白毛红瞳扎高马尾，古武传人，警惕性高，不暴露身份。' },
  { name: '赵思琪', persona: '17岁女性，黑长直琥珀眼，高二学生。极度好胜嘴硬，满口黄色笑话，自称"老子什么都懂"但实际什么都不懂。' },
  { name: '唐吉柯德', persona: '16岁女性，收尾人动画狂热粉丝，全身挂满徽章周边。说话像念台词，觉得自己是正义化身在"带领"同伴。' },
  { name: '墨羽', persona: '26岁男性，黑色长发及腰，沉默寡言反应慢半拍，偶尔说出极其通透的话。' }
];

// ================================================================
// 📖 剧情记忆池
// ================================================================
const storyMemory = {
  pending: {
    '裴金': ['想换工作但不敢说', '觉得大家对她太好自己配不上'],
    '墨迹淡': ['想跟室友说谢谢但说不出口'],
    '和田兰': ['希望这个家永远不要散'],
    '雨沫': ['想告诉裴金自己是古武传人'],
    '赵思琪': ['想学点真本事'],
    '唐吉柯德': ['想让大家相信收尾人是存在的'],
    '墨羽': ['想找人认真说一次话']
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
    '墨迹淡': '……墨迹淡。你们好。',
    '和田兰': '大家好呀～我是和田兰，以后我来负责做饭。',
    '雨沫': '我、我是雨沫…请多指教！',
    '赵思琪': '哼！我来了！赵思琪！记住了啊！',
    '唐吉柯德': '（推门而入）正义的收尾人，唐吉柯德，参上！你们就是我的新同伴吧？',
    '墨羽': '……墨羽。'
  };
  return intros[roleName] || `${roleName}：大家好。`;
}

function generateOpening() {
  return [
    '裴金：那个…大家好，我叫裴金…请多关照。',
    '墨迹淡：……墨迹淡。你们好。',
    '和田兰：大家好呀～我是和田兰，以后我来负责做饭。'
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

    // === 第1天开场 ===
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

    // === 新角色搬入 ===
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

    // === 当前在家的角色 ===
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
    const pendingText = pending.length > 0 ? `\n你还有一些未解决的心事：${pending.join('、')}。` : '';
    const eventText = Math.random() < 0.15 ? `\n最近家里发生过这些事：${pick(storyMemory.events.slice(-10)) || '没什么特别的'}` : '';
    const prompt = `今天是公寓成立第 ${day} 天，当前时间 ${time.str}。${intimacy}
你是${role.name}。${role.persona}${pendingText}${eventText}
对话历史：\n${context || `${peopleText}刚开始合租。`}
轮到你说话了，请按以下要求输出：
1. 先描述你正在做什么。
2. 然后说一句日常台词。
3. 请回应上一个人说的话。
总字数控制在60字以内。`;

    let reply = null;
    if (NVIDIA_API_KEY) {
      try {
        const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
          body: JSON.stringify({
            model: 'meta/llama-3.1-8b-instruct',
            messages: [{ role: 'system', content: '你是合租室友，说话自然生活化。' }, { role: 'user', content: prompt }],
            temperature: 0.85,
            max_tokens: 200
          })
        });
        const data = await resp.json();
        if (data.choices && data.choices.length > 0) {
          reply = data.choices[0].message.content.trim();
          // 清洗特殊标记
          reply = reply.replace(/<\|eot_id\|>/g, '');
          reply = reply.replace(/<\|start_header_id\|>/g, '');
          reply = reply.replace(/<\|end_header_id\|>/g, '');
          reply = reply.replace(/\[INST\]/g, '');
          reply = reply.replace(/\[\/INST\]/g, '');
          reply = reply.replace(/\d+\.\d+\.\d+/g, '');
          reply = reply.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '');
          reply = reply.trim();
        }
      } catch (e) { console.warn('NVIDIA API 错误:', e.message); }
    }

    if (!reply || reply.length < 2) {
      const fallbacks = ['嗯…今天天气不错。', '我去倒杯水。', '你们饿不饿？', '好像要下雨了。', '周末有什么安排吗？', '我昨天睡得不太好。', '冰箱里没鸡蛋了。', '外面风有点大。', '今天心情还行。', '你们在聊什么？', '我刚刚在想事情。', '这个月电费好像涨了。', '有快递要拿吗？', '我想吃火锅。', '你们听到什么声音了吗？', '今天过得怎么样？', '我想出去走走。', '你们慢慢聊。', '我去阳台透透气。', '记得关窗。'];
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

setInterval(generateOneLine, 8000);

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
    return { name: role.name, lastLine, involvedInEvent, totalLines: history.filter(h => h.startsWith(role.name + '：')).length, moveInDay, daysWithRoom: movedIn ? daysWithRoom : 0, movedIn, isHome: atHome, statusText: !movedIn ? '未搬入' : (atHome ? '在家' : '外出/已睡') };
  });
  res.json({ currentDay: day, currentTime: time.str, virtualDate: `${vdate.year}年${vdate.month}月${vdate.day}日 星期${vdate.week} ${time.str}`, status, events: storyMemory.events.slice(-5) });
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
</style>
</head>
<body>
<div class="wrap">
<div class="top-bar">
<div style="display:flex;align-items:center;gap:10px;">
<button class="menu-btn" onclick="toggleMenu()">☰</button>
<span class="scene">🏠 公寓·客厅</span>
</div>
<div class="right-group">
<span class="clock"><span class="live-badge">● 直播</span> <span id="count">0</span>句</span>
<button onclick="showStatus()" style="background:#3a5a7a;border:none;color:#fff;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer;">📊 状态</button>
<button onclick="clearHistory()" style="background:#6a3a3a;border:none;color:#ff9999;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer;">🗑️ 清空</button>
</div>
</div>
<div id="progressDisplay" style="font-size:12px;color:#888;padding:4px 0;">⏳ 加载中...</div>
<div class="story-box" id="story"><div class="empty-state">⏳ 连接直播中...</div></div>
</div>

<script>
let scriptLines = [];
let loadError = false;

async function fetchHistory() {
  try {
    const res = await fetch('/api/history');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    loadError = false;
    scriptLines = data.history || [];
    document.getElementById('count').textContent = scriptLines.length;
    document.getElementById('progressDisplay').innerHTML = '📖 已加载 ' + scriptLines.length + ' 句 · 间隔 8s · ▶️ 直播中';
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
  } catch(e) {
    loadError = true;
    document.getElementById('count').textContent = '0';
    document.getElementById('progressDisplay').innerHTML = '<span style="color:#ff6666;">❌ 连接失败，请刷新</span>';
    document.getElementById('story').innerHTML = '<div class="empty-state" style="color:#ff6666;">❌ 无法连接服务器</div>';
    console.error(e);
  }
}

function toggleMenu() {
  document.getElementById('menuModal').classList.toggle('open');
}

async function showStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    let html = '<div style="background:#1a1a27;padding:15px;border-radius:12px;border:1px solid #444;max-width:500px;margin:20px auto;">';
    html += '<div style="color:#ffd399;font-size:16px;margin-bottom:10px;">🏠 ' + data.virtualDate + '</div>';
    data.status.forEach(s => {
      const icon = s.movedIn ? (s.isHome ? '🏠' : '😴') : '🚪';
      html += '<div style="padding:6px 0;border-bottom:1px solid #333;font-size:13px;">';
      html += '<span style="font-weight:600;">' + s.name + '</span> ';
      html += icon + ' ' + s.statusText + ' ';
      html += '· 发言 ' + s.totalLines + ' 次';
      html += '</div>';
    });
    if (data.events && data.events.length > 0) {
      html += '<div style="margin-top:10px;font-size:12px;color:#888;">📜 ' + data.events.slice(-3).join(' · ') + '</div>';
    }
    html += '</div>';
    alert(html.replace(/<[^>]*>/g, '').replace(/🏠/g,'🏠').replace(/😴/g,'😴').replace(/🚪/g,'🚪'));
  } catch(e) { alert('获取状态失败'); }
}

async function clearHistory() {
  if (!confirm('确定清空所有聊天记录吗？')) return;
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
// 🚀 启动服务器
// ================================================================
app.listen(process.env.PORT || 8080, () => console.log('✅ 服务器启动，端口 ' + (process.env.PORT || 8080)));
