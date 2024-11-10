// src/index.js

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 간단한 라우트 설정
app.get('/', (req, res) => {
  res.send('안녕하세요! 서버가 정상적으로 실행되고 있습니다.');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});