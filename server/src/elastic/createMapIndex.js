const client = require('../config/elasticsearch');

async function createMapIndex() {
  await client.indices.create({
    index: 'map_data',
    body: {
      mappings: {
        properties: {
          type: { type: 'keyword' }, // hospital, pharmacy, facility
          name: { type: 'text' },
          address: { type: 'text' },
          category: { type: 'keyword' },
          region: { type: 'keyword' },
          location: { type: 'geo_point' },
          clusterId: { type: 'keyword' }, // 같은 위치의 마커들을 그룹화하기 위한 ID
          clusterCount: { type: 'integer' }, // 해당 클러스터의 총 마커 수
          isClustered: { type: 'boolean' } // 클러스터 여부
        }
      }
    }
  });
  console.log('✅ map_data 인덱스 생성 완료');
}

module.exports = { createMapIndex };
