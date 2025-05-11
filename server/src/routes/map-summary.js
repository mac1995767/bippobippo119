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

// 경계별 병원/약국 집계 (zoom에 따라 컬렉션 자동 선택)
router.get('/boundary', async (req, res) => {
  try {
    const { zoom, swLat, swLng, neLat, neLng } = req.query;
    const zoomNum = parseInt(zoom);
    let collectionName;
    if (zoomNum >= 8 && zoomNum <= 10) collectionName = 'sggu_boundaries_ctprvn';
    else if (zoomNum >= 11 && zoomNum <= 12) collectionName = 'sggu_boundaries_sig';
    else if (zoomNum >= 13 && zoomNum <= 14) collectionName = 'sggu_boundaries_emd';
    else if (zoomNum === 15) collectionName = 'sggu_boundaries_li';
    else return res.status(400).json({ error: 'Invalid zoom' });

    // 현재 뷰포트 내 경계 폴리곤 조회
    const Boundary = mongoose.connection.collection(collectionName);
    const boundsPolygon = {
      type: 'Polygon',
      coordinates: [[
        [parseFloat(swLng), parseFloat(swLat)],
        [parseFloat(swLng), parseFloat(neLat)],
        [parseFloat(neLng), parseFloat(neLat)],
        [parseFloat(neLng), parseFloat(swLat)],
        [parseFloat(swLng), parseFloat(swLat)]
      ]]
    };
    const polygons = await Boundary.find({
      geometry: {
        $geoIntersects: { $geometry: boundsPolygon }
      }
    }).toArray();

    // 병원/약국 집계 (각 폴리곤별로)
    const mapData = mongoose.connection.collection('map_data');
    const results = await Promise.all(polygons.map(async poly => {
      const hospitalCount = await mapData.countDocuments({
        type: 'hospital',
        location: {
          $geoWithin: { $geometry: poly.geometry }
        }
      });
      const pharmacyCount = await mapData.countDocuments({
        type: 'pharmacy',
        location: {
          $geoWithin: { $geometry: poly.geometry }
        }
      });
      return {
        boundaryId: poly._id,
        name: poly.properties?.CTP_KOR_NM || poly.properties?.SIG_KOR_NM || poly.properties?.EMD_KOR_NM || poly.properties?.LI_KOR_NM || '',
        hospitalCount,
        pharmacyCount,
        geometry: poly.geometry
      };
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'boundary 집계 오류', details: err.message });
  }
});

// 시도별 summary (MongoDB + Elasticsearch 조합)
router.get('/ctp', async (req, res) => {
  try {
    const Ctp = mongoose.connection.collection('sggu_boundaries_ctprvn');
    const polys = await Ctp.find({}).toArray();
    const results = await Promise.all(polys.map(async poly => {
      // 병원 개수
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
                      shape: poly.geometry,
                      relation: 'within'
                    }
                  }
                }
              ]
            }
          }
        }
      });
      // 약국 개수
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
                      shape: poly.geometry,
                      relation: 'within'
                    }
                  }
                }
              ]
            }
          }
        }
      });
      return {
        boundaryId: poly._id,
        name: poly.properties?.CTP_KOR_NM || '',
        hospitalCount: hospitalCount.count,
        pharmacyCount: pharmacyCount.count,
        geometry: poly.geometry
      };
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'ctp summary 오류', details: err.message });
  }
});

// 시군구별 summary (MongoDB + Elasticsearch 조합)
router.get('/sig', async (req, res) => {
  try {
    const Sig = mongoose.connection.collection('sggu_boundaries_sig');
    const polys = await Sig.find({}).toArray();
    const results = await Promise.all(polys.map(async poly => {
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
                      shape: poly.geometry,
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
                      shape: poly.geometry,
                      relation: 'within'
                    }
                  }
                }
              ]
            }
          }
        }
      });
      return {
        boundaryId: poly._id,
        name: poly.properties?.SIG_KOR_NM || '',
        hospitalCount: hospitalCount.count,
        pharmacyCount: pharmacyCount.count,
        geometry: poly.geometry
      };
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'sig summary 오류', details: err.message });
  }
});

// 읍면동별 summary (MongoDB + Elasticsearch 조합)
router.get('/emd', async (req, res) => {
  try {
    const Emd = mongoose.connection.collection('sggu_boundaries_emd');
    const polys = await Emd.find({}).toArray();
    const results = await Promise.all(polys.map(async poly => {
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
                      shape: poly.geometry,
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
                      shape: poly.geometry,
                      relation: 'within'
                    }
                  }
                }
              ]
            }
          }
        }
      });
      return {
        boundaryId: poly._id,
        name: poly.properties?.EMD_KOR_NM || '',
        hospitalCount: hospitalCount.count,
        pharmacyCount: pharmacyCount.count,
        geometry: poly.geometry
      };
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'emd summary 오류', details: err.message });
  }
});

// 리(ri) 경계별 요약
router.get('/ri', async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng } = req.query;
    
    // MongoDB에서 리 경계 데이터 조회
    const riBoundaries = await RiBoundary.find({
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: 'Polygon',
            coordinates: [[
              [parseFloat(swLng), parseFloat(swLat)],
              [parseFloat(neLng), parseFloat(swLat)],
              [parseFloat(neLng), parseFloat(neLat)],
              [parseFloat(swLat), parseFloat(neLat)],
              [parseFloat(swLng), parseFloat(swLat)]
            ]]
          }
        }
      }
    });

    // 각 리별로 병원/약국 개수 집계
    const summary = await Promise.all(riBoundaries.map(async (ri) => {
      const hospitalCount = await Hospital.countDocuments({
        location: {
          $geoWithin: {
            $geometry: ri.geometry
          }
        }
      });

      const pharmacyCount = await Pharmacy.countDocuments({
        location: {
          $geoWithin: {
            $geometry: ri.geometry
          }
        }
      });

      return {
        name: ri.properties.riNm,
        geometry: ri.geometry,
        hospitalCount,
        pharmacyCount
      };
    }));

    res.json(summary);
  } catch (error) {
    console.error('리 경계 요약 조회 오류:', error);
    res.status(500).json({ error: '리 경계 요약 조회 중 오류가 발생했습니다.' });
  }
});

// 필요하다면읍면동 등 다른 경계별 요약도 추가 가능

module.exports = router; 