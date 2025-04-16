const client = require('../config/elasticsearch');

async function createPharmaciesIndex() {
  try {
    await client.indices.create({
      index: 'pharmacies',
      body: {
        mappings: {
          properties: {
            ykiho: { type: 'keyword' },
            yadmNm: { type: 'text' },
            clCd: { type: 'keyword' },
            clCdNm: { type: 'keyword' },
            sidoCd: { type: 'keyword' },
            sidoCdNm: { type: 'keyword' },
            sgguCd: { type: 'keyword' },
            sgguCdNm: { type: 'keyword' },
            emdongNm: { type: 'keyword' },
            postNo: { type: 'keyword' },
            addr: { type: 'text' },
            telno: { type: 'keyword' },
            estbDd: { type: 'date' },
            location: {
              type: 'geo_point'
            }
          }
        }
      }
    });
    console.log('✅ 약국 인덱스 생성 완료');
  } catch (error) {
    console.error('❌ 약국 인덱스 생성 실패:', error);
    throw error;
  }
}

module.exports = { createPharmaciesIndex }; 