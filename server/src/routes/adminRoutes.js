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
const cleanCoords = require('@turf/clean-coords').default;

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

// GeoJSON 유효성 검사
function isValidGeometry(geom) {
  if (!geom || !geom.type || !Array.isArray(geom.coordinates)) return false;
  const { type, coordinates } = geom;
  if (type !== 'Polygon' && type !== 'MultiPolygon') return false;
  if (type === 'Polygon' && coordinates.length === 0) return false;
  if (type === 'MultiPolygon' && coordinates.every(poly => poly.length === 0)) return false;
  return true;
}

// 값 범위 검사: -180<=lng<=180, -90<=lat<=90
function hasValidBounds(geometry) {
  const coords = [];
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring => coords.push(...ring));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(poly => poly.forEach(ring => coords.push(...ring)));
  }
  return coords.every(([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90);
}

// 좌표 정제 함수 개선
function cleanPolygonRings(rings) {
  return rings.map(ring => {
    // 1. 중복 좌표 제거
    const seen = new Set();
    const unique = [];
    ring.forEach(coord => {
      const key = coord.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(coord);
      }
    });

    // 2. 최소 3개 이상의 점이 있는지 확인
    if (unique.length < 3) {
      console.warn('  ⚠️ 폴리곤의 점이 3개 미만입니다');
      return ring;
    }

    // 3. 첫 점과 마지막 점이 같지 않으면 닫기
    if (unique[0][0] !== unique[unique.length - 1][0] || 
        unique[0][1] !== unique[unique.length - 1][1]) {
      unique.push([...unique[0]]);
    }

    // 4. 좌표 범위 검증
    const validCoords = unique.filter(([lng, lat]) => 
      lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
    );

    if (validCoords.length < 3) {
      console.warn('  ⚠️ 유효한 좌표가 3개 미만입니다');
      return ring;
    }

    return validCoords;
  });
}

// kinks 검사 및 폴리곤 수정 함수
async function detectKinksWithTimeout(feature, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('kinks 검사 시간 초과'));
    }, timeout);

    try {
      // 1. 먼저 kinks 검사
      const kinks = turf.kinks(feature);
      
      // 2. kinks가 있으면 수정 시도
      if (kinks && kinks.features && kinks.features.length > 0) {
        console.log(`  - kinks 발견: ${kinks.features.length}개, 수정 시도`);
        
        // 3. 폴리곤 타입에 따라 처리
        if (feature.geometry.type === 'Polygon') {
          // 3.1 단일 폴리곤 수정
          const fixed = fixPolygon(feature.geometry.coordinates[0]);
          if (fixed) {
            feature.geometry.coordinates[0] = fixed;
            console.log('  - 폴리곤 수정 완료');
          }
        } else if (feature.geometry.type === 'MultiPolygon') {
          // 3.2 멀티폴리곤 수정
          const fixedCoords = feature.geometry.coordinates.map(polygon => {
            const fixed = fixPolygon(polygon[0]);
            return fixed ? [fixed] : polygon;
          });
          feature.geometry.coordinates = fixedCoords;
          console.log('  - 멀티폴리곤 수정 완료');
        }
      }

      clearTimeout(timer);
      resolve(kinks);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

// 폴리곤 강제 변환 함수
function forceValidPolygon(coordinates) {
  try {
    // 1. 좌표 순서 강제 변경 [lat, lng] -> [lng, lat]
    let fixedCoords = coordinates.map(coord => {
      const [x, y] = coord;
      // 좌표 범위 강제 조정
      const lng = Math.max(-180, Math.min(180, Number(x)));
      const lat = Math.max(-90, Math.min(90, Number(y)));
      return [lng, lat];
    });

    // 2. 중복 좌표 제거
    const unique = [];
    const seen = new Set();
    fixedCoords.forEach(coord => {
      const key = coord.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(coord);
      }
    });
    fixedCoords = unique;

    // 3. 점이 3개 미만이면 보간법으로 추가
    if (fixedCoords.length < 3) {
      console.log('  - 점이 3개 미만, 보간법으로 추가');
      const first = fixedCoords[0];
      const last = fixedCoords[fixedCoords.length - 1];
      
      // 첫 점과 마지막 점 사이에 중간점 추가
      const midLng = (first[0] + last[0]) / 2;
      const midLat = (first[1] + last[1]) / 2;
      fixedCoords = [first, [midLng, midLat], last];
    }

    // 4. 첫 점과 마지막 점이 다르면 강제로 닫기
    if (fixedCoords[0][0] !== fixedCoords[fixedCoords.length - 1][0] || 
        fixedCoords[0][1] !== fixedCoords[fixedCoords.length - 1][1]) {
      fixedCoords.push([...fixedCoords[0]]);
    }

    // 5. self-intersection 수정
    const polygon = turf.polygon([fixedCoords]);
    if (!turf.booleanValid(polygon)) {
      console.log('  - self-intersection 발견, 수정 시도');
      
      // 5.1 단순화 시도
      const simplified = turf.simplify(polygon, { tolerance: 0.0001, highQuality: true });
      if (turf.booleanValid(simplified)) {
        console.log('  - 단순화로 수정 성공');
        return simplified.geometry.coordinates[0];
      }

      // 5.2 버퍼 처리 시도
      const buffered = turf.buffer(polygon, 0.0001);
      if (turf.booleanValid(buffered)) {
        console.log('  - 버퍼 처리로 수정 성공');
        return buffered.geometry.coordinates[0];
      }

      // 5.3 convex hull 시도
      const convex = turf.convex(polygon);
      if (turf.booleanValid(convex)) {
        console.log('  - convex hull로 수정 성공');
        return convex.geometry.coordinates[0];
      }
    }

    return fixedCoords;
  } catch (e) {
    console.warn('  ⚠️ 폴리곤 강제 변환 실패:', e.message);
    return coordinates; // 실패시 원본 반환
  }
}

// fixPolygon 함수 수정
function fixPolygon(coordinates) {
  try {
    // 강제 변환 시도
    const fixed = forceValidPolygon(coordinates);
    
    // 최종 유효성 검사
    const polygon = turf.polygon([fixed]);
    if (turf.booleanValid(polygon)) {
      console.log('  - 폴리곤 강제 변환 성공');
      return fixed;
    }

    console.warn('  ⚠️ 폴리곤 강제 변환 실패');
    return null;
  } catch (e) {
    console.warn('  ⚠️ 폴리곤 수정 중 오류:', e.message);
    return null;
  }
}

// self-intersection 처리 함수 개선
async function fixSelfIntersections(feature) {
  try {
    console.log('  - 중복 꼭지점 제거 시작');
    
    // 1) 중복 꼭지점 제거 & 고리 닫기
    if (feature.geometry.type === 'Polygon') {
      // 강제 변환 적용
      const fixedCoords = forceValidPolygon(feature.geometry.coordinates[0]);
      feature.geometry.coordinates = [fixedCoords];
      console.log('  - Polygon 강제 변환 적용 완료');
    } else if (feature.geometry.type === 'MultiPolygon') {
      // 각 폴리곤에 대해 강제 변환 적용
      const fixedCoords = feature.geometry.coordinates.map(polygon => {
        const fixed = forceValidPolygon(polygon[0]);
        return [fixed]; // 무조건 변환된 결과 사용
      });
      feature.geometry.coordinates = fixedCoords;
      console.log('  - MultiPolygon 강제 변환 적용 완료');
    }

    // 2) kinks 검사 (타임아웃 보장)
    console.log('  - kinks 검사 시작');
    try {
      const kinks = await detectKinksWithTimeout(feature, 5000);
      if (kinks && kinks.features && kinks.features.length > 0) {
        console.log(`  - kinks 발견: ${kinks.features.length}개`);
      }
    } catch (e) {
      console.warn(`  ⚠️ kinks 단계 탈출: ${e.message}`);
    }

    // 3) 최종 유효성 검사 및 수정
    let finalGeometry = feature.geometry;
    let isValid = false;

    // 3.1 단순화 시도
    try {
      const simplified = turf.simplify(turf.polygon(feature.geometry.coordinates), { 
        tolerance: 0.0001, 
        highQuality: true 
      });
      if (turf.booleanValid(simplified)) {
        console.log('  - 단순화로 수정 성공');
        finalGeometry = simplified.geometry;
        isValid = true;
      }
    } catch (e) {
      console.warn('  ⚠️ 단순화 실패:', e.message);
    }

    // 3.2 버퍼 처리 시도
    if (!isValid) {
      try {
        const buffered = turf.buffer(turf.polygon(feature.geometry.coordinates), 0.0001);
        if (turf.booleanValid(buffered)) {
          console.log('  - 버퍼 처리로 수정 성공');
          finalGeometry = buffered.geometry;
          isValid = true;
        }
      } catch (e) {
        console.warn('  ⚠️ 버퍼 처리 실패:', e.message);
      }
    }

    // 3.3 convex hull 시도
    if (!isValid) {
      try {
        const convex = turf.convex(turf.polygon(feature.geometry.coordinates));
        if (turf.booleanValid(convex)) {
          console.log('  - convex hull로 수정 성공');
          finalGeometry = convex.geometry;
          isValid = true;
        }
      } catch (e) {
        console.warn('  ⚠️ convex hull 실패:', e.message);
      }
    }

    // 3.4 좌표 정밀도 낮추기
    if (!isValid) {
      try {
        const rounded = turf.cleanCoords(turf.polygon(feature.geometry.coordinates), {
          precision: 4,
          mutate: true
        });
        if (turf.booleanValid(rounded)) {
          console.log('  - 좌표 정밀도 조정으로 수정 성공');
          finalGeometry = rounded.geometry;
          isValid = true;
        }
      } catch (e) {
        console.warn('  ⚠️ 좌표 정밀도 조정 실패:', e.message);
      }
    }

    // 3.5 더 강력한 단순화 시도
    if (!isValid) {
      try {
        const simplified = turf.simplify(turf.polygon(feature.geometry.coordinates), { 
          tolerance: 0.001, // 더 큰 허용 오차
          highQuality: true 
        });
        if (turf.booleanValid(simplified)) {
          console.log('  - 강력한 단순화로 수정 성공');
          finalGeometry = simplified.geometry;
          isValid = true;
        }
      } catch (e) {
        console.warn('  ⚠️ 강력한 단순화 실패:', e.message);
      }
    }

    // 3.6 더 큰 버퍼 처리 시도
    if (!isValid) {
      try {
        const buffered = turf.buffer(turf.polygon(feature.geometry.coordinates), 0.001);
        if (turf.booleanValid(buffered)) {
          console.log('  - 큰 버퍼 처리로 수정 성공');
          finalGeometry = buffered.geometry;
          isValid = true;
        }
      } catch (e) {
        console.warn('  ⚠️ 큰 버퍼 처리 실패:', e.message);
      }
    }

    // 3.7 마지막 시도: 더 낮은 정밀도
    if (!isValid) {
      try {
        const rounded = turf.cleanCoords(turf.polygon(feature.geometry.coordinates), {
          precision: 3, // 더 낮은 정밀도
          mutate: true
        });
        if (turf.booleanValid(rounded)) {
          console.log('  - 낮은 정밀도로 수정 성공');
          finalGeometry = rounded.geometry;
          isValid = true;
        }
      } catch (e) {
        console.warn('  ⚠️ 낮은 정밀도 조정 실패:', e.message);
      }
    }

    if (!isValid) {
      throw new Error('모든 수정 시도 실패');
    }

    console.log('  ✅ self-intersection 처리 완료');
    return finalGeometry;

  } catch (e) {
    console.error('  ❌ self-intersection 처리 중 오류:', e.message);
    throw e; // 오류를 상위로 전파
  }
}

// [lat,lng] → [lng,lat] 순서 자동 교정
function ensureLonLatOrder(geometry) {
  const swap = coord => [coord[1], coord[0]];
  let swapped = false;
  if (geometry.type === 'Polygon') {
    geometry.coordinates = geometry.coordinates.map(ring =>
      ring.map(coord => {
        if (coord[1] > 90 || coord[1] < -90) {
          swapped = true;
          return swap(coord);
        }
        return coord;
      })
    );
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates = geometry.coordinates.map(poly =>
      poly.map(ring => ring.map(coord => {
        if (coord[1] > 90 || coord[1] < -90) {
          swapped = true;
          return swap(coord);
        }
        return coord;
      }))
    );
  }
  if (swapped) console.log('⚙️ 좌표 순서 자동 교정됨 (lat/lon → lon/lat)');
  return geometry;
}

// GeoJSON 데이터 정제
async function cleanGeoJSON(feature) {
  try {
    console.log(`🔍 데이터 정제 시작: ${feature.properties.CTP_KOR_NM}`);
    
    // 1) 좌표 순서 보정
    console.log('1️⃣ 좌표 순서 보정 시작');
    let geom = ensureLonLatOrder(feature.geometry);
    console.log('1️⃣ 좌표 순서 보정 완료');
    
    // 2) 엄격 검증
    console.log('2️⃣ 엄격 검증 시작');
    if (!isValidGeometry(geom) || !hasValidBounds(geom)) {
      throw new Error('유효하지 않거나 범위 벗어난 geometry');
    }
    console.log('2️⃣ 엄격 검증 완료');

    let featureObj = { type: 'Feature', properties: feature.properties, geometry: geom };
    
    // 3) cleanCoords → NaN/중복/정밀도 보장
    console.log('3️⃣ cleanCoords 시작');
    const cleaned = cleanCoords(featureObj, { precision: 6, mutate: true });
    featureObj.geometry = cleaned.geometry;
    console.log('3️⃣ cleanCoords 완료');
    
    // 4) self intersection 처리
    console.log('4️⃣ self intersection 처리 시작');
    featureObj.geometry = await fixSelfIntersections({ type: 'Feature', geometry: featureObj.geometry });
    console.log('4️⃣ self intersection 처리 완료');
    
    // 5) 범위 재검증
    console.log('5️⃣ 범위 재검증 시작');
    if (!hasValidBounds(featureObj.geometry)) {
      throw new Error('Bounds check 실패');
    }
    console.log('5️⃣ 범위 재검증 완료');

    console.log(`✅ 데이터 정제 완료: ${feature.properties.CTP_KOR_NM}`);
    return featureObj;
  } catch (e) {
    console.error(`❌ 데이터 정제 실패 (${feature.properties.CTP_KOR_NM}):`, e.message);
    throw e;
  }
}

// MongoDB 저장용 데이터 정제
function sanitizeForMongoDB(doc) {
  try {
    // 1. 좌표값을 [경도, 위도] 순서로 정제 및 검증
    const sanitizeCoordinates = (coords) => {
      if (Array.isArray(coords)) {
        if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          // 단일 좌표인 경우 [경도, 위도] 순서 확인 및 검증
          const [x, y] = coords;
          let lng, lat;

          // 좌표 순서 판단 및 변환
          if (x >= -180 && x <= 180 && y >= -90 && y <= 90) {
            lng = x;
            lat = y;
          } else if (y >= -180 && y <= 180 && x >= -90 && x <= 90) {
            lng = y;
            lat = x;
          } else {
            throw new Error(`잘못된 좌표값: [${x}, ${y}]`);
          }

          // 최종 검증
          if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            throw new Error(`좌표 범위 초과: [${lng}, ${lat}]`);
          }

          return [lng, lat];
        }
        return coords.map(coord => {
          if (Array.isArray(coord)) {
            return sanitizeCoordinates(coord);
          }
          return Number(coord);
        });
      }
      return coords;
    };

    // 2. geometry 정제
    const sanitizedGeometry = {
      type: doc.geometry.type,
      coordinates: sanitizeCoordinates(doc.geometry.coordinates)
    };

    // 3. properties 정제
    const sanitizedProperties = {};
    Object.entries(doc.properties).forEach(([key, value]) => {
      // 문자열이 아닌 값은 문자열로 변환
      sanitizedProperties[key] = String(value);
    });

    // 4. 최종 문서 구성
    return {
      type: 'Feature',
      properties: sanitizedProperties,
      geometry: sanitizedGeometry,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  } catch (e) {
    console.error('MongoDB 데이터 정제 실패:', e.message);
    throw e;
  }
}

// GeoJSON 파일 업로드
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
    let errorCount = 0;
    let successCount = 0;

    console.log('🚀 데이터 삽입 시작');

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      if (!feature.properties || !feature.geometry || !feature.geometry.coordinates) {
        console.warn(`⚠️ 잘못된 feature 발견: ${i + 1}번째`);
        errorCount++;
        continue;
      }
      
      const { CTPRVN_CD, CTP_KOR_NM, CTP_ENG_NM } = feature.properties;
      if (!CTPRVN_CD || !CTP_KOR_NM || !CTP_ENG_NM) {
        console.warn(`⚠️ 필수 속성 누락: ${i + 1}번째`);
        errorCount++;
        continue;
      }

      try {
        // GeoJSON 데이터 정제
        const cleanedFeature = await cleanGeoJSON(feature);
        
        const doc = {
          type: 'Feature',
          properties: { CTPRVN_CD, CTP_KOR_NM, CTP_ENG_NM },
          geometry: cleanedFeature.geometry,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // MongoDB 저장용 데이터 정제 (좌표 정제 및 검증 포함)
        const sanitizedDoc = sanitizeForMongoDB(doc);
        console.log(`📝 MongoDB 정제 완료: ${CTP_KOR_NM}`);

        // MongoDB 지리공간 인덱스 요구사항에 맞게 데이터 정리
        const cleanDoc = {
          type: 'Feature',
          properties: sanitizedDoc.properties,
          geometry: sanitizedDoc.geometry,
          createdAt: sanitizedDoc.createdAt,
          updatedAt: sanitizedDoc.updatedAt
        };

        // 개별 문서 저장
        try {
          await ctpBoundaries.insertOne(cleanDoc);
          insertedCount++;
          successCount++;
          console.log(`✅ 문서 저장 완료: ${insertedCount}/${totalDocs} - ${CTP_KOR_NM}`);
        } catch (docErr) {
          console.error(`❌ 문서 저장 실패: ${CTP_KOR_NM}`, docErr);
          errorCount++;
        }
      } catch (err) {
        console.error(`❌ 문서 처리 실패: ${CTP_KOR_NM}`, err.message);
        errorCount++;
      }
    }

    fs.unlinkSync(req.file.path);
    console.log('🧹 임시 파일 삭제 완료');

    const totalCount = await ctpBoundaries.countDocuments();
    console.log('📊 최종 저장된 문서 수:', totalCount);

    res.json({ 
      message: '✅ 시도 경계 업로드 완료',
      insertedCount,
      errorCount,
      successCount,
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

// 시도(CTP) 경계 목록 조회
router.get('/bucket/ctp/files', async (req, res) => {
  try {
    const ctpBoundaries = mongoose.connection.db.collection('sggu_boundaries_ctprvn');
    const files = await ctpBoundaries.find({}).toArray();
    // 데이터가 없는 경우 빈 배열 반환
    if (!files || !Array.isArray(files)) {
      return res.status(200).json([]);
    }
    res.status(200).json(files);
  } catch (err) {
    console.error('❌ 시도 경계 목록 조회 실패:', err);
    // 에러 발생 시에도 빈 배열 반환
    res.status(200).json([]);
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

// 시군구(SIG) 경계 목록 조회
router.get('/bucket/sig/files', async (req, res) => {
  try {
    const sigBoundaries = mongoose.connection.db.collection('sggu_boundaries_sig');
    const files = await sigBoundaries.find({}).toArray();
    // 데이터가 없는 경우 빈 배열 반환
    if (!files || !Array.isArray(files)) {
      return res.status(200).json([]);
    }
    res.status(200).json(files);
  } catch (err) {
    console.error('❌ 시군구 경계 목록 조회 실패:', err);
    // 에러 발생 시에도 빈 배열 반환
    res.status(200).json([]);
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

// 읍면동(EMD) 경계 목록 조회
router.get('/bucket/emd/files', async (req, res) => {
  try {
    const emdBoundaries = mongoose.connection.db.collection('sggu_boundaries_emd');
    const files = await emdBoundaries.find({}).toArray();
    // 데이터가 없는 경우 빈 배열 반환
    if (!files || !Array.isArray(files)) {
      return res.status(200).json([]);
    }
    res.status(200).json(files);
  } catch (err) {
    console.error('❌ 읍면동 경계 목록 조회 실패:', err);
    // 에러 발생 시에도 빈 배열 반환
    res.status(200).json([]);
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

// 리(LI) 경계 목록 조회
router.get('/bucket/li/files', async (req, res) => {
  try {
    const liBoundaries = mongoose.connection.db.collection('sggu_boundaries_li');
    const files = await liBoundaries.find({}).toArray();
    // 데이터가 없는 경우 빈 배열 반환
    if (!files || !Array.isArray(files)) {
      return res.status(200).json([]);
    }
    res.status(200).json(files);
  } catch (err) {
    console.error('❌ 리 경계 목록 조회 실패:', err);
    // 에러 발생 시에도 빈 배열 반환
    res.status(200).json([]);
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