const express = require('express');
const router = express.Router();
const client = require('../config/elasticsearch');
const SgguCoord = require('../models/SgguCoord');
const path = require('path');
const fs = require('fs');

// Elasticsearch에서 시군구 경계 데이터를 GeoJSON으로 반환하는 API
router.get('/sggu/:regionName', async (req, res) => {
    // const { regionName } = req.params;
    const regionName = "제주시"; // 강제 고정
    console.log('regionName param (강제):', regionName);
    try {
      // 1차: term 쿼리 (정확히 일치)
      let result = await client.search({
        index: 'sggu-boundaries',
        size: 1,
        query: {
          term: { "properties.SGG_NM.keyword": regionName }
        }
      });
      let hit = result.body.hits?.hits?.[0]?._source;
      if (!hit) {
        // 2차: match 쿼리 (부분 일치)
        result = await client.search({
          index: 'sggu-boundaries',
          size: 1,
          query: {
            match: { "properties.SGG_NM": regionName }
          }
        });
        hit = result.body.hits?.hits?.[0]?._source;
      }
      if (!hit) {
        // 색인된 값들 로그로 출력
        const all = await client.search({
          index: 'sggu-boundaries',
          size: 10,
          _source: ['properties.SGG_NM'],
          query: { match_all: {} }
        });
        const allNames = all.body.hits.hits.map(doc => doc._source.properties.SGG_NM);
        console.log('색인된 SGG_NM 값들:', allNames);
        return res.status(404).json({ error: '경계 데이터 없음', regionName, allNames });
      }
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
      res.status(500).json({ error: err.message });
    }
  });

  module.exports = router; 