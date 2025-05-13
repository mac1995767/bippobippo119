const mongoose = require('mongoose');
const { client } = require('../config/elasticsearch');
const redis = require('../config/redis');

// Redis에 경계 데이터 캐시 저장
const cacheBoundaryData = async (type, boundaryId, data) => {
  try {
    const cacheKey = `boundary:${type}:${boundaryId}`;
    await redis.set(cacheKey, JSON.stringify(data));
    console.log(`캐시 저장 완료: ${cacheKey}`);
  } catch (error) {
    console.error('캐시 저장 실패:', error);
  }
};

// Redis에서 경계 데이터 조회
const getCachedBoundaryData = async (type, boundaryId) => {
  try {
    const cacheKey = `boundary:${type}:${boundaryId}`;
    const cachedData = await redis.get(cacheKey);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error('캐시 조회 실패:', error);
    return null;
  }
};

// 초기 경계 데이터 로드 및 캐싱
const loadBoundaryCache = async () => {
  try {
    const collections = {
      ctp: 'sggu_boundaries_ctprvn',
      sig: 'sggu_boundaries_sig',
      emd: 'sggu_boundaries_emd',
      ri: 'sggu_boundaries_ri'
    };

    for (const [type, collectionName] of Object.entries(collections)) {
      console.log(`${type} 경계 데이터 캐싱 시작...`);
      
      const boundaries = await mongoose.connection.collection(collectionName).find({}).toArray();
      console.log(`${type} 경계 데이터 ${boundaries.length}개 발견`);
      
      for (const boundary of boundaries) {
        try {
          // 병원/약국 개수 집계
          const hospitalResult = await client.count({
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

          const pharmacyResult = await client.count({
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

          // 중심점 계산
          const coordinates = boundary.geometry.coordinates[0];
          const center = coordinates.reduce((acc, coord) => {
            return [acc[0] + coord[0], acc[1] + coord[1]];
          }, [0, 0]).map(coord => coord / coordinates.length);

          // 캐시할 데이터 구성
          const cacheData = {
            boundaryId: boundary._id.toString(),
            name: boundary.properties?.name || 
                  boundary.properties?.CTP_KOR_NM || 
                  boundary.properties?.SIG_KOR_NM || 
                  boundary.properties?.EMD_KOR_NM || 
                  boundary.properties?.LI_KOR_NM || 
                  boundary.name || '',
            hospitalCount: hospitalResult?.count || 0,
            pharmacyCount: pharmacyResult?.count || 0,
            center: {
              lng: center[0],
              lat: center[1]
            },
            geometry: boundary.geometry
          };

          // Redis에 저장
          await cacheBoundaryData(type, boundary._id.toString(), cacheData);
        } catch (error) {
          console.error(`경계 데이터 처리 중 오류 (${boundary._id}):`, error);
          continue;
        }
      }
      
      console.log(`${type} 경계 데이터 캐싱 완료`);
    }

    console.log('모든 경계 데이터 캐싱 완료');
  } catch (error) {
    console.error('경계 데이터 캐싱 중 오류 발생:', error);
    throw error;
  }
};

// 캐시 갱신 스케줄러
const scheduleCacheRefresh = () => {
  const CACHE_REFRESH_INTERVAL = 1000 * 60 * 60; // 1시간마다 갱신
  
  setInterval(async () => {
    try {
      console.log('경계 데이터 캐시 갱신 시작...');
      await loadBoundaryCache();
      console.log('경계 데이터 캐시 갱신 완료');
    } catch (error) {
      console.error('경계 데이터 캐시 갱신 실패:', error);
    }
  }, CACHE_REFRESH_INTERVAL);
};

module.exports = {
  loadBoundaryCache,
  getCachedBoundaryData,
  cacheBoundaryData,
  scheduleCacheRefresh
};
