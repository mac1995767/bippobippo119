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


// 각 행정구역별 라우트
router.get('/ctp', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_ctprvn'));
router.get('/sig', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_sig'));
router.get('/emd', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_emd'));
router.get('/ri', (req, res) => processAreaSummary(req, res, 'sggu_boundaries_ri'));


// 클러스터 데이터 조회
router.get('/clusters', async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng, centerLat, centerLng, radius = 5 } = req.query;
    
    // 위도/경도 값 검증
    const swLatNum = parseFloat(swLat);
    const swLngNum = parseFloat(swLng);
    const neLatNum = parseFloat(neLat);
    const neLngNum = parseFloat(neLng);
    const centerLatNum = parseFloat(centerLat);
    const centerLngNum = parseFloat(centerLng);
    const radiusKm = parseFloat(radius);

    // 유효하지 않은 좌표값 체크
    if (isNaN(swLatNum) || isNaN(swLngNum) || isNaN(neLatNum) || isNaN(neLngNum) || 
        isNaN(centerLatNum) || isNaN(centerLngNum) || isNaN(radiusKm)) {
      console.error('Invalid coordinates:', { swLat, swLng, neLat, neLng, centerLat, centerLng, radius });
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // 클러스터 데이터 조회
    const result = await client.search({
      index: 'map_data',
      size: 50,
      _source: ['location', 'clusterCount', 'hospitalCount', 'pharmacyCount', 'clusterId', 'hospitals', 'pharmacies'],
      query: {
        bool: {
          filter: [
            { term: { type: 'cluster' } },
            {
              geo_distance: {
                distance: `${radiusKm}km`,
                location: {
                  lat: centerLatNum,
                  lon: centerLngNum
                }
              }
            }
          ]
        }
      },
      sort: [
        {
          _geo_distance: {
            location: {
              lat: centerLatNum,
              lon: centerLngNum
            },
            order: "asc",
            unit: "km"
          }
        }
      ]
    });

    const clusters = result.hits.hits.map(hit => {
      const source = hit._source;
      return {
        id: hit._id,
        type: 'cluster',
        location: source.location,
        clusterCount: source.clusterCount || 0,
        hospitalCount: source.hospitalCount || 0,
        pharmacyCount: source.pharmacyCount || 0,
        clusterId: source.clusterId || `${source.location.lat}_${source.location.lon}`,
        details: {
          hospitals: source.hospitals || [],
          pharmacies: source.pharmacies || []
        }
      };
    });

    res.json(clusters);
  } catch (error) {
    console.error('클러스터 데이터 조회 오류:', error);
    res.status(500).json({ error: '클러스터 데이터 조회 중 오류가 발생했습니다.' });
  }
});

// 클러스터 데이터 조회
router.get('/mapCluster', async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng, zoomLevel = '8' } = req.query;
    
    // 위도/경도 값 검증
    const swLatNum = parseFloat(swLat);
    const swLngNum = parseFloat(swLng);
    const neLatNum = parseFloat(neLat);
    const neLngNum = parseFloat(neLng);
    const zoomLevelNum = parseInt(zoomLevel);

    // 유효하지 않은 좌표값 체크
    if (isNaN(swLatNum) || isNaN(swLngNum) || isNaN(neLatNum) || isNaN(neLngNum)) {
      return res.status(400).json({ error: '유효하지 않은 좌표값' });
    }

    // 줌 레벨에 따른 경계 타입 결정
    let boundaryType;
    if (zoomLevelNum >= 15) {
      boundaryType = ['emd', 'li'];  // 동과 리 모두 포함
    }
    else if (zoomLevelNum >= 13) boundaryType = 'emd';
    else if (zoomLevelNum >= 11) boundaryType = 'sig';
    else boundaryType = 'ctprvn';

    // Elasticsearch에서 클러스터 데이터 조회
    const result = await client.search({
      index: 'map_data_cluster',
      size: 100,
      body: {
        query: {
          bool: {
            must: [
              Array.isArray(boundaryType) ? { terms: { boundaryType } } : { term: { boundaryType } }
            ],
            filter: [
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
        }
      }
    });

    const clusters = result.hits.hits.map(hit => ({
      id: hit._id,
      name: hit._source.name,
      boundaryType: hit._source.boundaryType,
      boundaryId: hit._source.boundaryId,
      location: hit._source.location,
      hospitalCount: hit._source.hospitalCount || 0,
      pharmacyCount: hit._source.pharmacyCount || 0,
      isClustered: hit._source.isClustered || false
    }));

    res.json(clusters);
  } catch (error) {
    console.error('클러스터 데이터 조회 오류:', error);
    res.status(500).json({ error: '클러스터 데이터 조회 중 오류가 발생했습니다.' });
  }
});

// 경계 geometry 데이터 조회
router.get('/boundary-geometry', async (req, res) => {
  try {
    const { boundaryType, name } = req.query;

    if (!boundaryType || !name) {
      return res.status(400).json({ error: '경계 타입과 이름이 필요합니다.' });
    }

    let collectionName;
    let queryField;
    switch(boundaryType) {
      case 'ctprvn':
        collectionName = 'sggu_boundaries_ctprvn';
        queryField = 'properties.CTP_KOR_NM';
        break;
      case 'sig':
        collectionName = 'sggu_boundaries_sig';
        queryField = 'properties.SIG_KOR_NM';
        break;
      case 'emd':
        collectionName = 'sggu_boundaries_emd';
        queryField = 'properties.EMD_KOR_NM';
        break;
      case 'li':
        collectionName = 'sggu_boundaries_li';
        queryField = 'properties.LI_KOR_NM';
        break;
      default:
        return res.status(400).json({ error: '유효하지 않은 경계 타입입니다.' });
    }

    const collection = mongoose.connection.collection(collectionName);

    // 인덱스 확인 및 생성
    const indexes = await collection.indexes();
    const hasGeoIndex = indexes.some(index => index.key && index.key.geometry === 'geometry_2dsphere');
    
    if (!hasGeoIndex) {
      await collection.createIndex({ geometry: '2dsphere' });
    }

    // geometry_2dsphere 인덱스를 사용하여 조회
    const boundary = await collection.findOne({
      [queryField]: name
    });

    if (!boundary) {
      return res.status(404).json({ error: '해당하는 경계를 찾을 수 없습니다.' });
    }

    if (!boundary.geometry || !['MultiPolygon', 'Polygon'].includes(boundary.geometry.type)) {
      return res.status(400).json({ error: '유효하지 않은 geometry 타입입니다.' });
    }

    // 클라이언트에 전송할 데이터 정리
    const responseData = {
      type: boundaryType,
      name: name,
      geometry: boundary.geometry,
      geometryType: boundary.geometry.type
    };

    res.json(responseData);

  } catch (error) {
    console.error('경계 geometry 데이터 조회 오류:', error);
    res.status(500).json({ error: '경계 geometry 데이터 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 