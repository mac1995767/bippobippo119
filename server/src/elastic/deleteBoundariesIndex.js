const client = require('../config/elasticsearch');

const VALID_INDICES = [
  'ctp-boundaries',
  'sig-boundaries',
  'emd-boundaries',
  'li-boundaries'
];

async function deleteBoundariesIndex(indexName) {
  try {
    if (!VALID_INDICES.includes(indexName)) {
      throw new Error(`알 수 없는 인덱스 이름: ${indexName}`);
    }

    const exists = await client.indices.exists({ index: indexName });
    
    if (exists) {
      await client.indices.delete({ index: indexName });
      console.log(`✅ ${indexName} 인덱스 삭제 완료`);
    } else {
      console.log(`ℹ️ ${indexName} 인덱스가 존재하지 않습니다.`);
    }
  } catch (error) {
    console.error('❌ 인덱스 삭제 중 오류 발생:', error);
    throw error;
  }
}

module.exports = { deleteBoundariesIndex };
