const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// ================================================================
// 📖 5分钟固定剧本（约30句，10秒/句 = 300秒 = 5分钟）
// ================================================================
let scriptData = {
  currentIndex: 0,
  intervalSeconds: 10,
  lines: [
    // ===== 第1幕：搬入（6句） =====
    { speaker: '裴金', text: '那个…大家好，我叫裴金…' },
    { speaker: '墨迹淡', text: '……墨迹淡。' },
    { speaker: '和田兰', text: '我是和田兰，以后我来做饭。' },
    { speaker: '裴金', text: '我…我没有忌口。' },
    { speaker: '赵思琪', text: '我来了！赵思琪！' },
    { speaker: '雨沫', text: '我、我是雨沫…' },

    // ===== 第2幕：第一次冲突（8句） =====
    { speaker: '赵思琪', text: '裴金姐你这胸也太小了吧！' },
    { speaker: '裴金', text: '……' },
    { speaker: '雨沫', text: '你真没礼貌。' },
    { speaker: '赵思琪', text: '我开玩笑的！' },
    { speaker: '和田兰', text: '思琪，来帮我切菜。' },
    { speaker: '墨迹淡', text: '……（继续吃饭）' },
    { speaker: '墨羽', text: '……（看了一眼）' },
    { speaker: '和田兰', text: '不该你习惯的事，别习惯。' },

    // ===== 第3幕：阳台对话（6句） =====
    { speaker: '墨迹淡', text: '（在阳台站着）' },
    { speaker: '墨羽', text: '（走过去）' },
    { speaker: '墨迹淡', text: '你觉得这个家能住多久？' },
    { speaker: '墨羽', text: '不知道。' },
    { speaker: '裴金', text: '（在客厅听到）' },
    { speaker: '和田兰', text: '你在听什么？' },

    // ===== 第4幕：练剑（5句） =====
    { speaker: '雨沫', text: '（清晨在阳台练剑）' },
    { speaker: '墨迹淡', text: '……你在练什么？' },
    { speaker: '雨沫', text: '剑。' },
    { speaker: '赵思琪', text: '你手里那是什么？' },
    { speaker: '雨沫', text: '……晾衣杆。' },

    // ===== 第5幕：深夜（5句） =====
    { speaker: '裴金', text: '（深夜加班回来）' },
    { speaker: '和田兰', text: '饭在锅里。' },
    { speaker: '裴金', text: '你还没睡？' },
    { speaker: '和田兰', text: '怕你饿。' },
    { speaker: '和田兰', text: '你会一直住在这里吗？' }
  ]
};

let currentIndex = 0;
let intervalId = null;

// ================================================================
// 🔐 后台密码
// ================================================================
const ADMIN_PASSWORD = 'admin123';

// ================================================================
// 📖 API
// ================================================================
app.get('/api/script', (req, res) => {
  const lines = scriptData.lines.slice(0, currentIndex + 1);
  res.json({
    currentIndex,
    total: scriptData.lines.length,
    interval: scriptData.intervalSeconds,
    lines
  });
});

app.post('/api/admin/interval', (req, res) => {
  const { password, seconds } = req.body;
  if (password !== ADMIN_PASSWORD) return res.json({ success: false, error: '密码错误' });
  scriptData.intervalSeconds = seconds;
  if (intervalId) clearInterval(intervalId);
  startTimer();
  res.json({ success: true });
});

app.post('/api/admin/update', (req, res) => {
  const { password, lines, index } = req.body;
  if (password !== ADMIN_PASSWORD) return res.json({ success: false, error: '密码错误' });
  if (lines) scriptData.lines = lines;
  if (index !== undefined) currentIndex = index;
  res.json({ success: true });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.json({ success: false, error: '密码错误' });
  }
});

// ================================================================
// ⏱️ 自动推进
// ================================================================
function advanceScript() {
  if (currentIndex < scriptData.lines.length - 1) {
    currentIndex++;
    console.log(`📖 第 ${currentIndex + 1} 句`);
  } else {
    console.log('📖 剧本已播完，循环播放');
    // 循环播放：从头开始
    currentIndex = 0;
  }
}

function startTimer() {
  if (intervalId) clearInterval(intervalId);
  const seconds = scriptData.intervalSeconds || 10;
  intervalId = setInterval(advanceScript, seconds * 1000);
  console.log(`⏱️ 间隔: ${seconds} 秒`);
}

startTimer();

// ================================================================
// 🖥️ 前端页面
// ================================================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>🏠 公寓日记 · 直播</title>
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
.moyu{border-left-color:#aabbdd;color:#c8d8ee}
.action{font-size:12px;color:#999;margin-bottom:3px}
.empty-state{color:#666;text-align:center;padding:40px 0;}
.modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center}
.modal-overlay.open{display:flex}
.modal{background:#1f1f32;border:1px solid #444466;border-radius:16px;padding:20px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.modal-header h2{color:#ffd399;font-size:18px}
.modal-close{background:none;border:none;color:#888;font-size:24px;cursor:pointer}
input,textarea{width:100%;padding:8px;margin:6px 0;border-radius:6px;border:1px solid #444;background:#1a1a27;color:#f0f0f0}
button{background:#5a4a8a;border:none;color:#fff;padding:8px 16px;border-radius:8px;cursor:pointer}
button:active{transform:scale(0.95)}
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
  </div>
</div>
<div class="story-box" id="story"><div class="empty-state">⏳ 连接直播中...</div></div>
</div>

<!-- 菜单 -->
<div class="modal-overlay" id="menuModal">
  <div class="modal">
    <div class="modal-header">
      <h2>📋 菜单</h2>
      <button class="modal-close" onclick="closeMenu()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button onclick="openAdmin()">🔐 创作者后台</button>
    </div>
  </div>
</div>

<!-- 后台 -->
<div class="modal-overlay" id="adminModal">
  <div class="modal">
    <div class="modal-header">
      <h2>🔐 创作者后台</h2>
      <button class="modal-close" onclick="closeAdmin()">✕</button>
    </div>
    <div id="adminContent">
      <input type="password" id="adminPwd" placeholder="输入密码" />
      <button onclick="adminLogin()">登录</button>
      <div id="adminPanel" style="display:none;margin-top:12px;">
        <label>播放间隔（秒）：<input type="number" id="editInterval" value="10" /></label>
        <button onclick="updateInterval()">⏱️ 更新间隔</button>
        <hr style="margin:12px 0;border-color:#444;" />
        <p style="font-size:12px;color:#888;">剧本列表（每行一句，格式：说话人|台词）</p>
        <textarea id="editLines" rows="15"></textarea>
        <button onclick="saveScript()">💾 保存剧本</button>
        <div id="saveMsg"></div>
      </div>
    </div>
  </div>
</div>

<script>
let scriptLines = [];
let currentIndex = 0;
let totalLines = 0;
let isAdmin = false;

async function fetchScript() {
  try {
    const res = await fetch('/api/script');
    const data = await res.json();
    currentIndex = data.currentIndex || 0;
    totalLines = data.total || 0;
    scriptLines = data.lines || [];
    document.getElementById('count').textContent = scriptLines.length;
    renderStory();
  } catch(e) { console.error(e); }
}

function renderStory() {
  const story = document.getElementById('story');
  if (scriptLines.length === 0) {
    story.innerHTML = '<div class="empty-state">📭 还没有剧本</div>';
    return;
  }
  story.innerHTML = '';
  scriptLines.forEach((line, idx) => {
    const clsMap = {'裴金':'pei','墨迹淡':'moji','和田兰':'hetian','雨沫':'yumo','赵思琪':'siqi','墨羽':'moyu'};
    const cls = clsMap[line.speaker] || '';
    const div = document.createElement('div');
    div.className = 'line ' + cls;
    div.innerHTML = '<div class="action">' + line.speaker + '</div>' + line.text;
    story.appendChild(div);
  });
  story.scrollTop = story.scrollHeight;
}

function toggleMenu() {
  document.getElementById('menuModal').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('menuModal').classList.remove('open');
}

function openAdmin() {
  closeMenu();
  document.getElementById('adminModal').classList.add('open');
  document.getElementById('adminContent').innerHTML = \`
    <input type="password" id="adminPwd" placeholder="输入密码" />
    <button onclick="adminLogin()">登录</button>
    <div id="adminPanel" style="display:none;margin-top:12px;">
      <label>播放间隔（秒）：<input type="number" id="editInterval" value="10" /></label>
      <button onclick="updateInterval()">⏱️ 更新间隔</button>
      <hr style="margin:12px 0;border-color:#444;" />
      <p style="font-size:12px;color:#888;">每行一句，格式：说话人|台词</p>
      <textarea id="editLines" rows="15"></textarea>
      <button onclick="saveScript()">💾 保存剧本</button>
      <div id="saveMsg"></div>
    </div>
  \`;
}
function closeAdmin() {
  document.getElementById('adminModal').classList.remove('open');
}

async function adminLogin() {
  const pwd = document.getElementById('adminPwd').value;
  if (!pwd) return alert('请输入密码');
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();
    if (data.success) {
      isAdmin = true;
      document.getElementById('adminPanel').style.display = 'block';
      const res2 = await fetch('/api/script');
      const data2 = await res2.json();
      document.getElementById('editInterval').value = data2.interval || 10;
      const linesText = data2.lines.map(l => l.speaker + '|' + l.text).join('\n');
      document.getElementById('editLines').value = linesText;
      document.getElementById('saveMsg').textContent = '✅ 已加载';
    } else {
      alert('密码错误');
    }
  } catch(e) { alert('登录失败'); }
}

async function updateInterval() {
  if (!isAdmin) return alert('请先登录');
  const seconds = parseInt(document.getElementById('editInterval').value);
  if (seconds < 1) return alert('间隔不能小于1秒');
  try {
    const res = await fetch('/api/admin/interval', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ password: document.getElementById('adminPwd').value, seconds })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('saveMsg').textContent = '✅ 间隔已更新为 ' + seconds + ' 秒';
    } else {
      alert('更新失败：' + data.error);
    }
  } catch(e) { alert('更新失败'); }
}

async function saveScript() {
  if (!isAdmin) return alert('请先登录');
  const raw = document.getElementById('editLines').value;
  const lines = raw.split('\n').filter(l => l.trim()).map(l => {
    const parts = l.split('|');
    return { speaker: parts[0] || '未知', text: parts[1] || '' };
  });
  if (lines.length === 0) return alert('剧本不能为空');
  try {
    const res = await fetch('/api/admin/update', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ password: document.getElementById('adminPwd').value, lines })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('saveMsg').textContent = '✅ 剧本已更新！';
      fetchScript();
    } else {
      alert('保存失败：' + data.error);
    }
  } catch(e) { alert('保存失败'); }
}

fetchScript();
setInterval(fetchScript, 3000);
</script>
</body>
</html>`);
});

// ================================================================
// 🚀 启动服务器
// ================================================================
app.listen(process.env.PORT || 8080, () => console.log('✅ 服务器启动，端口 ' + (process.env.PORT || 8080)));
