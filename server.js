const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('✅ 服务器正常运行！端口: ' + PORT);
});

app.listen(PORT, () => {
  console.log('✅ 服务器启动，端口 ' + PORT);
});
