const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/mysql');
const User = require('../models/User');
const axios = require('axios');
const SocialConfig = require('../models/SocialConfig');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// uploads 폴더 생성 (서버 쪽)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: function (req, file, cb) {
    // 이미지 파일만 허용
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
    cb(null, true);
  }
});

// JWT 시크릿 키 설정
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// CSRF 토큰 발급 함수
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('==== [LOGIN] 로그인 시도:', username);
    
    // 사용자 정보 조회
    const [users] = await pool.query('SELECT * FROM hospital_users WHERE username = ?', [username]);
    const user = users[0];

    if (!user) {
      console.log('==== [LOGIN] 사용자를 찾을 수 없음:', username);
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('==== [LOGIN] 비밀번호 불일치:', username);
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 사용자 역할 조회
    const [roles] = await pool.query(
      `SELECT r.role_name 
       FROM hospital_roles r 
       JOIN hospital_user_roles ur ON r.id = ur.role_id 
       WHERE ur.user_id = ?`,
      [user.id]
    );

    const userRole = roles.length > 0 ? roles[0].role_name : 'user';
    console.log('==== [LOGIN] 사용자 역할:', userRole);

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: userRole
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('==== [LOGIN] 생성된 토큰:', token);

    // CSRF 토큰 생성
    const csrfToken = generateCsrfToken();

    // JWT 토큰을 HTTPOnly 쿠키로 저장
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.bippobippo119.com' : 'localhost',
      maxAge: 24 * 60 * 60 * 1000
    });
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.bippobippo119.com' : 'localhost',
      maxAge: 24 * 60 * 60 * 1000
    });

    console.log('==== [LOGIN] 쿠키 설정 완료');

    // 사용자 정보에서 비밀번호 제외
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.role = userRole;

    res.json({
      message: '로그인 성공',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('==== [LOGIN] 로그인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };
  res.clearCookie('token', cookieOpts);
  res.clearCookie('csrfToken', { ...cookieOpts, httpOnly: false });
  res.json({ message: '로그아웃 성공' });
});

// 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  console.log('==== [AUTH] 전체 쿠키:', req.cookies);
  console.log('==== [AUTH] 토큰 쿠키:', req.cookies.token);
  
  const token = req.cookies.token;

  if (!token) {
    console.log('==== [AUTH] 토큰 없음');
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('==== [AUTH] 디코딩된 토큰:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('==== [AUTH] 토큰 검증 오류:', error);
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

// 관리자 권한 체크
router.get('/check-admin', authenticateToken, (req, res) => {
  console.log('==== [CHECK-ADMIN] 요청된 사용자 정보:', req.user);
  console.log('==== [CHECK-ADMIN] 사용자 역할:', req.user.role);
  console.log('==== [CHECK-ADMIN] 토큰 정보:', req.cookies.token);
  res.json({ isAdmin: req.user.role === 'admin' });
});

// 관리자 권한 검증 미들웨어
const isAdmin = (req, res, next) => {
  console.log('==== [IS-ADMIN] 요청된 사용자 정보:', req.user);
  console.log('==== [IS-ADMIN] 사용자 역할:', req.user.role);
  if (!req.user || req.user.role !== 'admin') {
    console.log('==== [IS-ADMIN] 권한 없음 - 사용자:', req.user);
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
  }
  next();
};

// CSRF 검증 미들웨어
function verifyCsrfToken(req, res, next) {
  const csrfCookie = req.cookies.csrfToken;
  const csrfHeader = req.headers['x-csrf-token'];

  // 로그 추가
  console.log('==== [CSRF 검증] 쿠키에서 읽은 csrfToken:', csrfCookie);
  console.log('==== [CSRF 검증] 헤더에서 읽은 x-csrf-token:', csrfHeader);
  console.log('==== [CSRF 검증] 전체 쿠키:', req.cookies);
  console.log('==== [CSRF 검증] 전체 헤더:', req.headers);

  
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF 토큰이 유효하지 않습니다.' });
  }
  next();
}

// 인증 상태 확인 (CSRF 검증 추가)
router.get('/check-auth', authenticateToken, verifyCsrfToken, async (req, res) => {
  console.log('==== [CHECK-AUTH] req.headers.cookie:', req.headers.cookie);
  console.log('==== [CHECK-AUTH] req.cookies:', req.cookies);
  console.log('==== [CHECK-AUTH] req.cookies.token:', req.cookies.token);
  try {
    
    // 사용자 정보 조회 (roles 테이블과 JOIN)
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.profile_image, r.role_name as role 
       FROM hospital_users u 
       LEFT JOIN hospital_user_roles ur ON u.id = ur.user_id 
       LEFT JOIN hospital_roles r ON ur.role_id = r.id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];
    res.json({ 
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'user', // role이 없는 경우 기본값 'user' 설정
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    console.error('인증 상태 확인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 회원가입
router.post('/register', async (req, res) => {
  const { 
    username, 
    password, 
    email, 
    nickname, 
    interests,
    social_id,
    social_provider,
    is_email_verified
  } = req.body;
  
  try {
    // console.log('회원가입 요청 데이터:', {
    //   username,
    //   email,
    //   nickname,
    //   interests,
    //   social_id,
    //   social_provider,
    //   is_email_verified
    // });

    // 아이디 중복 체크
    const [existingUsers] = await pool.execute(
      'SELECT id FROM hospital_users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 사용 중인 아이디입니다.' 
      });
    }

    // 이메일 중복 체크
    const [existingEmails] = await pool.execute(
      'SELECT id FROM hospital_users WHERE email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 사용 중인 이메일입니다.' 
      });
    }

    // 닉네임 중복 체크
    const [existingNicknames] = await pool.execute(
      'SELECT id FROM hospital_users WHERE nickname = ?',
      [nickname]
    );

    if (existingNicknames.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 사용 중인 닉네임입니다.' 
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 등록
    const [result] = await pool.execute(
      `INSERT INTO hospital_users 
       (username, password, email, nickname, interests, is_email_verified, social_id, social_provider) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username, 
        hashedPassword, 
        email, 
        nickname, 
        interests, 
        is_email_verified ? 1 : 0,
        social_id,
        social_provider
      ]
    );

    // console.log('회원가입 성공:', result);

    // 기본 사용자 역할 부여
    await pool.execute(
      `INSERT INTO hospital_user_roles (user_id, role_id) 
       SELECT ?, id FROM hospital_roles WHERE role_name = 'user'`,
      [result.insertId]
    );

    res.status(201).json({ 
      success: true, 
      message: '회원가입이 완료되었습니다.' 
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 이메일 중복 확인 API
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: '이메일이 필요합니다.' });
    }

    const user = await User.findByEmail(email);
    
    return res.json({
      exists: !!user,
      message: user ? '이미 가입된 이메일입니다.' : '사용 가능한 이메일입니다.'
    });
  } catch (error) {
    console.error('이메일 중복 확인 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 네이버 로그인 시작 (state 생성 및 인증 URL 반환)
router.get('/naver/start', async (req, res) => {
  try {
    const [configs] = await pool.query(
      'SELECT client_id, redirect_uri FROM hospital_social_configs WHERE provider = ? AND is_active = 1',
      ['naver']
    );

    if (configs.length === 0) {
      return res.status(404).json({
        success: false,
        message: '네이버 로그인 설정을 찾을 수 없습니다.'
      });
    }
    const config = configs[0];

    const state = crypto.randomBytes(16).toString('hex');
    
    res.cookie('naver_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', 
      maxAge: 5 * 60 * 1000 
    });

    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${config.client_id}&redirect_uri=${encodeURIComponent(config.redirect_uri)}&state=${state}`;
    
    res.json({
      success: true,
      naverAuthUrl: naverAuthUrl
    });

  } catch (error) {
    console.error('네이버 로그인 시작 오류:', error);
    res.status(500).json({
      success: false,
      message: '네이버 로그인 시작 중 서버 오류가 발생했습니다.'
    });
  }
});

// 네이버 로그인 콜백 처리
router.post('/naver/callback', async (req, res) => {
  try {
    const { code, state: returnedState } = req.body; 
    const originalState = req.cookies.naver_oauth_state; 

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '인증 코드가 필요합니다.'
      });
    }

    if (!returnedState || !originalState || returnedState !== originalState) {
      if (originalState) {
         res.clearCookie('naver_oauth_state', { httpOnly: true, secure: false, sameSite: 'none' });
      }
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 요청입니다. (state 불일치 또는 누락)'
      });
    }

    res.clearCookie('naver_oauth_state', { httpOnly: true, secure: false, sameSite: 'none' });

    const [configs] = await pool.query(
      'SELECT * FROM hospital_social_configs WHERE provider = ? AND is_active = 1',
      ['naver']
    );

    if (configs.length === 0) {
      return res.status(404).json({
        success: false,
        message: '네이버 로그인 설정을 찾을 수 없습니다.'
      });
    }

    const config = configs[0];
    const clientSecret = config.client_secret.trim();

    const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: config.client_id,
        client_secret: clientSecret,
        code: code,
        redirect_uri: config.redirect_uri
      }
    });
    
    const { access_token } = tokenResponse.data;

    if (!access_token) { 
        return res.status(400).json({
            success: false,
            message: tokenResponse.data.error_description || '네이버 액세스 토큰을 발급받지 못했습니다.'
        });
    }
    
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const naverUser = userResponse.data.response;

    const naverId = naverUser.id;
    const email = naverUser.email;
    const nickname = naverUser.name || `네이버사용자${naverId.slice(-4)}`;
    const profileImage = naverUser.profile_image;

    const [existingUserRows] = await pool.query(
      'SELECT * FROM hospital_users WHERE social_id = ? AND social_provider = ? OR email = ?',
      [naverId, 'naver', email]
    );

    if (existingUserRows.length > 0) {
      const user = existingUserRows[0];
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.bippobippo119.com' : 'localhost',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        isNewUser: false,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          role: user.role || 'user',
          profile_image: user.profile_image
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        isNewUser: true,
        email: email,
        nickname: nickname,
        profile_image: profileImage,
        social_id: naverId,
        provider: 'naver'
      });
    }
  } catch (error) {
    console.error('네이버 로그인 처리 오류:', error.response?.data || error.message || error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.response?.data?.error_description || error.message
    });
  }
});

// 카카오 로그인 콜백 처리
router.post('/kakao/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '인증 코드가 필요합니다.'
      });
    }

    const [configs] = await pool.query(
      'SELECT * FROM hospital_social_configs WHERE provider = ? AND is_active = 1',
      ['kakao']
    );

    if (configs.length === 0) {
      return res.status(404).json({
        success: false,
        message: '카카오 로그인 설정을 찾을 수 없습니다.'
      });
    }

    const config = configs[0];

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', config.client_id);
    params.append('code', code);
    params.append('redirect_uri', config.redirect_uri);

    try {
      const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token } = tokenResponse.data;

      const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const kakaoUser = userResponse.data;
      const kakaoId = kakaoUser.id.toString();
      const email = kakaoUser.kakao_account.email;
      const nickname = kakaoUser.properties.nickname;
      const profileImage = kakaoUser.properties.profile_image;

      const [existingUser] = await pool.query(
        'SELECT * FROM hospital_users WHERE social_id = ? AND social_provider = ? OR email = ?',
        [kakaoId, 'kakao', email]
      );

      if (existingUser.length > 0) {
        const user = existingUser[0];
        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'none',
          maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
          success: true,
          isNewUser: false,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            nickname: user.nickname,
            role: user.role
          }
        });
      } else {
        return res.status(200).json({
          success: true,
          isNewUser: true,
          email: email,
          nickname: nickname,
          profile_image: profileImage,
          social_id: kakaoId,
          provider: 'kakao'
        });
      }
    } catch (error) {
      console.error('카카오 API 호출 오류:', error.response?.data || error.message);
      
      if (error.response?.data?.error === 'invalid_request' && 
          error.response?.data?.error_code === 'KOE237') {
        return res.status(429).json({
          success: false,
          message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          error: error.response.data
        });
      }

      if (error.response?.data?.error === 'invalid_grant') {
        return res.status(400).json({
          success: false,
          message: '인증 코드가 만료되었습니다. 다시 로그인해주세요.',
          error: error.response.data
        });
      }

      return res.status(400).json({
        success: false,
        message: '카카오 API 호출 중 오류가 발생했습니다.',
        error: error.response?.data || error.message
      });
    }
  } catch (error) {
    console.error('카카오 로그인 처리 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 구글 로그인 콜백 처리
router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '인증 코드가 필요합니다.'
      });
    }

    const [configs] = await pool.query(
      'SELECT * FROM hospital_social_configs WHERE provider = ? AND is_active = 1',
      ['google']
    );

    if (configs.length === 0) {
      return res.status(404).json({
        success: false,
        message: '구글 로그인 설정을 찾을 수 없습니다.'
      });
    }

    const config = configs[0];

    const clientSecret = config.client_secret.trim();

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.client_id,
      client_secret: clientSecret,
      redirect_uri: config.redirect_uri,
      grant_type: 'authorization_code'
    });

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const googleUser = userResponse.data;

    const googleId = googleUser.id;
    const email = googleUser.email;
    const nickname = googleUser.name;
    const profileImage = googleUser.picture;

    const [existingUser] = await pool.query(
      'SELECT * FROM hospital_users WHERE social_id = ? AND social_provider = ? OR email = ?',
      [googleId, 'google', email]
    );

    if (existingUser.length > 0) {
      const user = existingUser[0];
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        isNewUser: false,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          role: user.role
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        isNewUser: true,
        email: email,
        nickname: nickname,
        profile_image: profileImage,
        social_id: googleId,
        provider: 'google',
        name: googleUser.name,
        given_name: googleUser.given_name
      });
    }
  } catch (error) {
    console.error('구글 로그인 처리 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 소셜 로그인 설정 조회
router.get('/social-config/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const [rows] = await pool.query(
      'SELECT client_id, redirect_uri FROM hospital_social_configs WHERE provider = ? AND is_active = 1',
      [provider]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '설정을 찾을 수 없거나 비활성화되어 있습니다.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('소셜 설정 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 네이버 로그인 설정 조회
router.get('/social-config/naver', async (req, res) => {
  try {
    const [configs] = await pool.query(
      'SELECT client_id, client_secret, redirect_uri FROM hospital_social_configs WHERE provider = ? AND is_active = 1',
      ['naver']
    );

    if (configs.length === 0) {
      return res.status(404).json({ message: '네이버 로그인 설정을 찾을 수 없습니다.' });
    }

    const config = configs[0];
    res.json({
      client_id: config.client_id,
      client_secret: config.client_secret,
      redirect_uri: config.redirect_uri
    });
  } catch (error) {
    console.error('네이버 설정 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 사용자 프로필 조회
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, nickname, interests, profile_image FROM hospital_users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 프로필 업데이트
router.put('/users/:id', authenticateToken, upload.single('profile_image'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { nickname, interests, current_password, new_password } = req.body;

    // 현재 사용자 확인
    if (req.user.id !== userId) {
      return res.status(403).json({ message: '자신의 프로필만 수정할 수 있습니다.' });
    }

    // 비밀번호 변경이 있는 경우
    if (new_password) {
      // 현재 비밀번호 확인
      const [users] = await pool.query(
        'SELECT password FROM hospital_users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }

      const isValid = await bcrypt.compare(current_password, users[0].password);
      if (!isValid) {
        return res.status(400).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
      }

      // 새 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await pool.query(
        'UPDATE hospital_users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );
    }

    // 프로필 이미지 업데이트
    let profileImagePath = null;
    if (req.file) {
      // 기존 프로필 이미지 조회
      const [users] = await pool.query(
        'SELECT profile_image FROM hospital_users WHERE id = ?',
        [userId]
      );

      if (users.length > 0 && users[0].profile_image) {
        // 기존 이미지 파일 삭제
        const oldImagePath = path.join(__dirname, '../../client/public', users[0].profile_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // 새 이미지 저장
      profileImagePath = `/uploads/${req.file.filename}`;
    }

    // 프로필 정보 업데이트
    const updateFields = [];
    const updateValues = [];

    if (nickname) {
      updateFields.push('nickname = ?');
      updateValues.push(nickname);
    }

    if (interests) {
      updateFields.push('interests = ?');
      updateValues.push(interests);
    }

    if (profileImagePath) {
      updateFields.push('profile_image = ?');
      updateValues.push(profileImagePath);
    }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      await pool.query(
        `UPDATE hospital_users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    res.json({ message: '프로필이 성공적으로 업데이트되었습니다.' });
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = {
  router,
  authenticateToken,
  isAdmin
}; 