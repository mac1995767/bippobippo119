const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 로그 출력 함수
function logInfo(message, data = null) {
  if (data) console.log(`[INFO] ${message}:`, JSON.stringify(data, null, 2));
  else console.log(`[INFO] ${message}`);
}

function logError(message, error = null) {
  if (error) console.error(`[ERROR] ${message}:`, error);
  else console.error(`[ERROR] ${message}`);
}

// 2dsphere 인덱스 생성 함수
async function createGeoIndex(collectionName) {
  try {
    logInfo(`${collectionName} 인덱스 생성 시작`);
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB 연결이 되어있지 않습니다.');
    }

    const collection = mongoose.connection.db.collection(collectionName);
    
    // 인덱스 생성
    try {
      await collection.createIndex(
        { geometry: '2dsphere' },
        { 
          background: true,
          ignoreMalformed: true
        }
      );
      logInfo(`${collectionName} 인덱스 생성 완료`);
      return { success: true, message: '인덱스 생성 완료', collection: collectionName };
    } catch (err) {
      logError(`${collectionName} 인덱스 생성 실패`, err.message);
      throw err;
    }
  } catch (err) {
    logError(`${collectionName} 인덱스 생성 중 오류`, err.message);
    return { success: false, message: `오류: ${err.message}`, collection: collectionName };
  }
}

// 모든 컬렉션 인덱스 생성
router.post('/create-indexes', async (req, res) => {
  try {
    logInfo('모든 컬렉션 인덱스 생성 시작');
    const collections = ['sggu_boundaries_ctprvn', 'sggu_boundaries_sig', 'sggu_boundaries_emd', 'sggu_boundaries_li'];
    
    const results = await Promise.all(collections.map(name => createGeoIndex(name)));
    const allSuccess = results.every(r => r.success);
    res.json({ success: allSuccess, message: allSuccess ? '모든 인덱스 생성 완료' : '일부 실패', results });
  } catch (err) {
    logError('인덱스 생성 중 오류', err.message);
    res.status(500).json({ success: false, message: `오류 발생: ${err.message}` });
  }
});

// 특정 컬렉션 인덱스 생성
router.post('/create-index/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    logInfo(`${collection} 인덱스 생성 시작`);
    const result = await createGeoIndex(collection);
    if (result.success) res.json(result);
    else res.status(400).json(result);
  } catch (err) {
    logError(`${req.params.collection} 인덱스 생성 중 오류`, err.message);
    res.status(500).json({ success: false, message: `오류 발생: ${err.message}` });
  }
});

// 시도 경계 데이터 조회 API
router.get('/ctp/coordinates', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다.' });
  }

  try {
    logInfo('시도 경계 조회 시작', { lat, lng });
    const ctpBoundaries = mongoose.connection.db.collection('sggu_boundaries_ctprvn');
    const point = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    const result = await ctpBoundaries.findOne({ geometry: { $geoIntersects: { $geometry: point } } });

    if (!result) {
      logError('해당 좌표의 경계를 찾을 수 없음', { lat, lng });
      return res.status(404).json({ error: '해당 위치의 시도 경계를 찾을 수 없습니다.', coordinates: { lat, lng } });
    }

    logInfo('경계 데이터 찾음', { type: result.geometry.type, properties: result.properties });
    res.json({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: result.geometry, properties: {
        CTP_KOR_NM: result.properties.CTP_KOR_NM,
        CTP_ENG_NM: result.properties.CTP_ENG_NM,
        CTP_CD: result.properties.CTPRVN_CD
      }}]
    });
  } catch (err) {
    logError('시도 경계 데이터 조회 중 오류');
    res.status(500).json({ error: '서버 오류가 발생했습니다.', details: err.message });
  }
});

module.exports = router;