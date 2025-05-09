const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const turf = require('@turf/turf');

// 로그 출력 함수
function logInfo(message, data = null) {
  if (data) console.log(`[INFO] ${message}:`, JSON.stringify(data, null, 2));
  else console.log(`[INFO] ${message}`);
}

function logError(message, error = null) {
  if (error) console.error(`[ERROR] ${message}:`, error);
  else console.error(`[ERROR] ${message}`);
}

// 좌표 반올림
function roundCoord([lng, lat]) {
  return [
    parseFloat(lng.toFixed(6)),
    parseFloat(lat.toFixed(6))
  ];
}

// GeoJSON 유효성 검사
function isValidGeoJSON(geometry) {
  if (!geometry) return false;
  const { type, coordinates } = geometry;
  return (
    (type === 'Polygon' || type === 'MultiPolygon') &&
    Array.isArray(coordinates) && coordinates.length > 0
  );
}

// 폴리곤 링 정제: 반올림, 중복 제거, 닫힌 고리 보장
function cleanPolygonRings(rings) {
  return rings.map(ring => {
    const rounded = ring.map(roundCoord);
    const unique = [];
    const seen = new Set();
    rounded.forEach(coord => {
      const key = coord.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(coord);
      }
    });
    if (unique.length > 0) {
      const [firstLng, firstLat] = unique[0];
      const [lastLng, lastLat] = unique[unique.length - 1];
      if (firstLng !== lastLng || firstLat !== lastLat) unique.push([firstLng, firstLat]);
    }
    return unique;
  });
}

// 교차된 에지 자동 처리
function fixSelfIntersections(feature) {
  const kinks = turf.kinks(feature);
  if (kinks.features.length > 0) {
    const fc = turf.unkinkPolygon(feature);
    const multipolyCoords = fc.features.map(f => f.geometry.coordinates);
    return {
      type: 'MultiPolygon',
      coordinates: multipolyCoords
    };
  }
  return feature.geometry;
}

// 2dsphere 인덱스 생성 함수 (BulkWrite로 최적화)
async function createGeoIndex(collectionName) {
  try {
    logInfo(`${collectionName} 컬렉션 인덱스 생성 시작`);
    if (mongoose.connection.readyState !== 1) {
      logError('MongoDB 연결 실패', mongoose.connection.readyState);
      throw new Error('MongoDB 연결이 되어있지 않습니다.');
    }

    const collection = mongoose.connection.db.collection(collectionName);
    logInfo(`${collectionName} 데이터 정리 시작`);

    const cursor = collection.find().batchSize(1000);
    const ops = [];
    let totalCount = 0;
    let cleanedCount = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      totalCount++;
      const geo = doc.geometry;

      if (!isValidGeoJSON(geo)) {
        logError(`${collectionName} _id=${doc._id} 유효하지 않은 GeoJSON (스킵)`);
        continue;
      }

      try {
        let feature = { type: 'Feature', properties: {}, geometry: geo };
        const cleaned = turf.cleanCoords(feature);
        let newGeom;

        if (cleaned.geometry.type === 'Polygon') {
          const rings = cleanPolygonRings(cleaned.geometry.coordinates);
          feature.geometry = { type: 'Polygon', coordinates: rings };
          newGeom = fixSelfIntersections(feature);
        } else if (cleaned.geometry.type === 'MultiPolygon') {
          const multi = cleaned.geometry.coordinates.map(rings => cleanPolygonRings(rings));
          feature.geometry = { type: 'MultiPolygon', coordinates: multi };
          newGeom = fixSelfIntersections(feature);
        } else {
          newGeom = cleaned.geometry;
        }

        ops.push({
          updateOne: {
            filter: { _id: doc._id },
            update: {
              $set: {
                'geometry.type': newGeom.type,
                'geometry.coordinates': newGeom.coordinates
              }
            }
          }
        });
        cleanedCount++;
      } catch (e) {
        logError(`${collectionName} _id=${doc._id} 정리 중 오류(스킵)`, e.message);
      }

      if (ops.length >= 500) {
        await collection.bulkWrite(ops, { ordered: false });
        ops.length = 0;
        logInfo(`${collectionName} ${totalCount}건 처리 중, ${cleanedCount}건 업데이트 완료`);
      }
    }

    if (ops.length > 0) {
      await collection.bulkWrite(ops, { ordered: false });
    }
    logInfo(`${collectionName} 정리 완료: 총 ${totalCount}건 중 ${cleanedCount}건 업데이트`);

    const indexes = await collection.indexes();
    const hasGeoIndex = indexes.some(idx => idx.key && idx.key.geometry === '2dsphere');

    if (!hasGeoIndex) {
      logInfo(`${collectionName}에 2dsphere 인덱스 생성 중...`);
      try {
        await collection.createIndex({ geometry: '2dsphere' });
        logInfo(`${collectionName} 2dsphere 인덱스 생성 완료`);
        return { success: true, message: '2dsphere 인덱스 생성 완료', collection: collectionName };
      } catch (idxErr) {
        const msg = idxErr.message || '';
        if (msg.includes('Duplicate vertices') || msg.includes('longitude/latitude is out of bounds')) {
          logError(`${collectionName} 인덱스 생성시 경고 무시`, msg);
          return { success: true, message: `경고 무시: ${msg}`, collection: collectionName };
        }
        throw idxErr;
      }
    }

    logInfo(`${collectionName} 2dsphere 인덱스가 이미 존재합니다.`);
    return { success: true, message: '이미 존재', collection: collectionName };
  } catch (err) {
    logError(`${collectionName} 인덱스 생성 중 오류`, err.message);
    return { success: false, message: `오류: ${err.message}`, collection: collectionName, error: err.stack };
  }
}

// 모든 컬렉션 인덱스 생성
router.post('/create-indexes', async (req, res) => {
  try {
    logInfo('모든 컬렉션 인덱스 생성 시작');
    const collections = ['sggu_boundaries_ctprvn', 'sggu_boundaries_sig', 'sggu_boundaries_emd', 'sggu_boundaries_li'];
    const results = [];

    for (const name of collections) {
      logInfo(`📦 ${name} 처리 중...`);
      results.push(await createGeoIndex(name));
    }

    const allSuccess = results.every(r => r.success);
    res.json({ success: allSuccess, message: allSuccess ? '모든 인덱스 생성 완료' : '일부 실패', results });
  } catch (err) {
    logError('인덱스 생성 중 오류', err.message);
    res.status(500).json({ success: false, message: `오류 발생: ${err.message}`, error: err.stack });
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
    res.status(500).json({ success: false, message: `오류 발생: ${err.message}`, error: err.stack });
  }
});

// 인덱스 상태 확인
router.get('/index-status', async (req, res) => {
  try {
    logInfo('인덱스 상태 확인 시작');
    const collections = ['sggu_boundaries_ctprvn', 'sggu_boundaries_sig', 'sggu_boundaries_emd', 'sggu_boundaries_li'];
    const status = [];

    for (const name of collections) {
      const cols = await mongoose.connection.db.listCollections().toArray();
      const exists = cols.some(c => c.name === name);
      if (!exists) {
        status.push({ collection: name, exists: false, hasGeoIndex: false, totalIndexes: 0, error: '컬렉션 없음' });
        continue;
      }
      const coll = mongoose.connection.db.collection(name);
      const idxs = await coll.indexes();
      const hasGeoIndex = idxs.some(i => i.key && i.key.geometry === '2dsphere');
      status.push({ collection: name, exists: true, hasGeoIndex, totalIndexes: idxs.length, indexes: idxs });
    }

    res.json(status);
  } catch (err) {
    logError('인덱스 상태 확인 중 오류', err.message);
    res.status(500).json({ success: false, message: `오류: ${err.message}`, error: err.stack });
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