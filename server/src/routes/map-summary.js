const express = require('express');
const router = express.Router();
const client = require('../config/elasticsearch');
const mongoose = require('mongoose');
const redis = require('../config/redis');

const CACHE_TTL = 3600; // 1시간 캐시 유효기간

// Redis 연결 상태 확인
redis.on('connect', () => {
  console.log('Redis 연결됨');
});

redis.on('error', (err) => {
  console.error('Redis 연결 오류:', err);
});

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
    
    // 중간값 계산
    const midLat = (parseFloat(swLat) + parseFloat(neLat)) / 2;
    const midLng = (parseFloat(swLng) + parseFloat(neLng)) / 2;

    // 두 개의 영역에 대한 캐시 키 생성
    const cacheKey1 = `areaSummary:${collectionName}:${swLat},${swLng},${midLat},${midLng}`;
    const cacheKey2 = `areaSummary:${collectionName}:${midLat},${midLng},${neLat},${neLng}`;
    
    console.log('생성된 캐시 키:', { cacheKey1, cacheKey2 });
    
    // 두 영역의 캐시된 데이터 확인
    const [cached1, cached2] = await Promise.all([
      redis.get(cacheKey1),
      redis.get(cacheKey2)
    ]);
    
    console.log('캐시 조회 결과:', {
      area1: cached1 ? '데이터 있음' : '데이터 없음',
      area2: cached2 ? '데이터 있음' : '데이터 없음'
    });
    
    // 두 영역 모두 캐시된 경우
    if (cached1 && cached2) {
      console.log('캐시된 데이터 반환');
      const data1 = JSON.parse(cached1);
      const data2 = JSON.parse(cached2);
      return res.json([...data1, ...data2]);
    }
    
    // 캐시되지 않은 영역 처리
    const processArea = async (swLat, swLng, neLat, neLng, cacheKey) => {
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
        console.log('경계 데이터가 없습니다.');
        return [];
      }

      // 각 경계별로 병원/약국 개수 집계
      const results = await Promise.all(boundaries.map(async (boundary) => {
        const idStr = boundary._id.toString();
        console.log('경계 데이터 처리 중:', idStr);
        
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
          boundaryId: idStr,
          name: boundary.properties?.name || 
                boundary.properties?.CTP_KOR_NM || 
                boundary.properties?.SIG_KOR_NM || 
                boundary.properties?.EMD_KOR_NM || 
                boundary.properties?.LI_KOR_NM || 
                boundary.name || '',
          hospitalCount: hospitalCount.count,
          pharmacyCount: pharmacyCount.count,
          center: {
            lng: center[0],
            lat: center[1]
          },
          geometry: boundary.geometry
        };
      }));

      // 결과를 Redis에 캐시
      try {
        await redis.set(cacheKey, JSON.stringify(results), 'EX', CACHE_TTL);
        console.log('데이터 캐시 저장 완료:', cacheKey);
      } catch (cacheError) {
        console.error('Redis 캐시 저장 실패:', cacheError);
      }

      return results;
    };

    // 두 영역의 데이터 처리
    const [results1, results2] = await Promise.all([
      cached1 ? JSON.parse(cached1) : processArea(swLat, swLng, midLat, midLng, cacheKey1),
      cached2 ? JSON.parse(cached2) : processArea(midLat, midLng, neLat, neLng, cacheKey2)
    ]);

    // 결과 병합 및 반환
    res.json([...results1, ...results2]);
  } catch (err) {
    console.error(`${collectionName} 요약 데이터 조회 오류:`, err);
    res.status(500).json({ error: `${collectionName} 요약 데이터 조회 중 오류가 발생했습니다.` });
  }
};

// 줌 레벨에 따른 컬렉션 이름 결정
const getCollectionByZoom = (zoom) => {
  if (zoom >= 15) return 'sggu_boundaries_ri';
  if (zoom >= 13) return 'sggu_boundaries_emd';
  if (zoom >= 11) return 'sggu_boundaries_sig';
  return 'sggu_boundaries_ctprvn';
};

// 각 행정구역별 라우트
router.get('/ctp', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_ctprvn'));
router.get('/sig', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_sig'));
router.get('/emd', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_emd'));
router.get('/ri', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_ri'));

// Redis 캐시 상태 확인 엔드포인트
router.get('/cache-status', async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng, zoomLevel } = req.query;
    const collectionName = getCollectionByZoom(parseInt(zoomLevel));
    const cacheKey = `areaSummary:${collectionName}:${swLat},${swLng},${neLat},${neLng}`;
    
    console.log('캐시 상태 확인:', { collectionName, cacheKey });
    const isCached = await redis.exists(cacheKey);
    res.json({ isCached: isCached === 1 });
  } catch (error) {
    console.error('캐시 상태 확인 실패:', error);
    res.status(500).json({ error: '캐시 상태 확인 중 오류가 발생했습니다.' });
  }
});

// 캐시된 데이터 조회 엔드포인트
router.get('/cached', async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng, zoomLevel } = req.query;
    const collectionName = getCollectionByZoom(parseInt(zoomLevel));
    const cacheKey = `areaSummary:${collectionName}:${swLat},${swLng},${neLat},${neLng}`;
    
    console.log('캐시된 데이터 조회:', { collectionName, cacheKey });
    const cachedData = await redis.get(cacheKey);
    if (!cachedData) {
      return res.status(404).json({ error: '캐시된 데이터가 없습니다.' });
    }
    
    res.json(JSON.parse(cachedData));
  } catch (error) {
    console.error('캐시된 데이터 조회 실패:', error);
    res.status(500).json({ error: '캐시된 데이터 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 