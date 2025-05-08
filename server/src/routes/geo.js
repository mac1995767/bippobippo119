const express = require('express');
const router = express.Router();
const client = require('../config/elasticsearch');

// 좌표 기반 시군구 GeoJSON 경계 조회 API
router.get('/sggu/coordinates', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다.' });
  }

  try {
    // 좌표 기반 검색
    const result = await client.search({
      index: 'sggu-boundaries',
      size: 1,
      query: {
        geo_shape: {
          geometry: {
            shape: {
              type: 'point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            relation: 'intersects'
          }
        }
      }
    });

    const hit = result?.hits?.hits?.[0]?._source;

    if (!hit) {
      return res.status(404).json({ 
        error: '해당 좌표의 경계 데이터를 찾을 수 없습니다.',
        coordinates: { lat, lng }
      });
    }

    // 결과 반환
    res.json({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: hit.geometry,
          properties: hit.properties
        }
      ]
    });
  } catch (err) {
    console.error('서버 에러:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;