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

module.exports = { 
  reindex,
  reindexPharmacies,
  reindexMap
};
