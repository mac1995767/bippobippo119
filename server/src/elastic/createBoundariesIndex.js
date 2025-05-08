// createBoundariesIndex.js
// Elasticsearch 인덱스 생성 모듈 (geo_shape 매핑 적용)

const client = require('../config/elasticsearch');

const INDEX_NAME = 'sggu-boundaries';

async function createBoundariesIndex() {
  try {
    const existsResp = await client.indices.exists({ index: INDEX_NAME });
    const exists = existsResp.body ?? existsResp;
    if (exists) {
      console.log(`인덱스 "${INDEX_NAME}"가 이미 존재합니다.`);
      return;
    }

    await client.indices.create({
      index: INDEX_NAME,
      body: {
        mappings: {
          properties: {
            type: { type: 'keyword' },
            properties: {
              type: 'object',
              properties: {
                ADM_SECT_C: { type: 'keyword' },
                SGG_NM:     { type: 'keyword' },
                SGG_OID:    { type: 'integer' },
                COL_ADM_SE: { type: 'keyword' }
              }
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

    console.log(`✅ 인덱스 "${INDEX_NAME}" 생성 완료`);
  } catch (err) {
    console.error('❌ 인덱스 생성 중 오류:', err);
    throw err;
  }
}

module.exports = { createBoundariesIndex };