const client = require('../config/elasticsearch');

async function deleteMapIndex() {
  await client.indices.delete({ index: 'map_data' });
  console.log('🗑️ map_data 인덱스 삭제 완료');
}

module.exports = { deleteMapIndex };
