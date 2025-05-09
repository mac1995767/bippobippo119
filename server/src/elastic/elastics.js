const { deleteHospitalsIndex } = require('./deleteIndex');
const { createHospitalIndex } = require('./createIndex');
const { bulkIndex } = require('./bulkIndex');
const { deleteHospitalDetailIndex } = require('./deleteDetailIndex');
const { createHospitalDetailIndex } = require('./createDetailIndex');
const { bulkDetailIndex } = require('./bulkDetailIndex');
const { deletePharmaciesIndex } = require('./deletePharmaciesIndex');
const { createPharmaciesIndex } = require('./createPharmaciesIndex');
const { bulkPharmaciesIndex } = require('./bulkPharmaciesIndex');
const { deleteMapIndex } = require('./deleteMapIndex');
const { createMapIndex } = require('./createMapIndex');
const { bulkMapIndex } = require('./bulkMapIndex');
const { deleteSgguCoorIndex } = require('./deleteSgguCoordIndex');
const { createSgguCoorIndex } = require('./createSgguCoorIndex');
const { bulkIndexSgguCoordinates } = require('./bulkSgguCoordIndex');
const { deleteBoundariesIndex } = require('./deleteBoundariesIndex');
const { createBoundariesIndex } = require('./createBoundariesIndex');
const { 
  bulkCtpBoundariesIndex,
  bulkSigBoundariesIndex,
  bulkEmdBoundariesIndex,
  bulkLiBoundariesIndex
} = require('./bulkBoundariesIndex');

async function reindex() {
  try {
    console.log("🔄 Starting reindexing process...");
    
    console.log("Step 1: Deleting existing hospitals index...");
    await deleteHospitalsIndex();
    
    console.log("Step 2: Creating new hospitals index...");
    await createHospitalIndex();
    
    console.log("Step 3: Bulk indexing hospitals...");
    await bulkIndex();
    

    //await deleteHospitalDetailIndex();
    //await createHospitalDetailIndex();
    //await bulkDetailIndex();
    
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

async function reindexSgguCoord() {
  try {
    console.log("🔄 Starting sggu coordinates reindexing process...");
    
    console.log("Step 1: Deleting existing sggu coordinates index...");
    await deleteSgguCoorIndex();
    
    console.log("Step 2: Creating new sggu coordinates index...");
    await createSgguCoorIndex();
    
    console.log("Step 3: Bulk indexing sggu coordinates...");
    await bulkIndexSgguCoordinates();

    console.log("✅ Sggu coordinates reindexing process completed successfully!");
  } catch (error) {
    console.error("❌ Error during sggu coordinates reindexing process:");
    console.error("Error message:", error.message);
    throw error;
  }
}

async function reindexBoundaries() {
  try {
    console.log("🔄 경계 데이터 재색인 프로세스 시작...");
    
    // 시도 경계 재색인
    console.log("\n1️⃣ 시도 경계 재색인 시작");
    console.log("Step 1: 기존 시도 경계 인덱스 삭제...");
    await deleteBoundariesIndex('ctp-boundaries');
    
    console.log("Step 2: 새로운 시도 경계 인덱스 생성...");
    await createBoundariesIndex('ctp-boundaries');
    
    console.log("Step 3: 시도 경계 데이터 색인...");
    await bulkCtpBoundariesIndex();
    
    // 시군구 경계 재색인
    /*
    console.log("\n2️⃣ 시군구 경계 재색인 시작");
    console.log("Step 1: 기존 시군구 경계 인덱스 삭제...");
    await deleteBoundariesIndex('sig-boundaries');
    
    console.log("Step 2: 새로운 시군구 경계 인덱스 생성...");
    await createBoundariesIndex('sig-boundaries');
    
    console.log("Step 3: 시군구 경계 데이터 색인...");
    await bulkSigBoundariesIndex();
    */
    
    // 읍면동 경계 재색인
    /*
    console.log("\n3️⃣ 읍면동 경계 재색인 시작");
    console.log("Step 1: 기존 읍면동 경계 인덱스 삭제...");
    await deleteBoundariesIndex('emd-boundaries');
    
    console.log("Step 2: 새로운 읍면동 경계 인덱스 생성...");
    await createBoundariesIndex('emd-boundaries');
    
    console.log("Step 3: 읍면동 경계 데이터 색인...");
    await bulkEmdBoundariesIndex();
    */
    
    // 리 경계 재색인
    /*
    console.log("\n4️⃣ 리 경계 재색인 시작");
    console.log("Step 1: 기존 리 경계 인덱스 삭제...");
    await deleteBoundariesIndex('li-boundaries');
    
    console.log("Step 2: 새로운 리 경계 인덱스 생성...");
    await createBoundariesIndex('li-boundaries');
    
    console.log("Step 3: 리 경계 데이터 색인...");
    await bulkLiBoundariesIndex();
    */
    
    console.log("\n✅ 시도 경계 데이터 재색인 완료!");
  } catch (error) {
    console.error("❌ 경계 데이터 재색인 중 오류 발생:");
    console.error("오류 메시지:", error.message);
    console.error("스택 트레이스:", error.stack);
    throw error;
  }
}

module.exports = { 
  reindex,
  reindexPharmacies,
  reindexMap,
  reindexSgguCoord,
  reindexBoundaries
};
