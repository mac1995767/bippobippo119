const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/mongoose');
const sequelize = require('./config/database');
const { initializeModel } = require('./ai/predict');
const sendMessage = require('./kafka/producer');
const Horoscope = require('./models/Horoscope'); // 운세 데이터를 저장할 모델
const horoscopeRoutes = require('./routes/horoscopeRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');


dotenv.config();

const app = express();

// 미들웨어 설정
app.use(express.json());

// 데이터베이스 연결
const connectDatabases = async () => {
  try {
    await connectDB();
    await sequelize.authenticate();
    console.log('MongoDB and PostgreSQL connected');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

connectDatabases();

// AI 모델 초기화
// initializeModel();

// 라우트 설정
app.get('/', (req, res) => {
  res.send('안녕하세요! 운세 웹사이트 서버가 실행 중입니다.');
});

/** 
app.use('/api', horoscopeRoutes);

// 새로운 운세 데이터를 받아 MongoDB에 저장하는 엔드포인트
app.post('/api/horoscope', async (req, res) => {
  console.log('Request received:', req.body);  // 요청 데이터 로그
  try {
    const horoscopeData = req.body;
    const newHoroscope = new Horoscope(horoscopeData);
    await newHoroscope.save();
    res.status(201).json({ message: '운세 데이터가 저장되었습니다.' });
  } catch (err) {
    console.error('Error saving horoscope data:', err);
    res.status(500).json({ message: '운세 데이터를 저장하는 중 오류가 발생했습니다.' });
  }
});
*/

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());

app.use('/api/horoscope',horoscopeRoutes);


// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});