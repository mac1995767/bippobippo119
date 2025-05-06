const express = require('express');
const router = express.Router();
const client = require('../config/elasticsearch');
const SgguCoord = require('../models/SgguCoord');

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

// 시도별 병원/약국 개수 요약 API
router.get('/summary', async (req, res) => {
  try {
    // 병원 집계
    const hospitalAgg = await client.search({
      index: 'map_data',
      size: 0,
      body: {
        query: { term: { type: 'hospital' } },
        aggs: {
          by_sido: {
            terms: { field: 'sidoCdNm.keyword', size: 30 }
          }
        }
      }
    });

    // 약국 집계
    const pharmacyAgg = await client.search({
      index: 'map_data',
      size: 0,
      body: {
        query: { term: { type: 'pharmacy' } },
        aggs: {
          by_sido: {
            terms: { field: 'sidoCdNm.keyword', size: 30 }
          }
        }
      }
    });

    // 결과 정리
    const hospitalCounts = {};
    hospitalAgg.body.aggregations.by_sido.buckets.forEach(b => {
      hospitalCounts[b.key] = b.doc_count;
    });

    const pharmacyCounts = {};
    pharmacyAgg.body.aggregations.by_sido.buckets.forEach(b => {
      pharmacyCounts[b.key] = b.doc_count;
    });

    // 합쳐서 반환
    const result = Object.keys({ ...hospitalCounts, ...pharmacyCounts }).map(sido => ({
      sido,
      hospitalCount: hospitalCounts[sido] || 0,
      pharmacyCount: pharmacyCounts[sido] || 0
    }));

    res.json(result);
  } catch (err) {
    console.error('Summary API 오류:', err);
    res.status(500).json({ error: 'Summary API 오류', details: err.message });
  }
});

// 시도별 요약 API
router.get('/sido-summary', async (req, res) => {
  try {
    const response = await client.search({
      index: 'sggu-coordinates',
      body: {
        size: 0,
        aggs: {
          sido_groups: {
            terms: {
              field: 'sidoNm',
              size: 100
            },
            aggs: {
              first_location: {
                top_hits: {
                  size: 1,
                  _source: ['YPos', 'XPos']
                }
              }
            }
          }
        }
      }
    });

    const result = response.aggregations.sido_groups.buckets.map(bucket => ({
      sidoNm: bucket.key,
      YPos: bucket.first_location.hits.hits[0]._source.YPos,
      XPos: bucket.first_location.hits.hits[0]._source.XPos
    }));

    res.json(result);
  } catch (err) {
    console.error('sido-summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 시군구 요약 API
router.get('/sggu-summary', async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng, lat, lng, zoom } = req.query;
    
    // 줌 레벨에 따른 검색 반경 설정 (km)
    let searchRadius;
    if (zoom === '11') {
      searchRadius = 10; // 10km
    } else if (zoom === '12') {
      searchRadius = 3;  // 3km
    } else if (zoom === '13') {
      searchRadius = 1;  // 1km
    } else {
      searchRadius = 0.5; // 0.5km
    }

    const query = {
      bool: {
        must: [
          {
            geo_bounding_box: {
              location: {
                top_left: { lat: parseFloat(neLat), lon: parseFloat(swLng) },
                bottom_right: { lat: parseFloat(swLat), lon: parseFloat(neLng) }
              }
            }
          }
        ]
      }
    };

    const aggs = {
      sggu: {
        terms: {
          field: 'sgguNm.keyword',
          size: 100
        },
        aggs: {
          location: {
            top_hits: {
              size: 1,
              _source: ['sidoNm', 'sgguNm', 'YPos', 'XPos']
            }
          },
          distance: {
            geo_distance: {
              field: 'location',
              origin: {
                lat: parseFloat(lat),
                lon: parseFloat(lng)
              },
              unit: 'km',
              ranges: [
                { to: searchRadius }
              ]
            }
          }
        }
      }
    };

    const result = await client.search({
      index: 'sggu-coordinates',
      body: {
        size: 0,
        query,
        aggs
      }
    });

    const summary = result.aggregations.sggu.buckets
      .filter(bucket => bucket.distance.buckets.length > 0)
      .map(bucket => ({
        sidoNm: bucket.location.hits.hits[0]._source.sidoNm,
        sgguNm: bucket.key,
        YPos: bucket.location.hits.hits[0]._source.YPos,
        XPos: bucket.location.hits.hits[0]._source.XPos,
        distance: bucket.distance.buckets[0]?.from || 0
      }))
      .sort((a, b) => a.distance - b.distance);

    res.json(summary);
  } catch (error) {
    console.error('시군구 요약 데이터 조회 오류:', error);
    res.status(500).json({ error: '시군구 요약 데이터 조회 중 오류가 발생했습니다.' });
  }
});

// 읍면동별 요약 API
router.get('/emdong-summary', async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng, lat, lng, zoom } = req.query;
    
    // 줌 레벨에 따른 검색 반경 설정 (km)
    let searchRadius;
    if (zoom === '13') {
      searchRadius = 1;  // 1km
    } else if (zoom === '14') {
      searchRadius = 0.5; // 0.5km
    } else {
      searchRadius = 0.3; // 0.3km
    }

    const query = {
      bool: {
        must: [
          {
            geo_bounding_box: {
              location: {
                top_left: { lat: parseFloat(neLat), lon: parseFloat(swLng) },
                bottom_right: { lat: parseFloat(swLat), lon: parseFloat(neLng) }
              }
            }
          },
          { term: { riNm: "-" } }
        ]
      }
    };

    const aggs = {
      emdong: {
        terms: {
          field: 'emdongNm.keyword',
          size: 100
        },
        aggs: {
          location: {
            top_hits: {
              size: 1,
              _source: ['sidoNm', 'sgguNm', 'emdongNm', 'YPos', 'XPos']
            }
          },
          distance: {
            geo_distance: {
              field: 'location',
              origin: {
                lat: parseFloat(lat),
                lon: parseFloat(lng)
              },
              unit: 'km',
              ranges: [
                { to: searchRadius }
              ]
            }
          }
        }
      }
    };

    const result = await client.search({
      index: 'sggu-coordinates',
      body: {
        size: 0,
        query,
        aggs
      }
    });

    const summary = result.aggregations.emdong.buckets
      .filter(bucket => bucket.distance.buckets.length > 0)
      .map(bucket => ({
        sidoNm: bucket.location.hits.hits[0]._source.sidoNm,
        sgguNm: bucket.location.hits.hits[0]._source.sgguNm,
        emdongNm: bucket.key,
        YPos: bucket.location.hits.hits[0]._source.YPos,
        XPos: bucket.location.hits.hits[0]._source.XPos,
        distance: bucket.distance.buckets[0]?.from || 0
      }))
      .sort((a, b) => a.distance - b.distance);

    res.json(summary);
  } catch (error) {
    console.error('읍면동 요약 데이터 조회 오류:', error);
    res.status(500).json({ error: '읍면동 요약 데이터 조회 중 오류가 발생했습니다.' });
  }
});

// 리(리)별 요약 API
router.get('/ri-summary', async (req, res) => {
  try {
    const result = await SgguCoord.aggregate([
      { $group: {
          _id: '$riNm'
      }},
      { $project: { _id: 0, riNm: '$_id' } }
    ]);
    // 단순 배열로 변환
    const riList = result.map(item => item.riNm);
    res.json(riList);
  } catch (err) {
    console.error('ri-summary error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router; 