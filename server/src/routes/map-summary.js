const express = require('express');
const router = express.Router();
const client = require('../config/elasticsearch');
const mongoose = require('mongoose');


// 시군구별 병원/약국 요약
router.get('/sggu', async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng } = req.query;
    const swLatNum = parseFloat(swLat);
    const swLngNum = parseFloat(swLng);
    const neLatNum = parseFloat(neLat);
    const neLngNum = parseFloat(neLng);

    // 시군구 정보 집계
    const coordResult = await client.search({
      index: 'sggu-coordinates',
      size: 0,
      query: {
        geo_bounding_box: {
          location: {
            top_left: {
              lat: Math.max(swLatNum, neLatNum),
              lon: Math.min(swLngNum, neLngNum)
            },
            bottom_right: {
              lat: Math.min(swLatNum, neLatNum),
              lon: Math.max(swLngNum, neLngNum)
            }
          }
        }
      },
      aggs: {
        sggu: {
          terms: { field: 'sgguNm', size: 100 },
          aggs: {
            location: {
              top_hits: {
                size: 1,
                _source: ['sidoNm', 'sgguNm', 'YPos', 'XPos', 'location']
              }
            }
          }
        }
      }
    });

    // 병원 집계
    const hospitalResult = await client.search({
      index: 'map_data',
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { type: 'hospital' } },
            {
              geo_bounding_box: {
                location: {
                  top_left: {
                    lat: Math.max(swLatNum, neLatNum),
                    lon: Math.min(swLngNum, neLngNum)
                  },
                  bottom_right: {
                    lat: Math.min(swLatNum, neLatNum),
                    lon: Math.max(swLngNum, neLngNum)
                  }
                }
              }
            }
          ]
        }
      },
      aggs: {
        sggu: {
          terms: { field: 'sgguCdNm.keyword', size: 100 }
        }
      }
    });

    // 약국 집계
    const pharmacyResult = await client.search({
      index: 'map_data',
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { type: 'pharmacy' } },
            {
              geo_bounding_box: {
                location: {
                  top_left: {
                    lat: Math.max(swLatNum, neLatNum),
                    lon: Math.min(swLngNum, neLngNum)
                  },
                  bottom_right: {
                    lat: Math.min(swLatNum, neLatNum),
                    lon: Math.max(swLngNum, neLngNum)
                  }
                }
              }
            }
          ]
        }
      },
      aggs: {
        sggu: {
          terms: { field: 'sgguCdNm.keyword', size: 100 }
        }
      }
    });

    // 집계 결과 매핑
    const hospitalMap = {};
    hospitalResult.aggregations.sggu.buckets.forEach(bucket => {
      hospitalMap[bucket.key] = bucket.doc_count;
    });
    const pharmacyMap = {};
    pharmacyResult.aggregations.sggu.buckets.forEach(bucket => {
      pharmacyMap[bucket.key] = bucket.doc_count;
    });

    // 시군구 정보 + 병원/약국 수 결합
    const summary = coordResult.aggregations.sggu.buckets.map(bucket => {
      const doc = bucket.location.hits.hits[0]._source;
      const sgguNm = bucket.key;
      return {
        sidoNm: doc.sidoNm,
        sgguNm: sgguNm,
        YPos: doc.YPos,
        XPos: doc.XPos,
        hospitalCount: hospitalMap[sgguNm] || 0,
        pharmacyCount: pharmacyMap[sgguNm] || 0
      };
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'sggu-summary 집계 오류', details: error.message });
  }
});

// 통합된 지역 요약 데이터 처리 함수
const processAreaSummary = async (req, res, collectionName) => {
  try {
    const { swLat, swLng, neLat, neLng } = req.query;
    
    console.log('요청된 좌표 범위:', { swLat, swLng, neLat, neLng });
    console.log('조회할 컬렉션:', collectionName);
    
    // MongoDB에서 해당 영역의 경계 데이터 조회
    const boundaries = await mongoose.connection.collection(collectionName).find({
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: 'Polygon',
            coordinates: [[
              [parseFloat(swLng), parseFloat(swLat)],
              [parseFloat(neLng), parseFloat(swLat)],
              [parseFloat(neLng), parseFloat(neLat)],
              [parseFloat(swLng), parseFloat(neLat)],
              [parseFloat(swLng), parseFloat(swLat)]
            ]]
          }
        }
      }
    }).toArray();

    console.log('조회된 경계 데이터 수:', boundaries.length);
    
    if (boundaries.length === 0) {
      console.log('경계 데이터가 없습니다. 컬렉션에 데이터가 있는지 확인해주세요.');
      return res.json([]);
    }

    // 각 경계별로 병원/약국 개수 집계
    const results = await Promise.all(boundaries.map(async (boundary) => {
      console.log('경계 데이터 처리 중:', boundary._id);
      
      const hospitalCount = await client.count({
        index: 'map_data',
        body: {
          query: {
            bool: {
              filter: [
                { term: { type: 'hospital' } },
                {
                  geo_shape: {
                    location: {
                      shape: boundary.geometry,
                      relation: 'within'
                    }
                  }
                }
              ]
            }
          }
        }
      });

      const pharmacyCount = await client.count({
        index: 'map_data',
        body: {
          query: {
            bool: {
              filter: [
                { term: { type: 'pharmacy' } },
                {
                  geo_shape: {
                    location: {
                      shape: boundary.geometry,
                      relation: 'within'
                    }
                  }
                }
              ]
            }
          }
        }
      });

      // 폴리곤의 중점 계산
      const coordinates = boundary.geometry.coordinates[0];
      const center = coordinates.reduce((acc, coord) => {
        return [acc[0] + coord[0], acc[1] + coord[1]];
      }, [0, 0]).map(coord => coord / coordinates.length);

      return {
        boundaryId: boundary._id,
        name: boundary.properties?.name || '',
        hospitalCount: hospitalCount.count,
        pharmacyCount: pharmacyCount.count,
        center: {
          lng: center[0],
          lat: center[1]
        }
      };
    }));

    console.log('최종 결과:', results);
    res.json(results);
  } catch (err) {
    console.error(`${collectionName} 요약 데이터 조회 오류:`, err);
    res.status(500).json({ error: `${collectionName} 요약 데이터 조회 중 오류가 발생했습니다.` });
  }
};

// 각 행정구역별 라우트
router.get('/ctp', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_ctprvn'));
router.get('/sig', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_sig'));
router.get('/emd', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_emd'));
router.get('/ri', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_ri'));

module.exports = router; 