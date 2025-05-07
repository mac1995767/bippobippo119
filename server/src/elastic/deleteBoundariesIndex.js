const client = require('../config/elasticsearch');

async function deleteBoundariesIndex() {
  try {
    const indexName = 'sggu-boundaries';
    const exists = await client.indices.exists({ index: indexName });
    
    if (exists) {
      await client.indices.delete({ index: indexName });
      console.log('✅ sggu-boundaries 인덱스 삭제 완료');
    } else {
      console.log('ℹ️ sggu-boundaries 인덱스가 존재하지 않습니다.');
    }
  } catch (error) {
    console.error('❌ 인덱스 삭제 중 오류 발생:', error);
    throw error;
  }
}

module.exports = { deleteBoundariesIndex };
