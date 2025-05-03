const client = require('../config/elasticsearch');

async function createMapIndex() {
  await client.indices.create({
    index: 'map_data',
    body: {
      mappings: {
        properties: {
          type: { type: 'keyword' }, // hospital, pharmacy, facility
          name: { type: 'text' },
          address: { type: 'text' },
          category: { type: 'keyword' },
          region: { type: 'keyword' },
          location: { type: 'geo_point' }
        }
      }
    }
  });
  console.log('✅ map_data 인덱스 생성 완료');
}

module.exports = { createMapIndex };
