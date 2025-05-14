const client = require('../config/elasticsearch');

async function deleteMapClusterIndex() {
  try {
    // map_data_cluster 인덱스가 존재하는지 확인
    const { body: exists } = await client.indices.exists({
      index: 'map_data_cluster'
    });

    if (exists) {
      // map_data_cluster 인덱스 삭제
      await client.indices.delete({
        index: 'map_data_cluster'
      });
      console.log('✅ map_data_cluster 인덱스 삭제 완료');
    } else {
      console.log('ℹ️ map_data_cluster 인덱스가 존재하지 않습니다.');
    }
  } catch (error) {
    console.error('인덱스 삭제 중 오류 발생:', error);
    throw error;
  }
}

module.exports = { deleteMapClusterIndex };
