const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 2dsphere 인덱스 생성 함수
async function createGeoIndex() {
  try {
    // MongoDB 연결 확인
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ MongoDB 연결 대기 중...');
      await new Promise(resolve => {
        mongoose.connection.once('connected', resolve);
      });
    }

    const ctpBoundaries = mongoose.connection.db.collection('sggu_boundaries_ctprvn');
    
    // 컬렉션이 비어있지 않은지 확인
    const count = await ctpBoundaries.countDocuments();
    if (count === 0) {
      console.log('ℹ️ 컬렉션이 비어있습니다. 데이터를 먼저 업로드해주세요.');
      return;
    }

    // 기존 인덱스 확인
    const indexes = await ctpBoundaries.indexes();
    const hasGeoIndex = indexes.some(index => 
      index.key && index.key.geometry === '2dsphere'
    );

    if (!hasGeoIndex) {
      console.log('🔧 2dsphere 인덱스 생성 중...');
      await ctpBoundaries.createIndex({ geometry: '2dsphere' });
      console.log('✅ 2dsphere 인덱스 생성 완료');
    } else {
      console.log('ℹ️ 2dsphere 인덱스가 이미 존재합니다.');
    }
  } catch (err) {
    console.error('❌ 인덱스 생성 중 오류:', err);
  }
}

// // MongoDB 연결 완료 후 인덱스 생성
mongoose.connection.on('connected', () => {
   console.log('🔄 MongoDB 연결됨, 인덱스 생성 시작...');
   createGeoIndex();
});

// 시도 경계 데이터 조회 API
router.get('/ctp/coordinates', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다.' });
  }

  try {
    console.log('🔍 시도 경계 조회 시작:', { lat, lng });
    
    const ctpBoundaries = mongoose.connection.db.collection('sggu_boundaries_ctprvn');
    
    // 좌표 변환 및 쿼리 최적화
    const point = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };

    // 2dsphere 인덱스를 활용한 공간 쿼리
    const result = await ctpBoundaries.findOne({
      geometry: {
        $geoIntersects: {
          $geometry: point
        }
      }
    });

    if (!result) {
      console.log('❌ 해당 좌표의 경계를 찾을 수 없음:', { lat, lng });
      return res.status(404).json({ 
        error: '해당 위치의 시도 경계를 찾을 수 없습니다.',
        coordinates: { lat, lng }
      });
    }

    console.log('✅ 경계 데이터 찾음:', {
      type: result.geometry.type,
      properties: result.properties
    });

    // 결과 반환
    res.json({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: result.geometry,
          properties: {
            CTP_KOR_NM: result.properties.CTP_KOR_NM,
            CTP_ENG_NM: result.properties.CTP_ENG_NM,
            CTP_CD: result.properties.CTPRVN_CD
          }
        }
      ]
    });
  } catch (err) {
    console.error('❌ 시도 경계 데이터 조회 중 오류:', err);
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: err.message
    });
  }
});

module.exports = router;