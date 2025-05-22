require('dotenv').config();  // .env.local 대신 기본 .env 파일 사용
const express = require('express');
const connectDB = require('./config/mongoose'); // MongoDB 연결
const hospitalRoutes = require('./routes/hospitalRoutes');
const hospitalSearchRouter = require('./elastic/hospitalSearch');
const hospitalSubjectRoutes = require('./routes/hospitalSubjectRoutes'); // 새로운 라우터 추가
const autoCompleteRouter = require('./elastic/autoComplete');
const chatRouter = require('./routes/chat'); // 채팅 라우터 추가
const adminRoutes = require('./routes/adminRoutes'); // adminRoutes로 이름 변경
const boardRoutes = require('./routes/boardRoutes');
const hospitalReviewRoutes = require('./routes/hospitalReviewRoutes');  // 리뷰 라우터 추가
const pharmacySearchRouter = require('./elastic/pharmacySearch');
const pharmacyAutoCompleteRouter = require('./routes/pharmacyAutoComplete');
const hospitalDetailRouter = require('./elastic/hospitalDetail');
const healthCenterRoutes = require('./routes/healthCenterRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const nursingHospitalSearchRouter = require('./elastic/nursingHospitalSearch');
const nursingHospitalAutoCompleteRouter = require('./elastic/nursingHospitalAutoComplete');
//const chatRoutes = require('./routes/chatRoutes');
const { reindex } = require('./elastic/elastics'); // reindex 불러오기
const { reindexMap } = require('./elastic/elastics'); // reindexMap 불러오기
const { reindexPharmacies } = require('./elastic/elastics'); // reindexPharmacies 불러오기
const { reindexMapCluster } = require('./elastic/elastics'); // reindexMapCluster 불러오기
const cors = require('cors');
const cookieParser = require('cookie-parser'); // cookie-parser 추가
const { router: authRouter } = require('./routes/authRoutes');
const emailRouter = require('./routes/emailRoutes');
const HospitalOrigin = require('./models/HospitalOrigin');
const hospitalOriginRoutes = require('./routes/hospitalOriginRoutes');
const path = require('path');
const mapRouter = require('./routes/map');
const mapSummaryRouter = require('./routes/map-summary');
const app = express();

connectDB();

// 1. 기본 origin 추가 함수
const addDefaultOrigins = async () => {
  try {
    const origins = await HospitalOrigin.findAll({});
    if (origins.length === 0) {
      await HospitalOrigin.create({
        origin_url: process.env.CORS_ORIGIN || 'http://localhost:3000',
        environment: process.env.ENVIRONMENT,
        is_active: true,
        description: '기본 개발 환경 origin'
      });
      console.log('기본 origin이 추가되었습니다.');
    }
  } catch (error) {
    console.error('기본 origin 추가 중 오류:', error);
  }
};

// 2. 동적 CORS 미들웨어
const dynamicCors = async (req, res, next) => {
  try {
    // 반드시 where로 감싸야 함!
    const origins = await HospitalOrigin.findAll({
      is_active: true,
      environment: process.env.ENVIRONMENT
    });
    const allowedOrigins = origins.map(origin => origin.origin_url);

    const corsOptions = {
      origin: function (origin, callback) {
        // 서버-서버, Postman 등 origin이 없을 때 허용
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('일시적으로 서비스가 지연되고 있습니다. 잠시 후에 다시 이용해주시기 바랍니다.'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-csrf-token'],
      exposedHeaders: ['Set-Cookie']
    };

    // cors 미들웨어 실행
    cors(corsOptions)(req, res, next);
  } catch (error) {
    console.error('CORS 미들웨어 오류:', error);
    next(error);
  }
};

// 3. 서버 시작 시 기본 origin 추가
addDefaultOrigins();

// 4. CORS 미들웨어를 모든 라우트보다 먼저 적용
app.use(dynamicCors);

app.use(express.json());
app.use(cookieParser()); // cookie-parser 미들웨어 추가


// API 직접 접근 방지
app.use('/api/', (req, res, next) => {
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const userAgent = req.get('User-Agent') || '';
  const acceptHeader = req.get('Accept');

  const allowedDomain = process.env.CORS_ORIGIN || 'http://localhost:3000'; // ★ 프론트 도메인

  // 조건 1: User-Agent 없거나 비정상적일 때 (봇 또는 curl/postman 등)
  if (!userAgent || userAgent.length < 10) {
    return block(res);
  }

  // 조건 2: 브라우저로 직접 주소창 입력 시 (text/html 요청)
  if (acceptHeader && acceptHeader.includes('text/html')) {
    return block(res);
  }

  // 조건 3: Referer 또는 Origin이 내 사이트가 아닐 경우 (크롤링 또는 외부 사이트 요청)
  if (!origin?.startsWith(allowedDomain) && !referer?.startsWith(allowedDomain)) {
    return block(res);
  }

  next(); // 모두 통과 시 다음 미들웨어로 이동

  function block(res) {
    return res.status(400).json({
      code: 400,
      msg: '일시적으로 서비스가 지연되고 있습니다. 잠시 후에 다시 이용해주시기 바랍니다.',
      errorDetails: null,
      responseTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  }
});
// uploads 디렉토리를 정적 파일로 서빙
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 라우트 설정
console.log('라우터 설정 시작');
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRouter);
app.use('/api/hospitals/search', hospitalSearchRouter);
app.use('/api/hospitals/detail', hospitalDetailRouter);
app.use('/api/hospitals/subjects', hospitalSubjectRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/nursing-hospitals/search', nursingHospitalSearchRouter);
app.use('/api/nursing-hospitals', hospitalReviewRoutes);
app.use('/api/nursing-hospitals/autoComplete', nursingHospitalAutoCompleteRouter);
app.use('/api/pharmacies', pharmacySearchRouter);
app.use('/api/pharmacy-autocomplete', pharmacyAutoCompleteRouter);
app.use('/api/health-centers', healthCenterRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/boards', boardRoutes);
app.use('/api/origins', hospitalOriginRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/autocomplete', autoCompleteRouter);
app.use('/api/map-summary', mapSummaryRouter);
// map 라우터 설정
console.log('map 라우터 설정');
app.use('/api/map', mapRouter);

// 라우터 디버깅 미들웨어 (보안 강화)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`요청 경로: ${req.path}`);
    console.log(`요청 메서드: ${req.method}`);
    console.log(`요청 쿼리:`, req.query);
  }
  next();
});

// 등록된 라우트 목록 출력
console.log('등록된 라우트 목록:');
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log(`- ${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
    }
});

//app.use('/api/chat', chatRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});