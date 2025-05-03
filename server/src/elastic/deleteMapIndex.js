const client = require('../config/elasticsearch');

async function deleteMapIndex() {
  try {
    await client.indices.delete({ index: 'map_data' });
    console.log('🗑️ map_data 인덱스 삭제 완료');
  } catch (error) {
    if (error.meta && error.meta.body && error.meta.body.error && error.meta.body.error.type === 'index_not_found_exception') {
      console.log('ℹ️ map_data 인덱스가 존재하지 않아 삭제할 필요가 없습니다.');
    } else {
      throw error;
    }
  }
}

module.exports = { deleteMapIndex };
