const { client } = require('./client');
const { fetchHospitals } = require('./dataFetchers/hospitalFetcher');
const { fetchPharmacies } = require('./dataFetchers/pharmacyFetcher');
const { fetchMapData } = require('./dataFetchers/mapFetcher');
const { fetchSgguCoordinates } = require('./dataFetchers/sgguCoordFetcher');
const { fetchBoundaries } = require('./dataFetchers/boundariesFetcher');

const hospitalMapping = require('./mappings/hospitalMapping');
const pharmacyMapping = require('./mappings/pharmacyMapping');
const mapMapping = require('./mappings/mapMapping');
const sgguCoordMapping = require('./mappings/sgguCoordMapping');
const boundariesMapping = require('./mappings/boundariesMapping');

const INDEX_CONFIG = {
  hospitals: {
    mapping: hospitalMapping,
    fetcher: fetchHospitals,
    alias: 'hospitals'
  },
  pharmacies: {
    mapping: pharmacyMapping,
    fetcher: fetchPharmacies,
    alias: 'pharmacies'
  },
  map: {
    mapping: mapMapping,
    fetcher: fetchMapData,
    alias: 'map'
  },
  sggu_coords: {
    mapping: sgguCoordMapping,
    fetcher: fetchSgguCoordinates,
    alias: 'sggu_coords'
  },
  boundaries: {
    mapping: boundariesMapping,
    fetcher: fetchBoundaries,
    alias: 'boundaries'
  }
};

let indexingStatus = {
  isRunning: false,
  progress: 0,
  currentIndex: null,
  lastUpdate: null,
  error: null
};

async function createIndex(indexName, mapping) {
  const indexExists = await client.indices.exists({ index: indexName });
  if (!indexExists) {
    await client.indices.create({
      index: indexName,
      body: {
        mappings: mapping,
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1
        }
      }
    });
  }
}

async function updateAlias(indexName, alias) {
  const aliasExists = await client.indices.existsAlias({ name: alias });
  if (aliasExists) {
    const oldIndex = await client.indices.getAlias({ name: alias });
    await client.indices.deleteAlias({
      index: Object.keys(oldIndex)[0],
      name: alias
    });
  }
  await client.indices.putAlias({
    index: indexName,
    name: alias
  });
}

async function bulkIndex(indexName, documents) {
  const operations = documents.flatMap(doc => [
    { index: { _index: indexName } },
    doc
  ]);

  const response = await client.bulk({ body: operations });
  if (response.errors) {
    const errors = response.items
      .filter(item => item.index.error)
      .map(item => item.index.error);
    throw new Error(`Bulk indexing errors: ${JSON.stringify(errors)}`);
  }
}

async function reindex(indexType) {
  if (indexingStatus.isRunning) {
    throw new Error('인덱싱이 이미 진행 중입니다.');
  }

  const config = INDEX_CONFIG[indexType];
  if (!config) {
    throw new Error(`알 수 없는 인덱스 타입: ${indexType}`);
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const newIndexName = `${indexType}_${timestamp}`;
  const backupIndexName = `${indexType}_backup_${timestamp}`;

  try {
    indexingStatus = {
      isRunning: true,
      progress: 0,
      currentIndex: indexType,
      lastUpdate: new Date(),
      error: null
    };

    // 1. 현재 인덱스 백업
    if (await client.indices.exists({ index: config.alias })) {
      const currentIndex = await client.indices.getAlias({ name: config.alias });
      await client.indices.putAlias({
        index: Object.keys(currentIndex)[0],
        name: backupIndexName
      });
    }

    // 2. 새 인덱스 생성
    await createIndex(newIndexName, config.mapping);
    indexingStatus.progress = 10;

    // 3. 데이터 가져오기 및 인덱싱
    const documents = await config.fetcher();
    await bulkIndex(newIndexName, documents);
    indexingStatus.progress = 50;

    // 4. 새 인덱스로 alias 전환
    await updateAlias(newIndexName, config.alias);
    indexingStatus.progress = 100;

    // 5. 백업 인덱스 삭제
    if (await client.indices.exists({ index: backupIndexName })) {
      await client.indices.delete({ index: backupIndexName });
    }

    indexingStatus = {
      isRunning: false,
      progress: 100,
      currentIndex: indexType,
      lastUpdate: new Date(),
      error: null
    };

  } catch (error) {
    indexingStatus = {
      isRunning: false,
      progress: 0,
      currentIndex: indexType,
      lastUpdate: new Date(),
      error: error.message
    };
    throw error;
  }
}

async function getIndices() {
  const indices = await client.cat.indices({ format: 'json' });
  return indices.map(index => ({
    name: index.index,
    docs: index['docs.count'],
    size: index['store.size'],
    health: index.health
  }));
}

module.exports = {
  reindex,
  getIndices,
  getIndexingStatus: () => indexingStatus
}; 