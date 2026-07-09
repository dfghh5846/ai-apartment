const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "sk-814290bb204845858ff2305a4a5a0d01"; // 🔑 替换

// ================================================================
// 时间系统
// ================================================================
const CONFIG = {
  REAL_MINUTES_PER_DAY: 24,  // 现实24分钟 = 虚拟1天 → 1分钟 = 1小时
  START_DATE: new Date(2024, 0, 1),
};

const MOVE_IN_DAY = {
  '裴金': 1, '墨迹淡': 1, '和田兰': 1,
  '雨沫': 2, '赵思琪': 3, '墨羽': 15
};

const WORK_SCHEDULE = {
  '裴金': null,
  '墨迹淡': null,
  '和田兰': { start: 10, end: 19 },
  '雨沫': { start: 8, end: 17 },
  '赵思琪': { start: 8, end: 17 },
  '墨羽': null
};

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
  const elapsed = (Date.now() - SERVER_START) / 60000;
  if (elapsed < 5) return 1;
  return Math.floor(elapsed / CONFIG.REAL_MINUTES_PER_DAY) + 1;
}

// ✅ 时间真正流动（分钟级）
function getVirtualTime() {
  const totalMinutes = (Date.now() - SERVER_START) / 60000;
  const dayMinutes = totalMinutes % (CONFIG.REAL_MINUTES_PER_DAY * 60);
  let hour = (Math.floor(dayMinutes / 60) + 8) % 24;
  const minute = Math.floor(dayMinutes % 60);
  if (hour < 0) hour += 24;
  if (hour >= 24) hour -= 24;
  return {
    hour: hour,
    minute: minute,
    str: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0')
  };
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

const roles = [
  {
    name: '裴金',
    persona: '你是24岁女性，金发短发圆框眼镜，做线上心理咨询师（在家办公）。说话带"可能""好像"，敏感易内疚，不敢拒绝别人。'
  },
  {
    name: '墨迹淡',
    persona: '你是25岁男性，蓝发戴眼镜，曾经是美术天才（高中被老师誉为"有灵气"），因父母离异自我放弃后变成家里蹲。表面冷淡话少，内心极其细腻敏感。直觉敏锐，偶尔会一针见血。'
  },
  {
    name: '和田兰',
    persona: '你是29岁女性，亚麻色长发。表面温柔体贴爱照顾人，但内心极其扭曲——你用"温柔"作为控制别人的工具。你享受的不是被需要，而是"对方离不开你"的感觉。你会记住每个人最脆弱的时刻，然后在未来"恰好"提起。你从不直接要求别人留下，而是用"我会一直等你"让对方自己产生愧疚。你对裴金有极强的占有欲——她越依赖你，你越满足。'
  },
  {
    name: '雨沫',
    persona: '你是19岁女性，白毛红瞳扎高马尾，表面软萌害羞，其实是古武传人，警惕性高，不暴露身份。'
  },
  {
    name: '赵思琪',
    persona: '你是17岁女性，黑长直琥珀眼，高二学生。极度好胜嘴硬，满口黄色笑话和脏话，张口就是"鸡巴""操""干你""你行不行啊"之类的，自称"老子什么都懂"。但你其实完全不懂，初吻还在，被人撩一句就脸红结巴。你用最粗俗的语言来掩盖内心的不安——你真正想要的是别人不要无视你。'
  },
  {
    name: '墨羽',
    persona: '你是26岁男性，黑色长发及腰，沉默寡言反应慢半拍，看起来笨笨的。但理性和感性都极强，两者冲突导致你对外界总是慢三拍。偶尔会突然说出极其通透的话，说完又像没事人一样。'
  }
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
    storyMemory.events.push(`${getVirtualDate(getVirtualDay()).year}年${getVirtualDate(getVirtualDay()).month}月${getVirtualDate(getVirtualDay()).day}日：${name} 放下了「${item}」这件事。`);
    if (storyMemory.events.length > 20) storyMemory.events.shift();
  }
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

async function generateOneLine() {
  if (isGenerating) return;
  isGenerating = true;
  try {
    const day = getVirtualDay();
    const time = getVirtualTime();
    const hour = time.hour;

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
    const peopleText = ['零人', '一人', '两人', '三人', '四人', '五人', '六人'][currentCount] || '六人';
    
    const pending = getPendingFor(role.name);
    const pendingText = pending.length > 0 ? `\n你还有一些未解决的心事：${pending.join('、')}。说话时偶尔可以自然地带出这些事。` : '';
    const eventText = Math.random() < 0.15 ? `\n最近家里发生过这些事：${pick(storyMemory.events.slice(-10)) || '没什么特别的'}` : '';
    
    const prompt = `今天是公寓成立第 ${day} 天，当前时间 ${time.str}。${intimacy}
你是${role.name}。${role.persona}${pendingText}${eventText}
对话历史：\n${context || `${peopleText}刚开始合租。`}

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
          messages: [{ role: 'system', content: '你是合租室友，说话自然生活化。' }, { role: 'user', content: prompt }],
          temperature: 0.85,
          max_tokens: 200
        })
      });
      const data = await resp.json();
      let text = data.choices?.[0]?.message?.content?.trim() || null;
      if (text) text = text.replace(/^["']|["']$/g, '');
      
      if (!text || text.length < 2) {
        const fullLine = `${role.name}：❌ AI返回空内容，请重试`;
        history.push(fullLine);
        if (history.length > MAX_HISTORY) history.shift();
        currentIdx = (currentIdx + 1) % activeRoles.length;
        isGenerating = false;
        return;
      }

      if (pending.length > 0) {
        for (const item of pending) {
          if (text.includes(item.slice(0, 4))) { markMentioned(role.name, item); break; }
        }
      }
      const fullLine = `${role.name}：${text}`;
      history.push(fullLine);
      if (history.length > MAX_HISTORY) history.shift();
      currentIdx = (currentIdx + 1) % activeRoles.length;
      console.log(`[${new Date().toLocaleString()}] [第${day}天 ${time.str}] ${fullLine}`);
    } catch (e) {
      console.error('AI调用失败:', e);
      const fullLine = `${role.name}：❌ AI服务暂时不可用（请检查Key或余额）`;
      history.push(fullLine);
      if (history.length > MAX_HISTORY) history.shift();
      currentIdx = (currentIdx + 1) % activeRoles.length;
    }
  } catch (e) {
    console.error('生成失败:', e);
  }
  isGenerating = false;
}

setInterval(generateOneLine, 8000);

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

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>AI公寓直播</title>
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
.status-btn{background:#3a5a7a}.clear-btn{background:#6a3a3a;color:#ff9999}
.story-box{background:#1f1f32;border:1px solid #444466;border-radius:12px;padding:16px;height:620px;overflow-y:auto;line-height:1.7}
.line{margin:14px 0;padding-left:8px;border-left:3px solid #666}
.pei{border-left-color:#ffddaa;color:#ffe8c8}
.moji{border-left-color:#99ccff;color:#c8e0ff}
.hetian{border-left-color:#ffb8cc;color:#ffd8e6}
.yumo{border-left-color:#ff88aa;color:#ffb3b3}
.siqi{border-left-color:#ffaa66;color:#ffcc99}
.moyu{border-left-color:#aabbdd;color:#c8d8ee}
.action{font-size:12px;color:#999;margin-bottom:3px}
.empty-state{color:#666;text-align:center;padding:40px 0;}
.modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center}
.modal-overlay.open{display:flex}
.modal{background:#1f1f32;border:1px solid #444466;border-radius:16px;padding:20px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.modal-header h2{color:#ffd399;font-size:18px}
.modal-close{background:none;border:none;color:#888;font-size:24px;cursor:pointer}
.role-status{background:#1a1a27;border-radius:8px;padding:10px;margin-bottom:8px;border-left:3px solid #666}
.role-status .rname{font-weight:600;font-size:14px}
.role-status .rlast{font-size:12px;color:#aaa;margin:4px 0}
.role-status .revent{font-size:11px;color:#66bbff}
.role-status .rtime{font-size:10px;color:#666;margin-top:2px}
.time-display{text-align:center;font-size:14px;color:#ffd399;margin-bottom:12px;background:#1a1a27;padding:6px;border-radius:8px;border:1px solid #333}
</style>
</head>
<body>
<div class="wrap">
<div class="top-bar">
<span class="scene">🏠 公寓·客厅</span>
<div class="right-group">
<span class="clock"><span class="live-badge">● LIVE</span> <span id="count">0</span>句</span>
<button class="status-btn" onclick="showStatus()">📊 状态</button>
<button class="clear-btn" onclick="clearHistory()">🗑️ 清空</button>
</div>
</div>
<div class="story-box" id="story"><div class="empty-state">⏳ 连接直播中...</div></div>
</div>
<div class="modal-overlay" id="modal">
<div class="modal">
<div class="modal-header"><h2>📊 角色状态</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
<div id="statusContent">加载中...</div>
</div>
</div>
<script>
let lastLength=0;const story=document.getElementById('story');const count=document.getElementById('count');
async function fetchHistory(){try{const res=await fetch('/api/history');const data=await res.json();const lines=data.history||[];count.textContent=lines.length;if(lines.length===lastLength&&lines.length>0)return;lastLength=lines.length;story.innerHTML='';if(lines.length===0){story.innerHTML='<div class="empty-state">📭 聊天记录已清空，等待新对话...</div>';return}
lines.forEach(line=>{const colonIdx=line.indexOf('：');if(colonIdx===-1)return;const name=line.slice(0,colonIdx);const content=line.slice(colonIdx+1);const clsMap={'裴金':'pei','墨迹淡':'moji','和田兰':'hetian','雨沫':'yumo','赵思琪':'siqi','墨羽':'moyu'};const cls=clsMap[name]||'';const div=document.createElement('div');div.className='line '+cls;div.innerHTML='<div class="action">'+name+'</div>'+content;story.appendChild(div)});story.scrollTop=story.scrollHeight}catch(e){console.error(e)}}
async function clearHistory(){if(!confirm('确定要清空所有聊天记录吗？此操作不可撤销。'))return;try{const res=await fetch('/api/clear',{method:'POST'});if(res.ok){lastLength=0;story.innerHTML='<div class="empty-state">🗑️ 已清空，重新生成中...</div>';count.textContent='0';setTimeout(fetchHistory,2000)}else{alert('清空失败，请重试')}}catch(e){alert('网络错误，请检查连接')}}
async function showStatus(){try{const res=await fetch('/api/status');const data=await res.json();const status=data.status||[];const events=data.events||[];const currentDay=data.currentDay||0;const virtualDate=data.virtualDate||'';let html='<div class="time-display">🏠 公寓第 '+currentDay+' 天 ('+virtualDate+')</div>';status.forEach(s=>{const colorMap={'裴金':'#ffddaa','墨迹淡':'#99ccff','和田兰':'#ffb8cc','雨沫':'#ff88aa','赵思琪':'#ffaa66','墨羽':'#aabbdd'};const color=colorMap[s.name]||'#666';const homeIcon=s.movedIn?(s.isHome?'🏠':'😴'):'🚪';html+='<div class="role-status" style="border-left-color:'+color+'"><div class="rname" style="color:'+color+'">'+s.name+'</div><div class="rlast">💬 '+s.lastLine+'</div><div class="revent">📌 参与事件：'+(s.involvedInEvent?'✅ 有':'❌ 无')+'</div><div class="rtime">'+homeIcon+' '+(s.movedIn?(s.isHome?'在家':'外出/已睡'):'尚未搬入')+' · 发言 '+s.totalLines+' 次</div></div>'});if(events.length>0){html+='<div style="margin-top:12px;padding:8px;background:#1a1a27;border-radius:8px;font-size:12px;color:#aaa"><div style="color:#ffd399;font-weight:600;margin-bottom:4px">📜 近期事件</div>'+events.map(e=>'<div>• '+e+'</div>').join('')+'</div>'}document.getElementById('statusContent').innerHTML=html;document.getElementById('modal').classList.add('open')}catch(e){alert('获取状态失败：'+e.message)}}
function closeModal(){document.getElementById('modal').classList.remove('open')}
setInterval(fetchHistory,2000);fetchHistory();
</script>
</body>
</html>`);
});

app.listen(process.env.PORT || 8080, () => console.log('✅ 服务器已启动，监听端口 ' + (process.env.PORT || 8080)));
