const { deleteHospitalsIndex } = require('./deleteIndex');
const { createHospitalIndex } = require('./createIndex');
const { bulkIndex } = require('./bulkIndex');
const { deletePharmaciesIndex } = require('./deletePharmaciesIndex');
const { createPharmaciesIndex } = require('./createPharmaciesIndex');
const { bulkPharmaciesIndex } = require('./bulkPharmaciesIndex');
const { deleteMapIndex } = require('./deleteMapIndex');
const { createMapIndex } = require('./createMapIndex');
const { bulkMapIndex } = require('./bulkMapIndex');
const { deleteMapClusterIndex } = require('./deleteMapClusterIndex');
const { createMapClusterIndex } = require('./createMapClusterIndex');
const { bulkMapClusterIndex } = require('./bulkMapClusterIndex');

async function reindex() {
  try {
    console.log("🔄 Starting reindexing process...");
    
    console.log("Step 1: Deleting existing hospitals index...");
    await deleteHospitalsIndex();
    
    console.log("Step 2: Creating new hospitals index...");
    await createHospitalIndex();
    
    console.log("Step 3: Bulk indexing hospitals...");
    await bulkIndex();
        
    console.log("✅ Reindexing process completed successfully!");
  } catch (error) {
    console.error("❌ Error during reindexing process:");
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);
    throw error; // 상위로 에러를 전파
  }
}

async function reindexPharmacies(pharmacies) {
  try {
    console.log("🔄 Starting pharmacies reindexing process...");
    
    console.log("Step 1: Deleting existing pharmacies index...");
    await deletePharmaciesIndex();
    
    console.log("Step 2: Creating new pharmacies index...");
    await createPharmaciesIndex();
    
    console.log("Step 3: Bulk indexing pharmacies...");
    await bulkPharmaciesIndex(pharmacies);
    
    console.log("✅ Pharmacies reindexing process completed successfully!");
  } catch (error) {
    console.error("❌ Error during pharmacies reindexing process:");
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

async function reindexMap() {
  try {
    console.log("🔄 Starting map reindexing process...");
    
    console.log("Step 1: Deleting existing map index...");
    await deleteMapIndex();
    
    console.log("Step 2: Creating new map index...");
    await createMapIndex();
    
    console.log("Step 3: Bulk indexing map...");
    await bulkMapIndex();

    console.log("✅ Map reindexing process completed successfully!");
  } catch (error) {
    console.error("❌ Error during map reindexing process:");
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

async function reindexMapCluster() {
  try {
    console.log("🔄 클러스터 데이터 재색인 프로세스 시작...");
    
    console.log("Step 1: 기존 클러스터 인덱스 삭제...");
    await deleteMapClusterIndex();
    
    console.log("Step 2: 새로운 클러스터 인덱스 생성...");
    await createMapClusterIndex();
    
    console.log("Step 3: 클러스터 데이터 색인...");
    await bulkMapClusterIndex();

    console.log("✅ 클러스터 데이터 재색인 완료!");
  } catch (error) {
    console.error("❌ 클러스터 데이터 재색인 중 오류 발생:");
    console.error("오류 메시지:", error.message);
    console.error("스택 트레이스:", error.stack);
    throw error;
  }
}

module.exports = { 
  reindex,
  reindexPharmacies,
  reindexMap,
  reindexMapCluster
};
