const express = require('express');
const router = express.Router();
const client = require('../config/elasticsearch');

// 시군구 GeoJSON 경계 조회 API
router.get('/sggu', async (req, res) => {
  const regionName = '제주시'
  console.log('요청받은 시군구 이름:', regionName);

  try {
    // 1. 정확 일치 시도
    let result = await client.search({
      index: 'sggu-boundaries',
      size: 1,
      query: {
        term: { "properties.SGG_NM.keyword": regionName }
      }
    });

    let hit = result.body.hits?.hits?.[0]?._source;

    // 2. match 쿼리로 재시도 (부분 일치)
    if (!hit) {
      result = await client.search({
        index: 'sggu-boundaries',
        size: 1,
        query: {
          match: { "properties.SGG_NM": regionName }
        }
      });
      hit = result.body.hits?.hits?.[0]?._source;
    }

    // 3. wildcard 쿼리로 재시도 (포함 여부)
    if (!hit) {
      result = await client.search({
        index: 'sggu-boundaries',
        size: 1,
        query: {
          wildcard: {
            "properties.SGG_NM.keyword": `*${regionName}*`
          }
        }
      });
      hit = result.body.hits?.hits?.[0]?._source;
    }

    // 4. 결과 없으면 색인된 전체 값 보여줌
    if (!hit) {
      const all = await client.search({
        index: 'sggu-boundaries',
        size: 100,
        _source: ['properties.SGG_NM'],
        query: { match_all: {} }
      });
      const allNames = all.body.hits.hits.map(doc => doc._source.properties.SGG_NM);
      console.log('색인된 시군구 이름 목록:', allNames);
      return res.status(404).json({ error: '해당 경계 데이터를 찾을 수 없습니다.', regionName, availableNames: allNames });
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