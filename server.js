 = ('express');
ConstCORS = require('cors');
Const应用程序 = express();

// 允许跨域和解析 JSON
app.Use (cors());
app.Use (express.json());

// 🔑 【重要】请在这里填入你的 DeepSeek API Key
ConstAPI_KEY = "sk-814290bb204845858ff2305a4a5a0d01"; 

if (!API_KEY || API_KEY === "你的Key") {
  console.Error('❌ 错误：请在代码第9行配置真实的 DEEPSEEK_API_KEY');
  process.exit(1);
}

// ================================================================
//o ️ 时间系统配置
// ================================================================
ConstCONFIG = {
  REAL_MINUTES_PER_DAY: 12, // 现实12分钟 = 游戏1天
  START_DATE: 新的 date(2024, 0, 1), // 游戏开始时间
};

// 角色入住时间表 (游戏天数)
Constmove_IN_DAY = {
  '裴金': 1, 
  '墨迹淡': 1, 
  '和田兰': 1,
  '雨沫': 2, 
  '赵思琪': 3, 
  '墨羽': 15
};

// 工作时间表
Constwork_SCHEDULE = {
  '裴金': { opening: 9, end: 18 }, 
  '墨迹淡': null, // 自由职业
  '和田兰': { opening: 10, end: 19 }, 
  '雨沫': { opening: 8, end: 17 },
  '赵思琪': { opening: 13, end: 22 },
  '墨羽': null
};

// 全局状态
让游戏状态 = {
  currentDate: 新的 date(CONFIG.START_DATE),
  dayCount: 1,
  logs: [],
  history: [] // 存储对话历史
};

// 模拟当前时间（用于前端显示）
让lastRealTime = date.now();

// ================================================================
// 🧠   AI调用函数(DeepSeek V4Flash)
// ================================================================
异步 功能 generateAIResponse(prompt, contextHistory = []) {
  尝试 {
    Const响应 = 等候 fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': '应用程序/约翰逊,
        'Authorization': '承载器${API_KEY}'
      },
      body: json.stringify({
        model: 'deepseek-v4-flash', // 👈 指定模型
        message: [
          { role: 'system', content: '你是一个合租公寓的室友模拟器。请根据用户的输入和当前的上下文，以第一人称回复。语气要自然、生活化。如果触发了剧情，请在回复末尾加上 [剧情推进: xxx] 的标签。' },
          ...contextHistory.slice(-6), // 携带最近6条历史记录
          { role: 'user', content: prompt }
        ],
        temperature: 0.85,
        最大标记数(_T): 300 // 增加长度防止截断
      })
    });

    if (!response.ok) {
      ConsterrText = 等候 response.text();
      扔新的 Error('API错误：${响应.状态}-${errText}')；
    }

    Const数据 = 等候 response.json();
    返回 data.choices[0].message.content;

  } catch (Error) {
    console.Error("AI 生成失败:", Error);
    返回 "（系统故障：我现在脑子有点乱，请稍后再试...）";
  }
}

// ================================================================
// 🎮 核心逻辑：时间流逝与事件触发
// ================================================================
功能 checkEvents() {
  const now = new Date();
  const timeDiff = now - lastRealTime;
  
  // 计算经过了多少“游戏时间”
  // 现实 timeDiff 毫秒 -> 游戏多少毫秒
  // 比例：1天(1440分钟) / CONFIG.REAL_MINUTES_PER_DAY
  const ratio = 1440 / CONFIG.REAL_MINUTES_PER_DAY; 
  const gameMsPassed = timeDiff * ratio;

  if (gameMsPassed > 60000) { // 至少过了游戏里的1分钟才更新
      const daysPassed = Math.floor(gameMsPassed / (24 * 60 * 60 * 1000));
      
      if (daysPassed > 0) {
          gameState.dayCount += daysPassed;
          gameState.currentDate.setDate(gameState.currentDate.getDate() + daysPassed);
          
          // 记录日志
          addLog(`⏳ 时间飞逝，过去了 ${daysPassed} 天。今天是第 ${gameState.dayCount} 天。`);
          
          // 检查是否有新人入住
          checkNewRoommates();
      }
      
      lastRealTime = now; // 重置基准时间
  }
}

function checkNewRoommates() {
  for (const [name, day] of Object.entries(MOVE_IN_DAY)) {
      if (day === gameState.dayCount) {
          const msg = `🔔 【新室友入住】${name} 搬进了公寓！快去打个招呼吧。`;
          addLog(msg);
          // 自动触发一段欢迎语
          triggerAutoMessage(name, `大家好，我是${name}，很高兴认识大家。`);
      }
  }
}

function addLog(text) {
  const logEntry = {
      id: Date.now(),
      text: text,
      type: 'system',
      time: new Date().toLocaleTimeString()
  };
  gameState.logs.unshift(logEntry);
  if (gameState.logs.length > 50) gameState.logs.pop(); // 限制日志数量
}

function triggerAutoMessage(name, content) {
    // 这里可以扩展为让AI自动生成入住感言
    addLog(`${name}: ${content}`);
}

// 启动时间循环
setInterval(checkEvents, 1000); // 每秒检查一次

// ================================================================
// 📡 API 接口
// ================================================================

// 1. 获取状态
app.get('/api/status', (req, res) => {
  res.json({
      day: gameState.dayCount,
      date: gameState.currentDate.toLocaleDateString(),
      logs: gameState.logs
  });
});

// 2. 发送消息/互动
app.post('/api/chat', async (req, res) => {
  const { message, targetName } = req.body;
  
  if (!message) return res.status(400).json({ error: "消息不能为空" });

  // 构建 Prompt
  const currentTimeStr = `游戏时间：第${gameState.dayCount}天 ${gameState.currentDate.toLocaleDateString()}`;
  let prompt = `${currentTimeStr}。\n用户对你说："${message}"。\n`;
  
  if (targetName) {
      prompt += `你是${targetName}。`;
      // 检查工作状态
      const hour = gameState.currentDate.getHours(); // 简化处理，实际应更精确
      const schedule = WORK_SCHEDULE[targetName];
      if (schedule && hour >= schedule.start && hour <= schedule.end) {
          prompt += `\n注意：你现在正在工作（${schedule.start}:00-${schedule.end}:00），回复要体现出忙碌或在工作间隙回复。`;
      } else {
          prompt += `\n注意：你现在是休息时间，比较空闲。`;
      }
  } else {
      prompt += `你在公共区域自言自语或对所有人说。`;
  }

  // 调用 AI
  const aiReply = await generateAIResponse(prompt, gameState.history);
  
  // 解析剧情标签
  let plotTag = "";
  if (aiReply.includes("[剧情推进:")) {
      const match = aiReply.match(/\[剧情推进:\s*(.*?)\]/);
      if (match) {
          plotTag = match[1];
          // 从回复中移除标签，保持对话干净
          aiReply.replace(match[0], ""); 
      }
  }

  // 更新历史
  gameState.history.push({ role: 'user', content: `[对${targetName || '大家'}说] ${message}` });
  gameState.history.push({ role: 'assistant', content: `${targetName || '系统'}: ${aiReply}` });

  // 返回结果
  res.json({
      reply: aiReply,
      sender: targetName || 'System',
      plot: plotTag
  });
});

// ================================================================
// 🚀 启动服务
// ================================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ AI公寓已启动！端口: ${PORT}`);
    console.log(`⏰ 时间加速倍率: ${CONFIG.REAL_MINUTES_PER_DAY}分钟/天`);
    console.log(`🔑 使用模型: deepseek-v4-flash`);
});
