// createBoundariesIndex.js
// Elasticsearch 인덱스 생성 모듈 (geo_shape 매핑 적용)

const client = require('../config/elasticsearch');

const INDICES = {
  'ctp-boundaries': {
    properties: {
      CTPRVN_CD: { type: 'keyword' },
      CTP_KOR_NM: { type: 'keyword' },
      CTP_ENG_NM: { type: 'keyword' }
    }
  },
  'sig-boundaries': {
    properties: {
      SIG_CD: { type: 'keyword' },
      SIG_KOR_NM: { type: 'keyword' },
      SIG_ENG_NM: { type: 'keyword' },
      CTPRVN_CD: { type: 'keyword' }
    }
  },
  'emd-boundaries': {
    properties: {
      EMD_CD: { type: 'keyword' },
      EMD_KOR_NM: { type: 'keyword' },
      EMD_ENG_NM: { type: 'keyword' },
      SIG_CD: { type: 'keyword' }
    }
  },
  'li-boundaries': {
    properties: {
      LI_CD: { type: 'keyword' },
      LI_KOR_NM: { type: 'keyword' },
      LI_ENG_NM: { type: 'keyword' },
      EMD_CD: { type: 'keyword' }
    }
  }
};

async function createBoundariesIndex(indexName) {
  try {
    if (!INDICES[indexName]) {
      throw new Error(`알 수 없는 인덱스 이름: ${indexName}`);
    }

    const existsResp = await client.indices.exists({ index: indexName });
    const exists = existsResp.body ?? existsResp;
    
    if (exists) {
      console.log(`인덱스 "${indexName}"가 이미 존재합니다.`);
      return;
    }

    await client.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            type: { type: 'keyword' },
            properties: {
              type: 'object',
              properties: INDICES[indexName].properties
            },
            geometry: {
              type: 'geo_shape',
              tree: 'quadtree',
              precision: '1m'
            }
          }
        }
      }
    });

    console.log(`✅ 인덱스 "${indexName}" 생성 완료`);
  } catch (err) {
    console.error('❌ 인덱스 생성 중 오류:', err);
    throw err;
  }
}

module.exports = { createBoundariesIndex };