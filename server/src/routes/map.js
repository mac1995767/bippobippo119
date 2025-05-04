const express = require('express');
const router = express.Router();
const client = require('../config/elasticsearch');

// 기본 경로 테스트
router.get('/', (req, res) => {
  console.log('map 라우터 기본 경로 호출됨');
  res.json({ message: 'map 라우터가 정상적으로 작동합니다.' });
});

// 위치 검색 API
router.get('/search', async (req, res) => {
  console.log('검색 API 호출됨');
  const { query } = req.query;
  
  console.log('검색 요청:', query);

  if (!query) {
    return res.status(400).json({ error: '검색어가 필요합니다.' });
  }

  try {
    const esQuery = {
      index: 'map_data',
      size: 10,
      _source: ['name', 'address', 'location', 'type', 'yadmNm', 'addr'],
      body: {
        query: {
          bool: {
            should: [
              {
                match_phrase_prefix: {
                  name: {
                    query: query,
                    boost: 3
                  }
                }
              },
              {
                match_phrase_prefix: {
                  yadmNm: {
                    query: query,
                    boost: 3
                  }
                }
              },
              {
                match_phrase_prefix: {
                  address: {
                    query: query,
                    boost: 2
                  }
                }
              },
              {
                match_phrase_prefix: {
                  addr: {
                    query: query,
                    boost: 2
                  }
                }
              }
            ],
            minimum_should_match: 1
          }
        },
        sort: [
          { '_score': { 'order': 'desc' } }
        ]
      }
    };

    console.log('Elasticsearch 쿼리:', JSON.stringify(esQuery, null, 2));

    const esResp = await client.search(esQuery);
    const body = esResp.body || esResp;
    const hits = body.hits?.hits || [];

    console.log('검색 결과 수:', hits.length);

    if (hits.length === 0) {
      return res.status(404).json({ error: '검색 결과가 없습니다.' });
    }

    const results = hits.map(hit => ({
      name: hit._source.name || hit._source.yadmNm,
      address: hit._source.address || hit._source.addr,
      type: hit._source.type,
      lat: hit._source.location?.lat,
      lng: hit._source.location?.lon
    }));

    res.json(results);
  } catch (err) {
    console.error('Elasticsearch 검색 오류:', err.meta?.body || err);
    res.status(500).json({ 
      error: '검색 중 오류가 발생했습니다.',
      details: err.message || '알 수 없는 오류'
    });
  }
});

// type별 map_data 조회 API
router.get('/map-data', async (req, res) => {
  const { type, swLat, swLng, neLat, neLng, limit } = req.query;
  console.log('map-data 요청:', { type, swLat, swLng, neLat, neLng, limit });
  
  try {
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
      size: limit ? parseInt(limit) : 100, // limit 파라미터로 데이터 수 제한
      _source: [
        'type', 'name', 'address', 'yadmNm', 'addr', 'telno', 'location',
        'clCdNm', 'sidoCdNm', 'sgguCdNm', 'postNo', 'estbDd', 'hospUrl'
      ],
      body: {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }]
          }
        },
        sort: [
          { '_score': { 'order': 'desc' } } // 관련성 순으로 정렬
        ]
      }
    };

    console.log('Elasticsearch 쿼리:', JSON.stringify(esQuery, null, 2));
    
    const esResp = await client.search(esQuery);
    const body = esResp.body || esResp;
    const hits = body.hits?.hits || [];
    
    console.log('검색 결과 수:', hits.length);
    
    const results = hits.map(hit => ({
      ...hit._source,
      lat: hit._source.location?.lat,
      lng: hit._source.location?.lon
    }));

    res.json(results);
  } catch (err) {
    console.error('Elasticsearch 응답 오류:', err.meta?.body || err);
    res.status(500).json({ 
      error: 'Elasticsearch 조회 오류',
      details: err.message || '알 수 없는 오류'
    });
  }
});

module.exports = router; 