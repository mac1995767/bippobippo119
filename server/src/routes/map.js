const express = require('express');
const router = express.Router();
const client = require('../config/elasticsearch');

// type별 map_data 조회 API
router.get('/map-data', async (req, res) => {
  const { type, swLat, swLng, neLat, neLng } = req.query; // 예: hospital, pharmacy, facility
  try {
    // type, bounds 조건 쿼리 생성
    let must = [];
    if (type) {
      must.push({ term: { type } });
    }
    if (swLat && swLng && neLat && neLng) {
      must.push({
        geo_bounding_box: {
          'location': {
            top_left: { lat: neLat, lon: swLng },
            bottom_right: { lat: swLat, lon: neLng }
          }
        }
      });
    }
    const esQuery = {
      index: 'map_data',
      size: 10000, // 필요에 따라 조정
      _source: [
        'type', 'name', 'address', 'yadmNm', 'addr', 'telno', 'location',
        'clCdNm', 'sidoCdNm', 'sgguCdNm', 'postNo', 'estbDd', 'hospUrl'
      ],
      body: {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }]
          }
        }
      }
    };
    const esResp = await client.search(esQuery);
    const body = esResp.body || esResp;
    const hits = body.hits?.hits || [];
    res.json(hits.map(hit => hit._source));
  } catch (err) {
    console.error('Elasticsearch 응답:', err.meta?.body || err);
    res.status(500).json({ error: 'Elasticsearch 조회 오류' });
  }
});

module.exports = router; 