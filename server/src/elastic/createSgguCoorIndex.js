const client = require("../config/elasticsearch");

async function createSgguCoorIndex() {
  try {
    const indexName = 'sggu-coordinates';
    
    // 인덱스가 이미 존재하는지 확인
    const indexExists = await client.indices.exists({ index: indexName });
    
    if (indexExists) {
      console.log('인덱스가 이미 존재합니다.');
      return;
    }

    // 인덱스 생성 및 매핑 설정
    await client.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            sidoNm: { type: 'keyword' },
            sgguNm: { type: 'keyword' },
            emdongNm: { type: 'keyword' },
            riNm: { type: 'keyword' },
            YPos: { type: 'float' },
            XPos: { type: 'float' },
            location: {
              type: 'geo_point'
            }
          }
        }
      }
    });

    console.log('인덱스가 성공적으로 생성되었습니다.');
  } catch (error) {
    console.error('인덱스 생성 중 오류 발생:', error);
  }
}

module.exports = { createSgguCoorIndex };
