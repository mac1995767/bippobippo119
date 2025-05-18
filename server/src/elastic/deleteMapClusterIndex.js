const client = require('../config/elasticsearch');

async function deleteMapClusterIndex() {
  try {
    const exists = await client.indices.exists({ index: 'map_data_cluster' });
    if (exists) {
      await client.indices.delete({ index: 'map_data_cluster' });
      console.log('✅ map_data_cluster 인덱스 삭제 완료');
    } else {
      console.log('ℹ️ map_data_cluster 인덱스가 존재하지 않습니다.');
    }
  } catch (error) {
    console.error('❌ map_data_cluster 인덱스 삭제 실패:', error);
    throw error;
  }
}

module.exports = { deleteMapClusterIndex };
