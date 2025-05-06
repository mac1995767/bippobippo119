const client = require("../config/elasticsearch");

async function deleteSgguCoorIndex() {
  try {
    const indexName = 'sggu-coordinates';
    
    // 인덱스가 존재하는지 확인
    const indexExists = await client.indices.exists({ index: indexName });
    
    if (!indexExists) {
      console.log('삭제할 인덱스가 존재하지 않습니다.');
      return;
    }

    // 인덱스 삭제
    await client.indices.delete({ index: indexName });
    console.log('인덱스가 성공적으로 삭제되었습니다.');
  } catch (error) {
    console.error('인덱스 삭제 중 오류 발생:', error);
  }
}

module.exports = { deleteSgguCoorIndex };
