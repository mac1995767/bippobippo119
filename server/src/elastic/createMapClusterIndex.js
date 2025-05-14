const client = require('../config/elasticsearch');

async function createMapClusterIndex() {
  try {
    // map_data_cluster 인덱스가 이미 존재하는지 확인
    const { body: exists } = await client.indices.exists({
      index: 'map_data_cluster'
    });

    if (exists) {
      console.log('ℹ️ map_data_cluster 인덱스가 이미 존재합니다.');
      return;
    }

    // map_data_cluster 인덱스 생성
    await client.indices.create({
      index: 'map_data_cluster',
      body: {
        mappings: {
          properties: {
            type: { type: 'keyword' }, // cluster
            name: { type: 'text' },
            boundaryType: { type: 'keyword' }, // ctprvn, sig, emd, li
            boundaryId: { type: 'keyword' },
            location: { type: 'geo_point' },
            clusterId: { type: 'keyword' },
            hospitalCount: { type: 'integer' },
            pharmacyCount: { type: 'integer' },
            isClustered: { type: 'boolean' }
          }
        },
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1
        }
      }
    });

    console.log('✅ map_data_cluster 인덱스 생성 완료');
  } catch (error) {
    console.error('인덱스 생성 중 오류 발생:', error);
    throw error;
  }
}

module.exports = { createMapClusterIndex };
