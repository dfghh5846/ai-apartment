const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// 🔑 替换成你的 DeepSeek API Key
const API_KEY = "sk-814290bb204845858ff2305a4a5a0d01";

// ===== 角色设定 =====
const roles = [
  { name: '裴金', persona: '你24岁，金发短发，圆框眼镜，说话犹豫，依赖和田兰。' },
  { name: '墨迹淡', persona: '你25岁，蓝发眼镜，家里蹲，表面冷淡内心细腻。' },
  { name: '和田兰', persona: '你29岁，亚麻色长发，表面温柔，内心占有欲强。' },
  { name: '雨沫', persona: '你19岁，白毛红瞳，古武世家传人，表面软萌。' },
  { name: '赵思琪', persona: '你17岁，黑长直，高二，嘴硬傲娇，爱吃零食。' }
];

let history = [];
let currentIdx = 0;
let isGenerating = false;

async function generateOneLine() {
  if (isGenerating) return;
  isGenerating = true;
  try {
    const role = roles[currentIdx % roles.length];
    const context = history.slice(-6).join('\n');
    const prompt = `你是${role.name}。${role.persona}\n对话历史：\n${context || '五人刚开始合租。'}\n轮到你说话，一句日常台词（15字内），只说台词。`;

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是合租室友。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.85,
        max_tokens: 40
      })
    });
    const data = await resp.json();
    let text = data.choices?.[0]?.message?.content?.trim() || '嗯…今天天气不错。';
    text = text.replace(/^["']|["']$/g, '');
    const fullLine = `${role.name}：${text}`;
    history.push(fullLine);
    if (history.length > 100) history.shift();
    currentIdx++;
    console.log(`[${new Date().toLocaleString()}] ${fullLine}`);
  } catch (e) {
    console.error('生成失败:', e);
  }
  isGenerating = false;
}

setInterval(generateOneLine, 8000);

app.get('/api/history', (req, res) => {
  res.json({ history: history.slice(-50) });
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>AI公寓直播</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui}
body{background:#1a1a27;color:#f0f0f0;padding:15px;display:flex;justify-content:center}
.wrap{max-width:650px;width:100%}
.top-bar{background:#292940;padding:12px 16px;border-radius:10px;margin-bottom:15px;display:flex;justify-content:space-between}
.scene{color:#ffd399}.clock{color:#aaccff}
.story-box{background:#1f1f32;border:1px solid #444466;border-radius:12px;padding:16px;height:620px;overflow-y:auto;line-height:1.7}
.line{margin:14px 0;padding-left:8px;border-left:3px solid #666}
.pei{border-left-color:#ffddaa;color:#ffe8c8}
.moji{border-left-color:#99ccff;color:#c8e0ff}
.hetian{border-left-color:#ffb8cc;color:#ffd8e6}
.yumo{border-left-color:#ff88aa;color:#ffb3b3}
.siqi{border-left-color:#ffaa66;color:#ffcc99}
.action{font-size:12px;color:#999;margin-bottom:3px}
.live-badge{background:#ff4444;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
</style>
</head>
<body>
<div class="wrap">
<div class="top-bar"><span class="scene">🏠 公寓·客厅</span><span class="clock"><span class="live-badge">● LIVE</span> <span id="count">0</span>句</span></div>
<div class="story-box" id="story"><div style="color:#666;text-align:center;padding:40px 0;">⏳ 连接直播中...</div></div>
</div>
<script>
let lastLength = 0;
const story = document.getElementById('story');
const count = document.getElementById('count');

async function fetchHistory() {
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    const lines = data.history || [];
    count.textContent = lines.length;
    if (lines.length === lastLength) return;
    lastLength = lines.length;
    story.innerHTML = '';
    lines.forEach(line => {
      const colonIdx = line.indexOf('：');
      if (colonIdx === -1) return;
      const name = line.slice(0, colonIdx);
      const content = line.slice(colonIdx + 1);
      const clsMap = { '裴金':'pei', '墨迹淡':'moji', '和田兰':'hetian', '雨沫':'yumo', '赵思琪':'siqi' };
      const cls = clsMap[name] || '';
      const div = document.createElement('div');
      div.className = 'line ' + cls;
      div.innerHTML = '<div class="action">' + name + '</div>' + content;
      story.appendChild(div);
    });
    story.scrollTop = story.scrollHeight;
  } catch(e) { console.error(e); }
}

setInterval(fetchHistory, 2000);
fetchHistory();
</script>
</body>
</html>
  `);
});

app.listen(process.env.PORT || 3000, () => console.log('Server running on port ' + (process.env.PORT || 3000)));
