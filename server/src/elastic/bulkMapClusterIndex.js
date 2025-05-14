// bulkMapClusterIndex.js

const client = require('../config/elasticsearch');
const mongoose = require('mongoose');

const BOUNDARY_TYPES = ['ctprvn', 'sig', 'emd', 'li'];
const BATCH_SIZE = 50; // 한 번에 처리할 문서 수

// 병원/약국 수를 geo_shape 또는 geo_point 쿼리로 구함
async function countByGeoShape(index, geometry) {
  const result = await client.search({
    index,
    size: 0,
    query: {
      bool: {
        filter: [
          {
            geo_shape: {
              location: {
                shape: geometry,
                relation: 'within'    // 완전 포함
              }
            }
          }
        ]
      }
    }
  });

  return result.hits.total.value || 0;
}

// 중심점 계산
function calculateCentroid(geometry) {
  let x = 0, y = 0, count = 0;

  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(polygon => {
      polygon[0].forEach(([lon, lat]) => {
        x += lon; y += lat; count++;
      });
    });
  } else if (geometry.type === 'Polygon') {
    geometry.coordinates[0].forEach(([lon, lat]) => {
      x += lon; y += lat; count++;
    });
  }

  return count > 0
    ? { lat: y / count, lon: x / count }
    : { lat: 0, lon: 0 };
}

// 단일 경계 색인 처리
async function indexCluster(boundary, boundaryType) {
  const { geometry, properties, _id } = boundary;
  const mongoId = _id?.toString();

  if (!geometry || !geometry.type || !Array.isArray(geometry.coordinates)) {
    console.warn(`❌ SKIP ${boundaryType}_${mongoId}: invalid geometry →`, geometry);
    return;
  }

  // boundaryType에 따른 ID 추출
  const idMap = {
    ctprvn: properties?.CTPRVN_CD,
    sig:    properties?.SIG_CD,
    emd:    properties?.EMD_CD,
    li:     properties?.LI_CD,
  };
  const boundaryId = idMap[boundaryType];
  if (!boundaryId) {
    console.warn(`❌ SKIP ${boundaryType}_${mongoId}: missing ID in properties →`, properties);
    return;
  }

  const clusterId = `${boundaryType}_${mongoId}`;
  const hospitalCount = await countByGeoShape('hospitals', geometry);
  const pharmacyCount = await countByGeoShape('pharmacies', geometry);
  const centroid = calculateCentroid(geometry);

  return {
    index: 'map_data_cluster',
    id: clusterId,
    document: {
      type: 'cluster',
      name: properties?.CTP_KOR_NM
         || properties?.SIG_KOR_NM
         || properties?.EMD_KOR_NM
         || properties?.LI_KOR_NM
         || 'unknown',
      boundaryType,
      boundaryId,
      location: {
        lat: centroid.lat,
        lon: centroid.lon
      },
      clusterId,
      hospitalCount,
      pharmacyCount,
      isClustered: true
    }
  };
}

// 전체 bulk 실행
async function bulkMapClusterIndex() {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ MongoDB 연결 대기 중...');
      await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }
    const db = mongoose.connection.db;

    // 콘텐츠 값 출력
    for (const type of BOUNDARY_TYPES) {
      const collectionName = `sggu_boundaries_${type}`;
      const count = await db.collection(collectionName).countDocuments();
      console.log(`📄 ${collectionName} 문서 수: ${count}`);
    }

    // 시작
    for (const type of BOUNDARY_TYPES) {
      const collectionName = `sggu_boundaries_${type}`;
      const totalCount = await db.collection(collectionName).countDocuments();
      console.log(`📍 [${type}] 경계 총 ${totalCount}개 처리 시작`);

      // 커서를 사용하여 배치 처리
      const cursor = db.collection(collectionName).find({}).batchSize(BATCH_SIZE);
      let processedCount = 0;
      let batch = [];

      while (await cursor.hasNext()) {
        const boundary = await cursor.next();
        const doc = await indexCluster(boundary, type);
        if (doc) {
          batch.push(doc);
        }
        
        if (batch.length >= BATCH_SIZE || !(await cursor.hasNext())) {
          if (batch.length > 0) {
            // 벌크 작업 실행
            const operations = batch.flatMap(doc => [
              { index: { _index: doc.index, _id: doc.id } },
              doc.document
            ]);
            
            const bulkResponse = await client.bulk({ 
              refresh: true,
              operations 
            });

            if (bulkResponse.errors) {
              console.error('벌크 작업 중 오류 발생:',
                bulkResponse.items.filter(item => item.index?.error));
            }

            processedCount += batch.length;
            console.log(`Progress: ${processedCount}/${totalCount} (${Math.round(processedCount/totalCount*100)}%)`);
            batch = [];
            
            // 잠시 대기하여 시스템에 과부하가 걸리지 않도록 함
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      await cursor.close();
    }

    await client.indices.refresh({ index: 'map_data_cluster' });
    console.log('🎉 클러스터 인데시킹 및 리프레시 완료');
  } catch (error) {
    console.error('❌ 클러스터 인데시킹 중 전체 오류 발생:', error);
    throw error;
  }
}

module.exports = { bulkMapClusterIndex };
