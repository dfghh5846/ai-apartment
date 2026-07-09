const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// 🔑 替换成你的 DeepSeek API Key
const API_KEY = "你的Key";

// ================================================================
// ⏱️ 加速时间系统
// ================================================================
const CONFIG = {
  REAL_MINUTES_PER_DAY: 12,
  START_DATE: new Date(2024, 0, 1),
};

// 角色搬入时间表
const MOVE_IN_DAY = {
  '裴金': 1,
  '墨迹淡': 1,
  '和田兰': 1,
  '雨沫': 2,
  '赵思琪': 3,
  '墨羽': 15
};

// 工作时间表（null 表示一直在家）
const WORK_SCHEDULE = {
  '裴金': { start: 9, end: 18 },
  '墨迹淡': null,
  '和田兰': { start: 10, end: 19 },
  '雨沫': { start: 8, end: 17 },
  '赵思琪': { start: 8, end: 17 },
  '墨羽': null
};

// 睡眠时间表
const SLEEP_SCHEDULE = {
  '裴金': { start: 22, end: 6 },
  '墨迹淡': { start: 2, end: 10 },
  '和田兰': { start: 23, end: 7 },
  '雨沫': { start: 21, end: 6 },
  '赵思琪': { start: 23, end: 6 },
  '墨羽': { start: 1, end: 9 }
};

let SERVER_START = Date.now();

function getVirtualDay() {
  // 部署后前5分钟强制第1天
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
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), week: getWeek(d) };
}
function getWeek(date) {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return weekdays[date.getDay()];
}

function getIntimacyLevel(day, moveInDay) {
  const daysWithRoom = day - moveInDay + 1;
  if (daysWithRoom <= 0) return '尚未搬入';
  if (daysWithRoom <= 3) return '刚搬进来，彼此很客气，说话礼貌谨慎。';
  if (daysWithRoom <= 7) return '开始熟悉了，偶尔会开些小玩笑，但还是保持距离。';
  if (daysWithRoom <= 14) return '相处了两周，关系不错，会聊日常、吐槽、分享小事。';
  return '已经是很熟悉的室友了，说话随意，像老朋友一样。';
}

// 判断角色是否在家（同时考虑工作时间和睡眠时间，搬入日当天强制在家）
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
// 👥 角色设定
// ================================================================
const roles = [
  { name: '裴金', persona: '你24岁，金发短发圆框眼镜，说话带"可能""好像"，习惯做饭时发呆，敏感易内疚，不敢拒绝别人。' },
  { name: '墨迹淡', persona: '你25岁，蓝发戴眼镜，无业家里蹲，表面话少冷淡，内心细腻温柔，被夸会想逃跑。' },
  { name: '和田兰', persona: '你29岁，亚麻色长发，表面温柔体贴爱照顾人，内心占有欲极强，享受被人需要的感觉。' },
  { name: '雨沫', persona: '你19岁，白毛红瞳扎高马尾，表面软萌害羞，其实是古武传人，警惕性高，不暴露身份。' },
  { name: '赵思琪', persona: '你17岁，黑长直琥珀眼，高二学生。最爱满口颜色话题，动不动就开黄腔，自称"什么都懂"。但其实什么都不懂，被追问就脸红结巴。嘴硬好胜爱吃零食，说大话时很嚣张，被戳穿时秒怂。' },
  { name: '墨羽', persona: '你26岁，黑色长发及腰，平时沉默寡言，反应慢半拍，看起来笨笨的。但理性和感性都极强，两者冲突导致你对外界总是慢三拍。偶尔会突然说出极其通透的话，说完又像没事人一样。' }
];

// ================================================================
// 📖 剧情记忆池（已移除预知事件）
// ================================================================
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

// ================================================================
// ⚙️ 系统逻辑
// ================================================================
let history = [];
let currentIdx = 0;
let isGenerating = false;
let introductionDone = false;

const MAX_HISTORY = 300;
const FRONTEND_DISPLAY = 200;

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getPendingFor(name) {
  const list = storyMemory.pending[name] || [];
  return list.filter(item => {
    const count = storyMemory._counters[name]?.[item] || 0;
    return count < 3;
  });
}

function markMentioned(name, item) {
  if (!storyMemory._counters[name]) storyMemory._counters[name] = {};
  if (storyMemory._counters[name][item] === undefined) storyMemory._counters[name][item] = 0;
  storyMemory._counters[name][item]++;
  if (storyMemory._counters[name][item] >= 3) {
    const idx = storyMemory.pending[name].indexOf(item);
    if (idx !== -1) storyMemory.pending[name].splice(idx, 1);
    console.log(`✅ 剧情推进：${name} 的「${item}」已解决！`);
    const newEvent = `${getVirtualDate(getVirtualDay()).year}年${getVirtualDate(getVirtualDay()).month}月${getVirtualDate(getVirtualDay()).day}日：${name} 放下了「${item}」这件事。`;
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
  return roles.filter(r => {
    if (day < MOVE_IN_DAY[r.name]) return false;
    return isRoleAtHome(r.name, hour);
  });
}

async function generateOneLine() {
  if (isGenerating) return;
  isGenerating = true;
  try {
    const day = getVirtualDay();
    const hour = getVirtualHour(day);

    console.log(`[生成] 第${day}天 ${hour}:00`);

    // === 第1天开场白 ===
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
      storyMemory.events.unshift('第1天：裴金、墨迹淡、和田兰搬入公寓，三人互相认识。');
      if (storyMemory.events.length > 20) storyMemory.events.pop();
      currentIdx = 0;
      isGenerating = false;
      return;
    }

    // === 新角色搬入：自我介绍 + 协助搬入 ===
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

    // === 获取当前在家的角色 ===
    const available = getAvailableRoles(day, hour);
    if (available.length === 0) {
      console.log(`[第${day}天 ${hour}:00] 无人在家，跳过`);
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

    // 确保 currentIdx 不越界
    if (currentIdx >= activeRoles.length) currentIdx = 0;

    const role = activeRoles[currentIdx % activeRoles.length];
    const moveInDay = MOVE_IN_DAY[role.name] || 1;
    const intimacy = getIntimacyLevel(day, moveInDay);
    
    const context = history.slice(-6).join('\n');
    const pending = getPendingFor(role.name);
    const pendingText = pending.length > 0 ? `\n你还有一些未解决的心事：${pending.join('、')}。说话时偶尔可以自然地带出这些事。` : '';
    const eventText = Math.random() < 0.15 ? `\n最近家里发生过这些事：${getRandomEvent() || '没什么特别的'}` : '';
    
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
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是合租室友，说话自然生活化。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.85,
          max_tokens: 100
        })
      });
      const data = await resp.json();
      let text = data.choices?.[0]?.message?.content?.trim() || '嗯…今天天气不错。';
      text = text.replace(/^["']|["']$/g, '');
      
      if (!text || text.length < 2) {
        const fallbacks = ['嗯…今天天气不错。', '我去倒杯水。', '你们饿不饿？', '好像要下雨了。'];
        text = pick(fallbacks);
      }

      if (pending.length > 0) {
        for (const item of pending) {
          if (text.includes(item.slice(0, 4))) {
            markMentioned(role.name, item);
            break;
          }
        }
      }
      const fullLine = `${role.name}：${text}`;
      history.push(fullLine);
      if (history.length > MAX_HISTORY) history.shift();
      currentIdx = (currentIdx + 1) % activeRoles.length;
      console.log(`[${new Date().toLocaleString()}] [第${day}天 ${hour}:00] ${fullLine}`);
    } catch (e) {
      console.error('AI调用失败:', e);
      const fallbacks = ['嗯…今天天气不错。', '我去倒杯水。', '你们饿不饿？', '好像要下雨了。'];
      const text = pick(fallbacks);
      const fullLine = `${role.name}：${text}`;
      history.push(fullLine);
      if (history.length > MAX_HISTORY) history.shift();
      currentIdx = (currentIdx + 1) % activeRoles.length;
      console.log(`[备用] ${fullLine}`);
    }
  } catch (e) {
    console.error('生成失败:', e);
  }
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
  // 重置时间起点，让时间重新从第1天开始
  SERVER_START = Date.now();
  console.log('🗑️ 聊天记录已清空，时间已重置');
  res.json({ status: 'cleared' });
});

app.get('/api/status', (req, res) => {
  const day = getVirtualDay();
  const hour = getVirtualHour(day);
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
      name: role.name,
      lastLine: lastLine,
      involvedInEvent: involvedInEvent,
      totalLines: history.filter(h => h.startsWith(role.name + '：')).length,
      moveInDay: moveInDay,
      daysWithRoom: movedIn ? daysWithRoom : 0,
      movedIn: movedIn,
      isHome: atHome,
      statusText: !movedIn ? '未搬入' : (atHome ? '在家' : '外出/已睡')
    };
  });
  res.json({
    currentDay: day,
    currentHour: hour,
    virtualDate: `${vdate.year}年${vdate.month}月${vdate.day}日 星期${vdate.week} ${hour}:00`,
    status,
    events: storyMemory.events.slice(-5)
  });
});

// ================================================================
// 🖥️ 前端页面
// ================================================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
<元名称=“视口”内容=“宽度=设备宽度，初始比例=1.0”>
<title>AI公寓直播</title>
<style>
*{边距：0；填充：0；框大小：边框；字体系列：system-ui}
正文{background：#1a1a27；颜色：#f0f0f0；填充：15px；显示：flex；justify-content:center}
.wrap{最大宽度：650px；宽度：100%}
。顶栏{background：#292940；填充：12px16px；边框半径：10px；下边距：15px；显示：柔线；对齐内容：间距；对齐项目：居中；弹性环绕：环绕；间隙：6px}
.scene{color：#ffd399；font-size:15px}
。右组{显示：柔线；对齐项目：居中；间隙：8px；柔线环绕：环绕}
.clock{color：#aaccff；font-size:13px}
.live-badge{background：#ff4444；颜色：#fff；填充：2px 10px；边框半径：12px；字体大小：12px；动画：blink1s infinite}
@keyframes 闪烁{0%，100%{不透明度：1}50%{不透明度：0.3}}
。status-btn，.clear-btn{background：#3a3a5a；border:none；color：#fff；padding:4px 12px；边框半径：16px；字体大小：12px；光标：指针}
.status-btn{background：#3a5a7a}
.clear-btn{background：#6a3a3a；color：#ff9999}
.story-box{background：#1f1f32；边框：1px用心#444466；边框半径：12px；填充：16px；高度：620px；溢出y：自动；行高：1.7}
.line{margin:14px0；padding-left:8px；border-left:3px实线#666}
.pei{border-left-color：#ffddaa；color：#ffe8c8}
.Moji{border-left-color：#99ccff；color：#c8e0ff}
.和田{border-left-color：#ffb8cc；color：#ffd8e6}
.Yumo{border-left-color：#ff88aa；color：#ffb3b3}
。Siqi{border-left-color：#ffaa66；color：#ffcc99}
。墨玉{左框颜色：#AABBDD；颜色：#c8d8ee}
.操作{font-size:12px；颜色：#999；下距：3px}
.空状态{color：#666；text-align:center；padding:40px0；}
.modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center}
.modal-overlay.open{显示：弯曲}
.modal{background：#1f1f32；border:1pxsolid#444466；border-roadius:16px；padding:20px；最大容忍度：500px；容忍度：90%；最大海拔：80vh；overflow-y:auto}
。模态标头{显示：弹性；对齐内容：间距；对齐项目：居中；页边距：16px}
.modal-header h2{color：#ffd399；font-size:18px}
。 模态关闭{背景：无；边框：无；颜色：#888；字体大小：24px；光标：指针}
。角色状态{background：#1a1a27；border-roadius:8px；padding:10px；bargin-bottom:8px；border-left:3px固体#666}
。角色状态。rname{font-weight:600；font-size:14px}
.role-status.rlast{font-size:12px；color：#aaa；margin:4px0}
.role-status.revent{font-size:11px；color：#66bbff}
。角色状态。rtime{font-size:10px；color：#666；上边距：2px}
。时间显示{text-align:center；font-size:14px；颜色：#ffd399；底边距：12px；背景：#1a1a27；填充：6px；边框半径：8px；边框：1px固体#333}
</style>
</head>
<body>
<div class="wrap">
<div class="top-bar">
<span class="scene">🏠 公寓·客厅</span>
<div class="右组">
<span class="clock"><span class="live-badge">●live</span><span id="count">0</span>句</span>
<按钮class="status-btn"onclick="showStatus()">📊 状态</button>
<按钮class="clear-btn"onclick="clearHistory()">🗑️ 清空</button>
</div>
</div>
<div class="story-box"id="story"><div class="空态">▄连接直播中...</div></div>
</div>
<div class="modal-overlay"id="modal">
<div class="modal">
<div class="modal-header">
<h2>📊 角色状态</h2>
<按钮class="modal-close"onclick="closeModal()">✕</button>
</div>
<div id="statusContent">加载中...</div>
</div>
</div>
<script>
设lastLength=0；
常量计数=document.getElementById('count')；
Constory=document.getElementById('story')；

异步函数fetchHistory(){
尝试{
常数res=等待提取('/api/history')；
Const data=await res.json()；
const lines=data。历史||[]；
count.textContent=lines.length；
if(行.Length===lastLength&&lines.Length>0)return；
lastLength=lines.length；
story.innerHTML="；
if(lines.length====0){
story.innerHTML='<div class="empty-state">📭 聊天记录已清空，等待新对话...</div>'；
返回；
    }
line.forEach(line=>{
Const colonIdx=line.indexOf('：')；
if(colonIdx===-1)返回；
常量名称=line.slice(0，colonIdx)；
常量内容=line.slice(colonIdx+1)；
常量clsMap={'裴金'：'Pei'，'墨迹淡'：'Moji'，'和田兰'：'和田‘、‘雨沫'：'Yumo'，'赵思琪'：'四七‘、‘墨羽'：'Moyu'}；
常量CLS=clsMap[名称]||"；
Const div=document.createElement('div')；
div.className='line'+cls；
div.innerHTML='<div class="action">'+名称+'</div>'+内容；
story.appendChild(div)；
});
story.scrollTop=story.scrollHeight；
}渔获物(e){
console.error(e)；
  }
}

异步函数clearHistory(){
if(！ 确认('确定要清空所有聊天记录吗？ 此操作不可撤销。 '))返回；
尝试{
常量res=等待提取('/api/clear'，{method：'POST'})；
if(RES.OK){
lastLength=0；
story.innerHTML='<div class="empty-state">🗑️ 已清空，重新生成中...</div>'；
count.textContent="0"；
setTimeout(fetchHistory，2000)；
}else{
警惕的('清空失败，请重试')；
    }
}渔获物(e){
警惕的('网络错误，请检查连接')；
  }
}

异步函数showStatus(){
尝试{
常数res=等待提取('/api/status')；
Const data=await res.json()；
常量状态=数据。状态||[]；
常量事件=数据。事件||[]；
Const currentday=data.currentDay||0；
常量virtualDate=data.virtualDate||"；
让html='<div class="time-display">🏠 公寓第'+currentday+'天('+virtualDate+')</div>'；
status.forEach(s=>{
常数色图={'裴金'：'#ffddaa'，'墨迹淡'：'#99ccff'，'和田兰'：'#ffb8cc'，'雨沫'：'#ff88aa'，'赵思琪'：'#ffaa66'，'墨羽'：'#AABBDD'}；
常量颜色=颜色映射[s.name]||'#666'；
常量homeIcon=s.movedin？(s.家？'🏠'：'😴')：'🚪'；
HTML+='<div class="角色状态"style="border-left-color：'+color+'"><div class="rname"style="color：'+color+'">'+s.name+'</div><div class="rlast">💬 '+s.lastLine+'</div><div class="revent">📌 参与事件：'+(s.artventedInEvent？'✅ 有'：'❌ 无')+'</div><div class="rtime">'+homeIcon+"+(s.移动？(s.ishome？'在家'：'从……里面出去out/已睡')：'尚未搬入')+'·发言'+s.TotalLines+'次</div></div>'；
    });
if(events.length>0){
HTML+='<div style="margin-top:12px；填充：8px；背景：#1a1a27；边框半径：8px；字体大小：12px；颜色：#AAA"><div style="color：#ffd399；font-weight:600；margin-bottom:4px">📜 近期事件</div>'+events.map(e=>'<div
