const client = require('../config/elasticsearch');

async function createBoundariesIndex() {
  try {
    const indexName = 'sggu-boundaries';
    
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
            type: { type: 'keyword' },
            properties: {
              type: 'object',
              properties: {
                ADM_SECT_C: { type: 'keyword' },
                SGG_NM: { type: 'keyword' },
                SGG_OID: { type: 'integer' },
                COL_ADM_SE: { type: 'keyword' }
              }
            },
            geometry: {
              type: 'geo_shape'
            }
          }
        }
      }
    });

    console.log('✅ sggu-boundaries 인덱스 생성 완료');
  } catch (error) {
    console.error('❌ 인덱스 생성 중 오류 발생:', error);
    throw error;
  }
}

module.exports = { createBoundariesIndex };
