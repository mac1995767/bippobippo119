const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');



// 시도 경계 데이터 조회 API
router.get('/ctp/coordinates', async (req, res) => {
  const { lat, lng } = req.query;
  
  console.log('받은 좌표:', { lat, lng });  // 좌표 로깅 추가

  if (!lat || !lng) {
    console.log('좌표가 없습니다');  // 좌표 누락 로깅 추가
    return res.status(400).json({ error: '좌표가 필요합니다.' });
  }

  try {
    const ctpBoundaries = mongoose.connection.db.collection('sggu_boundaries_ctprvn');
    const point = { 
      type: 'Point', 
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
    const result = await ctpBoundaries.findOne({ 
      geometry: { 
        $near: { 
          $geometry: point,
          $maxDistance: 1000  // 1km 이내의 가장 가까운 경계 찾기
        } 
      } 
    });

    if (!result) {
      logError('해당 좌표의 경계를 찾을 수 없음', { lat, lng });
      return res.status(404).json({ error: '해당 위치의 시도 경계를 찾을 수 없습니다.', coordinates: { lat, lng } });
    }

    res.json({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: result.geometry, properties: {
        CTP_KOR_NM: result.properties.CTP_KOR_NM,
        CTP_ENG_NM: result.properties.CTP_ENG_NM,
        CTP_CD: result.properties.CTPRVN_CD
      }}]
    });
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.', details: err.message });
  }
});

// 시군구 경계 데이터 조회 API
router.get('/sig/coordinates', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다.' });
  }

  try {
    const sigBoundaries = mongoose.connection.db.collection('sggu_boundaries_sig');
    const point = { 
      type: 'Point', 
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
    const result = await sigBoundaries.findOne({ 
      geometry: { 
        $near: { 
          $geometry: point,
          $maxDistance: 1000
        } 
      } 
    });

    if (!result) {
      logError('해당 좌표의 경계를 찾을 수 없음', { lat, lng });
      return res.status(404).json({ error: '해당 위치의 시군구 경계를 찾을 수 없습니다.', coordinates: { lat, lng } });
    }

    res.json({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: result.geometry, properties: {
        SIG_KOR_NM: result.properties.SIG_KOR_NM,
        SIG_ENG_NM: result.properties.SIG_ENG_NM,
        SIG_CD: result.properties.SIG_CD
      }}]
    });
  } catch (err) {
    logError('시군구 경계 데이터 조회 중 오류');
    res.status(500).json({ error: '서버 오류가 발생했습니다.', details: err.message });
  }
});

// 읍면동 경계 데이터 조회 API
router.get('/emd/coordinates', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다.' });
  }

  try {
    const emdBoundaries = mongoose.connection.db.collection('sggu_boundaries_emd');
    const point = { 
      type: 'Point', 
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
    const result = await emdBoundaries.findOne({ 
      geometry: { 
        $near: { 
          $geometry: point,
          $maxDistance: 1000
        } 
      } 
    });

    if (!result) {
      return res.status(404).json({ error: '해당 위치의 읍면동 경계를 찾을 수 없습니다.', coordinates: { lat, lng } });
    }

    res.json({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: result.geometry, properties: {
        EMD_KOR_NM: result.properties.EMD_KOR_NM,
        EMD_ENG_NM: result.properties.EMD_ENG_NM,
        EMD_CD: result.properties.EMD_CD
      }}]
    });
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.', details: err.message });
  }
});

// 리 경계 데이터 조회 API
router.get('/li/coordinates', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다.' });
  }

  try {
    const liBoundaries = mongoose.connection.db.collection('sggu_boundaries_li');
    const point = { 
      type: 'Point', 
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
    const result = await liBoundaries.findOne({ 
      geometry: { 
        $near: { 
          $geometry: point,
          $maxDistance: 1000
        } 
      } 
    });

    if (!result) {
      logError('해당 좌표의 경계를 찾을 수 없음', { lat, lng });
      return res.status(404).json({ error: '해당 위치의 리 경계를 찾을 수 없습니다.', coordinates: { lat, lng } });
    }

    res.json({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: result.geometry, properties: {
        LI_KOR_NM: result.properties.LI_KOR_NM,
        LI_ENG_NM: result.properties.LI_ENG_NM,
        LI_CD: result.properties.LI_CD
      }}]
    });
  } catch (err) {
    logError('리 경계 데이터 조회 중 오류');
    res.status(500).json({ error: '서버 오류가 발생했습니다.', details: err.message });
  }
});

module.exports = router;