const client = require('../config/elasticsearch');

async function deletePharmaciesIndex() {
  try {
    const exists = await client.indices.exists({ index: 'pharmacies' });
    if (exists) {
      await client.indices.delete({ index: 'pharmacies' });
      console.log('✅ 약국 인덱스 삭제 완료');
    }
  } catch (error) {
    console.error('❌ 약국 인덱스 삭제 실패:', error);
    throw error;
  }
}

module.exports = { deletePharmaciesIndex }; 