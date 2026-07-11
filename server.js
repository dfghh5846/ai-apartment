const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('✅ AI公寓服务器运行正常！');
});

app.listen(PORT, () => {
  console.log(`✅ 服务器运行在端口 ${PORT}`);
});
