const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('./authRoutes');      
const ServerConfig = require('../models/ServerConfig');
const SocialConfig = require('../models/SocialConfig');
const CorsConfig = require('../models/CorsConfig');
const User = require('../models/User');
const { Hospital } = require('../models/hospital');
const pool = require('../config/mysql');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const proj4 = require('proj4');
const turf = require('@turf/turf');

// 모든 관리자 라우트에 인증 및 관리자 권한 검증 미들웨어 적용
router.use(authenticateToken, isAdmin);

// 임시 파일 저장 설정
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB 제한
  }
});
// 대시보드 통계
router.get('/dashboard/stats', async (req, res) => {
  try {
    // 모델 존재 여부 확인
    if (!Hospital) {
      throw new Error('필요한 모델이 로드되지 않았습니다.');
    }

    // 병원 총 문서 수
    const totalHospitals = await Hospital.find().countDocuments();

    // 병원 유형별 분포
    const hospitalsByType = await Hospital.aggregate([
      { $group: { _id: '$clCdNm', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } }
    ]);

    // 지역별 분포
    const hospitalsByRegion = await Hospital.aggregate([
      { $group: { _id: '$sidoCdNm', count: { $sum: 1 } } },
      { $project: { region: '$_id', count: 1, _id: 0 } }
    ]);

    // 최근 업데이트된 병원
    const recentUpdates = await Hospital.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('yadmNm updatedAt');

    // 빈 필드 현황
    const emptyFields = await Hospital.aggregate([
      {
        $project: {
          name: { $ifNull: ['$yadmNm', 1] },
          address: { $ifNull: ['$addr', 1] },
          phone: { $ifNull: ['$telno', 1] },
          type: { $ifNull: ['$clCdNm', 1] },
          location: { $ifNull: ['$XPos', 1] }
        }
      },
      {
        $group: {
          _id: null,
          name: { $sum: '$name' },
          address: { $sum: '$address' },
          phone: { $sum: '$phone' },
          type: { $sum: '$type' },
          location: { $sum: '$location' }
        }
      }
    ]);

    // 데이터 품질 평가
    const dataQuality = await Hospital.aggregate([
      {
        $project: {
          complete: {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$yadmNm', null] },
                  { $ne: ['$addr', null] },
                  { $ne: ['$telno', null] },
                  { $ne: ['$clCdNm', null] },
                  { $ne: ['$XPos', null] }
                ]
              },
              then: 1,
              else: 0
            }
          },
          partial: {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$yadmNm', null] },
                  { $ne: ['$addr', null] },
                  { $or: [
                    { $ne: ['$telno', null] },
                    { $ne: ['$clCdNm', null] },
                    { $ne: ['$XPos', null] }
                  ]}
                ]
              },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          complete: { $sum: '$complete' },
          partial: { $sum: '$partial' }
        }
      }
    ]);

    // 컬렉션별 통계
    const collectionStats = {
      hospitals: {
        total: totalHospitals,
        complete: dataQuality[0]?.complete || 0,
        partial: dataQuality[0]?.partial || 0,
        incomplete: totalHospitals - (dataQuality[0]?.complete || 0) - (dataQuality[0]?.partial || 0)
      }
    };

    res.json({
      collectionStats,
      hospitalsByType: hospitalsByType.reduce((acc, curr) => {
        acc[curr.type] = curr.count;
        return acc;
      }, {}),
      hospitalsByRegion: hospitalsByRegion.reduce((acc, curr) => {
        acc[curr.region] = curr.count;
        return acc;
      }, {}),
      recentUpdates,
      emptyFields: emptyFields[0] || {}
    });
  } catch (error) {
    console.error('대시보드 통계 조회 실패:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 서버 설정 관리
router.get('/server-configs', async (req, res) => {
  try {
    const [configs] = await pool.query('SELECT * FROM hospital_server_configs');
    res.json(configs);
  } catch (error) {
    console.error('서버 설정 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.post('/server-configs', async (req, res) => {
  try {
    const { key_name, value, environment = 'development', description, is_active = 1 } = req.body;
    await pool.query(
      `INSERT INTO hospital_server_configs 
       (key_name, value, environment, description, is_active) 
       VALUES (?, ?, ?, ?, ?)`,
      [key_name, value, environment, description, is_active]
    );
    res.status(201).json({ message: '설정이 추가되었습니다.' });
  } catch (error) {
    console.error('서버 설정 추가 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.put('/server-configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { key_name, value, environment, description, is_active } = req.body;
    await pool.query(
      `UPDATE hospital_server_configs 
       SET key_name = ?, value = ?, environment = ?, 
           description = ?, is_active = ?
       WHERE id = ?`,
      [key_name, value, environment, description, is_active, id]
    );
    res.json({ message: '설정이 수정되었습니다.' });
  } catch (error) {
    console.error('서버 설정 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.delete('/server-configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM hospital_server_configs WHERE id = ?', [id]);
    res.json({ message: '설정이 삭제되었습니다.' });
  } catch (error) {
    console.error('서버 설정 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 소셜 로그인 설정 조회
router.get('/social-configs', async (req, res) => {
  try {
    const [configs] = await pool.query('SELECT * FROM hospital_social_configs');
    res.json(configs);
  } catch (error) {
    console.error('소셜 설정 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 소셜 로그인 설정 추가
router.post('/social-configs', async (req, res) => {
  try {
    const { provider, client_id, client_secret, redirect_uri, environment, is_active } = req.body;
    await pool.query(
      `INSERT INTO hospital_social_configs 
       (provider, client_id, client_secret, redirect_uri, environment, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [provider, client_id, client_secret, redirect_uri, environment, is_active]
    );
    res.status(201).json({ message: '설정이 추가되었습니다.' });
  } catch (error) {
    console.error('소셜 설정 추가 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 소셜 로그인 설정 수정
router.put('/social-configs/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { client_id, client_secret, redirect_uri, environment, is_active } = req.body;
    await pool.query(
      `UPDATE hospital_social_configs 
       SET client_id = ?, client_secret = ?, redirect_uri = ?, 
           environment = ?, is_active = ?
       WHERE provider = ?`,
      [client_id, client_secret, redirect_uri, environment, is_active, provider]
    );
    res.json({ message: '설정이 수정되었습니다.' });
  } catch (error) {
    console.error('소셜 설정 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 소셜 로그인 설정 삭제
router.delete('/social-configs/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    await pool.query('DELETE FROM hospital_social_configs WHERE provider = ?', [provider]);
    res.json({ message: '설정이 삭제되었습니다.' });
  } catch (error) {
    console.error('소셜 설정 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// CORS 설정 관리
router.get('/cors-configs', async (req, res) => {
  try {
    const configs = await CorsConfig.findAll();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: 'CORS 설정을 불러오는데 실패했습니다.' });
  }
});

router.post('/cors-configs', async (req, res) => {
  try {
    const id = await CorsConfig.create(req.body);
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ message: 'CORS 설정 생성에 실패했습니다.' });
  }
});

router.put('/cors-configs/:id', async (req, res) => {
  try {
    await CorsConfig.update(req.params.id, req.body);
    res.json({ message: 'CORS 설정이 업데이트되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: 'CORS 설정 업데이트에 실패했습니다.' });
  }
});

router.delete('/cors-configs/:id', async (req, res) => {
  try {
    await CorsConfig.delete(req.params.id);
    res.json({ message: 'CORS 설정이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: 'CORS 설정 삭제에 실패했습니다.' });
  }
});

// GeoJSON 파일 업로드
router.post('/bucket/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    // 파일 내용 확인 (GeoJSON 형식 검증)
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const geoJson = JSON.parse(fileContent);
    
    if (!geoJson.type || !geoJson.features) {
      throw new Error('유효하지 않은 GeoJSON 파일입니다');
    }

    // sggu_boundaries 컬렉션에 데이터 저장
    const sgguBoundaries = mongoose.connection.db.collection('sggu_boundaries');
    
    // 기존 데이터 삭제
    await sgguBoundaries.deleteMany({});
    
    // 새로운 데이터 삽입
    const documents = geoJson.features.map(feature => ({
      type: 'Feature',
      properties: feature.properties,
      geometry: feature.geometry,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    if (documents.length > 0) {
      await sgguBoundaries.insertMany(documents);
    }

    // 임시 파일 삭제
    fs.unlinkSync(req.file.path);

    res.json({ 
      message: '✅ 업로드 완료',
      insertedCount: documents.length
    });

  } catch (err) {
    process.stdout.write('\n'); // 에러 발생 시 줄바꿈
    console.error('\n❌ 오류 발생:');
    console.error('----------------------------------------');
    
    // 에러 메시지에서 핵심 정보만 추출
    const errorMessage = err.message.split('\n')[0]; // 첫 줄만 사용
    console.error(errorMessage);
    
    // 좌표 관련 에러인 경우 추가 정보 표시
    if (errorMessage.includes('longitude/latitude')) {
      const coords = errorMessage.match(/lng: ([\d.]+) lat: ([\d.]+)/);
      if (coords) {
        console.error(`\n잘못된 좌표값: 경도(${coords[1]}), 위도(${coords[2]})`);
        console.error('올바른 좌표 범위: 경도(-180 ~ 180), 위도(-90 ~ 90)');
      }
    }
    
    console.error('----------------------------------------');
    if (err.stack) {
      const stackLines = err.stack.split('\n');
      const relevantStack = stackLines.find(line => line.includes('adminRoutes.js'));
      if (relevantStack) {
        console.error('\n에러 위치:');
        console.error(relevantStack.trim());
      }
    }
    console.error('\n');
    res.status(500).json({ error: errorMessage });
  }
});

// 파일 목록 조회 API
router.get('/bucket/:type/files', async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10, search = '', field = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let collection;
    let searchQuery = {};
    
    // 컬렉션 선택
    switch (type) {
      case 'ctp':
        collection = mongoose.connection.db.collection('sggu_boundaries_ctprvn');
        if (search && field) {
          searchQuery[`properties.${field}`] = { $regex: search, $options: 'i' };
        }
        break;
      case 'sig':
        collection = mongoose.connection.db.collection('sggu_boundaries_sig');
        if (search && field) {
          searchQuery[`properties.${field}`] = { $regex: search, $options: 'i' };
        }
        break;
      case 'emd':
        collection = mongoose.connection.db.collection('sggu_boundaries_emd');
        if (search && field) {
          searchQuery[`properties.${field}`] = { $regex: search, $options: 'i' };
        }
        break;
      case 'li':
        collection = mongoose.connection.db.collection('sggu_boundaries_li');
        if (search && field) {
          searchQuery[`properties.${field}`] = { $regex: search, $options: 'i' };
        }
        break;
      default:
        return res.status(400).json({ error: '잘못된 경계 타입입니다' });
    }

    // 전체 문서 수 조회
    const total = await collection.countDocuments(searchQuery);
    
    // 페이지네이션된 데이터 조회
    const files = await collection
      .find(searchQuery)
      .sort({ 'properties.CTP_KOR_NM': 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    res.json({
      files,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('파일 목록 조회 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

// 파일 삭제 (sggu_boundaries 컬렉션의 데이터 삭제)
router.delete('/bucket/files/:fileId', async (req, res) => {
  try {
    const sgguBoundaries = mongoose.connection.db.collection('sggu_boundaries');
    await sgguBoundaries.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.fileId) });
    res.json({ message: '✅ 삭제 완료' });
  } catch (err) {
    console.error('❌ 삭제 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

// 시도(CTP) 경계 관리
router.post('/bucket/ctp/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const geoJson = JSON.parse(fileContent);
    
    if (!geoJson.type || !geoJson.features) {
      throw new Error('유효하지 않은 GeoJSON 파일입니다');
    }

    console.log('🔍 GeoJSON 데이터 검증 완료');
    console.log('📊 전체 features 수:', geoJson.features.length);

    // MongoDB 연결 확인
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB 연결이 되어있지 않습니다.');
    }

    const ctpBoundaries = mongoose.connection.db.collection('sggu_boundaries_ctprvn');
    console.log('🗑️ 기존 데이터 삭제 시작');
    await ctpBoundaries.deleteMany({});
    console.log('🗑️ 기존 데이터 삭제 완료');
    
    const features = geoJson.features || [];
    const totalDocs = features.length;
    let insertedCount = 0;

    // 16MB 제한을 고려한 배치 크기 계산
    const MAX_DOC_SIZE = 15 * 1024 * 1024; // 15MB (안전 마진 포함)
    const BATCH_SIZE = 10; // 기본 배치 크기
    let currentBatch = [];
    let currentBatchSize = 0;

    console.log('🚀 데이터 삽입 시작');

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      if (!feature.properties || !feature.geometry || !feature.geometry.coordinates) {
        console.warn(`⚠️ 잘못된 feature 발견: ${i + 1}번째`);
        continue;
      }
      
      const { CTPRVN_CD, CTP_KOR_NM, CTP_ENG_NM } = feature.properties;
      if (!CTPRVN_CD || !CTP_KOR_NM || !CTP_ENG_NM) {
        console.warn(`⚠️ 필수 속성 누락: ${i + 1}번째`);
        continue;
      }
      // 1) 좌표 변환(transformCoordinates) 후 geometry 추출
      let geometry = {
        type: feature.geometry.type,
        coordinates: feature.geometry.coordinates.map(polygon => 
          polygon.map(ring => 
            ring.map(coord => {
              const lon = parseFloat(coord[0]);  // x축이 경도
              const lat = parseFloat(coord[1]);  // y축이 위도
              
              if (isNaN(lon) || isNaN(lat) || 
                  lon < -180 || lon > 180 || 
                  lat < -90 || lat > 90) {
                return coord;
              }
              
              return [lon, lat];  // [경도, 위도] 순서로 저장
            })
          )
        )
      };

      // 2) turf.cleanCoords 로 중복점·불필요 점 제거
      const cleaned = turf.cleanCoords({
        type: 'Feature',
        properties: {},
        geometry
      });
      geometry = cleaned.geometry;
     
      const doc = {
        type: 'Feature',
        properties: { CTPRVN_CD, CTP_KOR_NM, CTP_ENG_NM },
        geometry,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // MongoDB 지리공간 인덱스 요구사항에 맞게 데이터 정리
      const cleanDoc = {
        type: 'Feature',
        properties: doc.properties,
        geometry: doc.geometry,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };

      const docSize = JSON.stringify(cleanDoc).length;
      console.log(`📝 문서 크기: ${docSize} bytes - ${CTP_KOR_NM}`);
      
      // 현재 배치에 추가할 수 있는지 확인
      if (currentBatchSize + docSize > MAX_DOC_SIZE || currentBatch.length >= BATCH_SIZE) {
        // 현재 배치 저장
        if (currentBatch.length > 0) {
          try {
            console.log(`💾 배치 저장 시작: ${currentBatch.length}개 문서`);
            // 개별 문서 저장으로 변경
            for (const doc of currentBatch) {
              try {
                await ctpBoundaries.insertOne(doc);
                insertedCount++;
                console.log(`✅ 문서 저장 완료: ${insertedCount}/${totalDocs} - ${doc.properties.CTP_KOR_NM}`);
              } catch (docErr) {
                console.error(`❌ 문서 저장 실패: ${doc.properties.CTP_KOR_NM}`, docErr);
              }
            }
          } catch (insertErr) {
            console.error(`❌ 배치 처리 실패:`, insertErr);
          }
        }
        // 새 배치 시작
        currentBatch = [doc];
        currentBatchSize = docSize;
      } else {
        // 현재 배치에 추가
        currentBatch.push(doc);
        currentBatchSize += docSize;
      }
    }

    // 마지막 배치 처리
    if (currentBatch.length > 0) {
      try {
        console.log(`💾 마지막 배치 저장 시작: ${currentBatch.length}개 문서`);
        // 개별 문서 저장으로 변경
        for (const doc of currentBatch) {
          try {
            await ctpBoundaries.insertOne(doc);
            insertedCount++;
            console.log(`✅ 문서 저장 완료: ${insertedCount}/${totalDocs} - ${doc.properties.CTP_KOR_NM}`);
          } catch (docErr) {
            console.error(`❌ 문서 저장 실패: ${doc.properties.CTP_KOR_NM}`, docErr);
          }
        }
      } catch (insertErr) {
        console.error(`❌ 마지막 배치 처리 실패:`, insertErr);
      }
    }

    fs.unlinkSync(req.file.path);
    console.log('🧹 임시 파일 삭제 완료');

    const totalCount = await ctpBoundaries.countDocuments();
    console.log('📊 최종 저장된 문서 수:', totalCount);

    res.json({ 
      message: '✅ 시도 경계 업로드 완료',
      insertedCount,
      totalCount
    });

  } catch (err) {
    console.error('\n❌ 오류 발생:');
    console.error('----------------------------------------');
    console.error(err.message);
    console.error('----------------------------------------');
    if (err.stack) {
      const stackLines = err.stack.split('\n');
      const relevant = stackLines.find(line => line.includes('adminRoutes.js'));
      if (relevant) {
        console.error('\n에러 위치:', relevant.trim());
      }
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/bucket/ctp/files', async (req, res) => {
  try {
    const ctpBoundaries = mongoose.connection.db.collection('sggu_boundaries_ctprvn');
    const files = await ctpBoundaries.find({}).toArray();
    res.json(files);
  } catch (err) {
    console.error('❌ 시도 경계 목록 조회 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bucket/ctp/files/:fileId', async (req, res) => {
  try {
    const ctpBoundaries = mongoose.connection.db.collection('sggu_boundaries_ctprvn');
    await ctpBoundaries.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.fileId) });
    res.json({ message: '✅ 시도 경계 삭제 완료' });
  } catch (err) {
    console.error('❌ 시도 경계 삭제 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

// 시군구(SIG) 경계 관리
router.post('/bucket/sig/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const geoJson = JSON.parse(fileContent);
    
    if (!geoJson.type || !geoJson.features) {
      throw new Error('유효하지 않은 GeoJSON 파일입니다');
    }

    const sigBoundaries = mongoose.connection.db.collection('sggu_boundaries_sig');
    await sigBoundaries.deleteMany({});
    
    const features = geoJson.features || [];
    const totalDocs = features.length;
    let insertedCount = 0;

    const MAX_DOC_SIZE = 15 * 1024 * 1024;
    const BATCH_SIZE = 10;
    let currentBatch = [];
    let currentBatchSize = 0;

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      if (!feature.properties || !feature.geometry || !feature.geometry.coordinates) {
        continue;
      }
      
      const { SIG_CD, SIG_KOR_NM, SIG_ENG_NM } = feature.properties;
      if (!SIG_CD || !SIG_KOR_NM || !SIG_ENG_NM) {
        continue;
      }

      const doc = {
        type: 'Feature',
        properties: { SIG_CD, SIG_KOR_NM, SIG_ENG_NM },
        geometry: {
          type: feature.geometry.type,
          coordinates: feature.geometry.coordinates.map(polygon => 
            polygon.map(ring => 
              ring.map(coord => {
                const lon = parseFloat(coord[0]);  // x축이 경도
                const lat = parseFloat(coord[1]);  // y축이 위도
                
                if (isNaN(lon) || isNaN(lat) || 
                    lon < -180 || lon > 180 || 
                    lat < -90 || lat > 90) {
                  return coord;
                }
                
                return [lon, lat];  // [경도, 위도] 순서로 저장
              })
            )
          )
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const cleanDoc = {
        type: 'Feature',
        properties: doc.properties,
        geometry: doc.geometry,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };

      const docSize = JSON.stringify(cleanDoc).length;
      
      if (currentBatchSize + docSize > MAX_DOC_SIZE || currentBatch.length >= BATCH_SIZE) {
        if (currentBatch.length > 0) {
          for (const doc of currentBatch) {
            try {
              await sigBoundaries.insertOne(doc);
              insertedCount++;
            } catch (docErr) {
              console.error(`문서 저장 실패: ${doc.properties.SIG_KOR_NM}`, docErr);
            }
          }
        }
        currentBatch = [doc];
        currentBatchSize = docSize;
      } else {
        currentBatch.push(doc);
        currentBatchSize += docSize;
      }
    }

    if (currentBatch.length > 0) {
      for (const doc of currentBatch) {
        try {
          await sigBoundaries.insertOne(doc);
          insertedCount++;
        } catch (docErr) {
          console.error(`문서 저장 실패: ${doc.properties.SIG_KOR_NM}`, docErr);
        }
      }
    }

    fs.unlinkSync(req.file.path);
    const totalCount = await sigBoundaries.countDocuments();

    res.json({ 
      message: '✅ 시군구 경계 업로드 완료',
      insertedCount,
      totalCount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bucket/sig/files', async (req, res) => {
  try {
    const sigBoundaries = mongoose.connection.db.collection('sggu_boundaries_sig');
    const files = await sigBoundaries.find({}).toArray();
    res.json(files);
  } catch (err) {
    console.error('❌ 시군구 경계 목록 조회 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bucket/sig/files/:fileId', async (req, res) => {
  try {
    const sigBoundaries = mongoose.connection.db.collection('sggu_boundaries_sig');
    await sigBoundaries.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.fileId) });
    res.json({ message: '✅ 시군구 경계 삭제 완료' });
  } catch (err) {
    console.error('❌ 시군구 경계 삭제 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

// 읍면동(EMD) 경계 관리
router.post('/bucket/emd/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const geoJson = JSON.parse(fileContent);
    
    if (!geoJson.type || !geoJson.features) {
      throw new Error('유효하지 않은 GeoJSON 파일입니다');
    }

    const emdBoundaries = mongoose.connection.db.collection('sggu_boundaries_emd');
    await emdBoundaries.deleteMany({});
    
    const features = geoJson.features || [];
    const totalDocs = features.length;
    let insertedCount = 0;

    const MAX_DOC_SIZE = 15 * 1024 * 1024;
    const BATCH_SIZE = 10;
    let currentBatch = [];
    let currentBatchSize = 0;

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      if (!feature.properties || !feature.geometry || !feature.geometry.coordinates) {
        continue;
      }
      
      const { EMD_CD, EMD_KOR_NM, EMD_ENG_NM } = feature.properties;
      if (!EMD_CD || !EMD_KOR_NM || !EMD_ENG_NM) {
        continue;
      }

      const doc = {
        type: 'Feature',
        properties: { EMD_CD, EMD_KOR_NM, EMD_ENG_NM },
        geometry: {
          type: feature.geometry.type,
          coordinates: feature.geometry.coordinates.map(polygon => 
            polygon.map(ring => 
              ring.map(coord => {
                const lon = parseFloat(coord[0]);  // x축이 경도
                const lat = parseFloat(coord[1]);  // y축이 위도
                
                if (isNaN(lon) || isNaN(lat) || 
                    lon < -180 || lon > 180 || 
                    lat < -90 || lat > 90) {
                  return coord;
                }
                
                return [lon, lat];  // [경도, 위도] 순서로 저장
              })
            )
          )
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const cleanDoc = {
        type: 'Feature',
        properties: doc.properties,
        geometry: doc.geometry,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };

      const docSize = JSON.stringify(cleanDoc).length;
      
      if (currentBatchSize + docSize > MAX_DOC_SIZE || currentBatch.length >= BATCH_SIZE) {
        if (currentBatch.length > 0) {
          for (const doc of currentBatch) {
            try {
              await emdBoundaries.insertOne(doc);
              insertedCount++;
            } catch (docErr) {
              console.error(`문서 저장 실패: ${doc.properties.EMD_KOR_NM}`, docErr);
            }
          }
        }
        currentBatch = [doc];
        currentBatchSize = docSize;
      } else {
        currentBatch.push(doc);
        currentBatchSize += docSize;
      }
    }

    if (currentBatch.length > 0) {
      for (const doc of currentBatch) {
        try {
          await emdBoundaries.insertOne(doc);
          insertedCount++;
        } catch (docErr) {
          console.error(`문서 저장 실패: ${doc.properties.EMD_KOR_NM}`, docErr);
        }
      }
    }

    fs.unlinkSync(req.file.path);
    const totalCount = await emdBoundaries.countDocuments();

    res.json({ 
      message: '✅ 읍면동 경계 업로드 완료',
      insertedCount,
      totalCount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bucket/emd/files', async (req, res) => {
  try {
    const emdBoundaries = mongoose.connection.db.collection('sggu_boundaries_emd');
    const files = await emdBoundaries.find({}).toArray();
    res.json(files);
  } catch (err) {
    console.error('❌ 읍면동 경계 목록 조회 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bucket/emd/files/:fileId', async (req, res) => {
  try {
    const emdBoundaries = mongoose.connection.db.collection('sggu_boundaries_emd');
    await emdBoundaries.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.fileId) });
    res.json({ message: '✅ 읍면동 경계 삭제 완료' });
  } catch (err) {
    console.error('❌ 읍면동 경계 삭제 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

// 리(LI) 경계 관리
router.post('/bucket/li/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const geoJson = JSON.parse(fileContent);
    
    if (!geoJson.type || !geoJson.features) {
      throw new Error('유효하지 않은 GeoJSON 파일입니다');
    }

    const liBoundaries = mongoose.connection.db.collection('sggu_boundaries_li');
    await liBoundaries.deleteMany({});
    
    const features = geoJson.features || [];
    const totalDocs = features.length;
    let insertedCount = 0;

    const MAX_DOC_SIZE = 15 * 1024 * 1024;
    const BATCH_SIZE = 10;
    let currentBatch = [];
    let currentBatchSize = 0;

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      if (!feature.properties || !feature.geometry || !feature.geometry.coordinates) {
        continue;
      }
      
      const { LI_CD, LI_KOR_NM, LI_ENG_NM } = feature.properties;
      if (!LI_CD || !LI_KOR_NM || !LI_ENG_NM) {
        continue;
      }

      const doc = {
        type: 'Feature',
        properties: { LI_CD, LI_KOR_NM, LI_ENG_NM },
        geometry: {
          type: feature.geometry.type,
          coordinates: feature.geometry.coordinates.map(polygon => 
            polygon.map(ring => 
              ring.map(coord => {
                const lon = parseFloat(coord[0]);  // x축이 경도
                const lat = parseFloat(coord[1]);  // y축이 위도
                
                if (isNaN(lon) || isNaN(lat) || 
                    lon < -180 || lon > 180 || 
                    lat < -90 || lat > 90) {
                  return coord;
                }
                
                return [lon, lat];  // [경도, 위도] 순서로 저장
              })
            )
          )
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const cleanDoc = {
        type: 'Feature',
        properties: doc.properties,
        geometry: doc.geometry,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };

      const docSize = JSON.stringify(cleanDoc).length;
      
      if (currentBatchSize + docSize > MAX_DOC_SIZE || currentBatch.length >= BATCH_SIZE) {
        if (currentBatch.length > 0) {
          for (const doc of currentBatch) {
            try {
              await liBoundaries.insertOne(doc);
              insertedCount++;
            } catch (docErr) {
              console.error(`문서 저장 실패: ${doc.properties.LI_KOR_NM}`, docErr);
            }
          }
        }
        currentBatch = [doc];
        currentBatchSize = docSize;
      } else {
        currentBatch.push(doc);
        currentBatchSize += docSize;
      }
    }

    if (currentBatch.length > 0) {
      for (const doc of currentBatch) {
        try {
          await liBoundaries.insertOne(doc);
          insertedCount++;
        } catch (docErr) {
          console.error(`문서 저장 실패: ${doc.properties.LI_KOR_NM}`, docErr);
        }
      }
    }

    fs.unlinkSync(req.file.path);
    const totalCount = await liBoundaries.countDocuments();

    res.json({ 
      message: '✅ 법정리 경계 업로드 완료',
      insertedCount,
      totalCount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bucket/li/files', async (req, res) => {
  try {
    const liBoundaries = mongoose.connection.db.collection('sggu_boundaries_li');
    const files = await liBoundaries.find({}).toArray();
    res.json(files);
  } catch (err) {
    console.error('❌ 리 경계 목록 조회 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bucket/li/files/:fileId', async (req, res) => {
  try {
    const liBoundaries = mongoose.connection.db.collection('sggu_boundaries_li');
    await liBoundaries.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.fileId) });
    res.json({ message: '✅ 리 경계 삭제 완료' });
  } catch (err) {
    console.error('❌ 리 경계 삭제 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 