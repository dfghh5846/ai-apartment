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

const MOVE_IN_DAY = {
  '裴金': 1,
  '墨迹淡': 1,
  '和田兰': 1,
  '雨沫': 2,
  '赵思琪': 3,
  '墨羽': 15
};

const SERVER_START = Date.now();

function getVirtualDay() {
  const elapsed = (Date.now() - SERVER_START) / 60000;
  return Math.floor(elapsed / CONFIG.REAL_MINUTES_PER_DAY) + 1;
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
// 📖 剧情设计区（仅后台使用，不显示在状态栏）
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
  events: [
    '第2天：雨沫搬入公寓，带来了两把木剑',
    '第3天：赵思琪搬入公寓，书包里塞满了零食',
    '第15天：墨羽搬入公寓，只带了一个行李箱和一把旧吉他'
  ],
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
  const openingLines = [
    '裴金：那个…大家好，我叫裴金，是做线上咨询的…请多关照。',
    '墨迹淡：……墨迹淡。你们好。',
    '和田兰：大家好呀～我是和田兰，以后我来负责做饭，你们有什么忌口吗？'
  ];
  return openingLines;
}

async function generateOneLine() {
  if (isGenerating) return;
  isGenerating = true;
  try {
    const day = getVirtualDay();

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

    // 已入住的角色（按搬入时间排序）
    const availableRoles = roles
      .filter(r => day >= MOVE_IN_DAY[r.name])
      .sort((a, b) => MOVE_IN_DAY[a.name] - MOVE_IN_DAY[b.name]);

    if (availableRoles.length === 0) {
      isGenerating = false;
      return;
    }

    // 当天新搬入角色的自我介绍
    for (const newRole of availableRoles) {
      if (day === MOVE_IN_DAY[newRole.name]) {
        const alreadySpoke = history.some(h => h.startsWith(newRole.name + '：'));
        if (!alreadySpoke) {
          const intro = getIntroLine(newRole.name);
          history.push(`${newRole.name}：${intro}`);
          console.log(`[搬入] ${newRole.name}：${intro}`);
          const eventMsg = `第${day}天：${newRole.name} 搬入公寓。`;
          if (!storyMemory.events.includes(eventMsg)) {
            storyMemory.events.unshift(eventMsg);
            if (storyMemory.events.length > 20) storyMemory.events.pop();
          }
          if (history.length > MAX_HISTORY) history.shift();
          // 记录后继续处理下一个
        }
      }
    }

    // 活跃角色：已搬入且已说过至少一次话（或搬入时间大于1天）
    const activeRoles = roles.filter(r => {
      if (day < MOVE_IN_DAY[r.name]) return false;
      const hasSpoken = history.some(h => h.startsWith(r.name + '：'));
      if (day === MOVE_IN_DAY[r.name]) {
        return hasSpoken; // 当天搬入必须有自我介绍才活跃
      }
      return true;
    });

    if (activeRoles.length === 0) {
      isGenerating = false;
      return;
    }

    const role = activeRoles[currentIdx % activeRoles.length];
    const moveInDay = MOVE_IN_DAY[role.name] || 1;
    const intimacy = getIntimacyLevel(day, moveInDay);
    
    const context = history.slice(-6).join('\n');
    const pending = getPendingFor(role.name);
    const pendingText = pending.length > 0 ? `\n你还有一些未解决的心事：${pending.join('、')}。说话时偶尔可以自然地带出这些事。` : '';
    const eventText = Math.random() < 0.15 ? `\n最近家里发生过这些事：${getRandomEvent() || '没什么特别的'}` : '';
    
    const prompt = `今天是公寓成立第 ${day} 天。${intimacy}\n你是${role.name}。${role.persona}${pendingText}${eventText}\n对话历史：\n${context || '六人刚开始合租。'}\n轮到你说话，一句日常台词（15字内），只说台词。`;

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
        max_tokens: 40
      })
    });
    const data = await resp.json();
    let text = data.choices?.[0]?.message?.content?.trim() || '嗯…今天天气不错。';
    text = text.replace(/^["']|["']$/g, '');
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
    console.log(`[${new Date().toLocaleString()}] [第${day}天] ${fullLine}`);
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
  console.log('🗑️ 聊天记录已清空');
  res.json({ status: 'cleared' });
});

// ✅ 状态 API —— 只返回已发生的事实
app.get('/api/status', (req, res) => {
  const day = getVirtualDay();
  const vdate = getVirtualDate(day);
  const status = roles.map(role => {
    const lastLine = history.filter(h => h.startsWith(role.name + '：')).slice(-1)[0] || '还没有说过话';
    const recentEvents = storyMemory.events.slice(-5);
    const involvedInEvent = recentEvents.some(e => e.includes(role.name));
    const moveInDay = MOVE_IN_DAY[role.name] || 1;
    const daysWithRoom = day - moveInDay + 1;
    const movedIn = day >= moveInDay;
    return {
      name: role.name,
      lastLine: lastLine,                    // ✅ 已发生
      involvedInEvent: involvedInEvent,      // ✅ 已发生
      totalLines: history.filter(h => h.startsWith(role.name + '：')).length, // ✅ 已发生
      moveInDay: moveInDay,
      daysWithRoom: movedIn ? daysWithRoom : 0,
      movedIn: movedIn
      // ❌ 不再包含 pending（未解决的心事）
    };
  });
  res.json({
    currentDay: day,
    virtualDate: `${vdate.year}年${vdate.month}月${vdate.day}日 星期${vdate.week}`,
    status,
    events: storyMemory.events.slice(-5) // ✅ 已发生的事件
  });
});

// ================================================================
// 🖥️ 前端页面
// ================================================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
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
.status-btn,.clear-btn{background:#3a3a5a;border:none;color:#fff;padding:4px 12px;border-radius:16px;font-size:12px;cursor:pointer;transition:0.2s}
.status-btn{background:#3a5a7a}
。status-btn：活动，.clear-btn：活动{transform:scale(0.95)}
.clear-btn{background:#6a3a3a;color:#ff9999}
.story-box{background：#1f1f32；边框：1px实心#444466；边框半径：12px；填充：16px；高度：620px；溢出y：自动；行高：1.7}
.line{margin:14px 0;padding-left:8px;border-left:3px solid #666}
.pei{border-left-color:#ffddaa;color:#ffe8c8}
。Moji{border-left-color：#99ccff；color：#c8e0ff}
。和田{border-left-color：#ffb8cc；color：#ffd8e6}
。Yumo{border-left-color：#ff88aa；color：#ffb3b3}
.siqi{border-left-color:#ffaa66;color:#ffcc99}
.moyu{border-left-color:#aabbdd;color:#c8d8ee}
。操作{font-size:12px；颜色：#999；下边距：3px}
。空状态{color：#666；text-align:center；padding:40px0；}
.modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center}
.modal-overlay.open{显示：flex}
.modal{background：#1f1f32；border:1px solid#444466；border-roadius:16px；padding:20px；最大宽度：500px；宽度：90%；最大高度：80vh；overflow-y:auto}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.modal-header h2{color:#ffd399;font-size:18px}
。模态关闭{背景：无；边框：无；颜色：#888；字体大小：24px；光标：指针}
.role-status{background:#1a1a27;border-radius:8px;padding:10px;margin-bottom:8px;border-left:3px solid #666}
.role-status.rname{font-weight:600；font-size:14px}
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
<button class="status-btn"onclick="showStatus()">📊 状态</button>
<button class="clear-btn"onclick="clearHistory()">🗑️ 清空</button>
    </div>
    </div>
<div class="story-box"id="story"><div class="empty-state">▄连接直播中...</div></div>
    </div>
<div class="modal-overlay" id="modal">
  <div class="modal">
    <div class="modal-header">
      <h2>📊 角色状态</h2>
<button class="modal-close"onclick="closeModal()">✕</button>
    </div>
    <div id="statusContent">加载中...</div>
    </div>
    </div>
<script>
let lastLength=0;const story=document.getElementById('story');const count=document.getElementById('count');
异步函数fetchHistory(){try{const res=等待提取('/api/history')；Const data=等待res.json()；Const lines=data.history||[];count.textContent=lines.length;if(lines.length===lastLength&&lines.length>0)return;lastLength=lines.length;story.innerHTML='';if(lines.length===0){story.innerHTML='<div class="empty-state">📭 聊天记录已清空，等待新对话...</div>'；return}
行数。foreach(line=>{const colonIdx=line.indexOf("：")；if(colonIdx===-1)返回；常量名称=line.slice(0，colonIdx)；常量内容=line.slice(colonIdx+1)；常量clsMap={'裴金'：'Pei'，'墨迹淡'：'Moji'，'和田兰'：'和田‘、‘雨沫'：'Yumo'，'赵思琪'：'四七‘、‘墨羽'：'Moyu'}；const cls=clsMap[名称]||"；常数div=文档。createElement('div')；div.className='line'+cls；div.innerHTML='<div class="action">'+名称+'</div>‘+内容；故事.appendChild(div)}；故事.scrollTop=故事.scrollHeight}catch(e){控制台。错误(e)}}
异步函数clearHistory(){if(！confirm('确定要清空所有聊天记录吗？此操作不可撤销。'))return；try{constres=await fetch('/api/clear'，{method：'POST'})；if(res.OK){lastLength=0；文章。innerHTML='<div class="empty-state">🗑️ 已清空，重新生成中...</div>'；计数。textContent=“0”；setTimeout(fetchHistory，2000)}else{alert('清空失败，请重试')}}catch(e){alert('网络错误，请检查连接')}}
异步函数showStatus(){try{constres=等待提取('/api/status')；const data=await res.json()；const status=data.status||[]；const events=data.events||[]；const currentday=data.currentDay||0；const virtualDate=data.virtualDate||"；让html='<div class="time-display">🏠 公寓第'+currentday+'天('+virtualDate+')</div>'；状态。foreach(s=>{const colormap={'裴金'：'#ffddaa'，'墨迹淡'：'#99ccff'，'和田兰'：'#ffb8cc'，'雨沫'：'#ff88aa'，'赵思琪'：'#ffaa66'，'墨羽'：'#AABBDD'}；const color=colormap[s.name]|'#666'；html+='<div class="角色状态"style="border-left-color：'+color+'"><dIV class="rname"style="color：'+color+'">'+s。名称+'</div><div class="rlast">💬 's.最后一行+'</div><div class="revent">📌 参与事件：'+(s.artventedInEvent？'✅ 有'：'❌ 无')+'</div><div class="rtime">'+(s.移动？'搬入第'+s.moveinday+'天·已同住'+s.daysWithRoom+'天'：'🚪 尚未搬入')+'·发言'+s。totalLines+'次</div></div>'})；if(事件.长度>0){html+='<div style="margin-top:12px；填充：8px；背景：#1a1a27；边框半径：8px；font-size:12px；color：#aaa"><div style="color：#ffd399；font-weight:600；margin-bottom:4px">📜 近期事件</div>'+事件。map(e=>'<div>·'+e+'</div>').join(")+'</div>'}文件.通用电气tElementById('statusContent').innerHTML=html；文档。添加('open')}catch(e){alert('获取状态失败')}}
function closeModal(){document.getElementById('modal').classList.remove('open')}
setInterval(fetchHistory,2000);fetchHistory();
</script>
</body>
</html>
  `);
});

// ================================================================
// 🚀 启动服务器
// ================================================================
app.listen(process.env.PORT || 8080, () => console.log('Server running on port ' + (process.env.PORT || 8080)));
