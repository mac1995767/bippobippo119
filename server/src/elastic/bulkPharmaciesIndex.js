const client = require('../config/elasticsearch');
const mongoose = require('mongoose');
const Pharmacy = require('../models/pharmacy');

const BULK_SIZE = 1000;

async function bulkPharmaciesIndex() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 연결 성공');

    // 약국 데이터 조회
    const pharmacies = await Pharmacy.find({});
    console.log(`✅ 약국 데이터 조회 완료: ${pharmacies.length}개`);

    if (!pharmacies || pharmacies.length === 0) {
      throw new Error('약국 데이터가 없습니다.');
    }

    // 청크로 나누어 처리
    for (let i = 0; i < pharmacies.length; i += BULK_SIZE) {
      const chunk = pharmacies.slice(i, i + BULK_SIZE);
      const body = chunk.flatMap(pharmacy => [
        { index: { _index: 'pharmacies' } },
        {
          ykiho: pharmacy.ykiho,
          yadmNm: pharmacy.yadmNm,
          clCd: pharmacy.clCd,
          clCdNm: pharmacy.clCdNm,
          sidoCd: pharmacy.sidoCd,
          sidoCdNm: pharmacy.sidoCdNm,
          sgguCd: pharmacy.sgguCd,
          sgguCdNm: pharmacy.sgguCdNm,
          emdongNm: pharmacy.emdongNm,
          postNo: pharmacy.postNo,
          addr: pharmacy.addr,
          telno: pharmacy.telno,
          estbDd: pharmacy.estbDd,
          location: {
            lat: pharmacy.Ypos,
            lon: pharmacy.Xpos
          }
        }
      ]);

      try {
        const response = await client.bulk({ refresh: true, body });
        
        if (response && response.body) {
          if (response.body.errors) {
            const erroredItems = response.body.items.filter(item => item.index && item.index.error);
            console.error(`❌ ${erroredItems.length}개의 문서 색인 실패`);
            erroredItems.forEach(item => {
              console.error(`  - 오류: ${item.index.error.reason}`);
            });
          }
          console.log(`✅ 청크 ${i / BULK_SIZE + 1} 색인 완료: ${chunk.length}개`);
        } else {
          console.error('❌ Elasticsearch 응답이 비어있습니다.');
        }
      } catch (bulkError) {
        console.error('❌ Bulk 요청 중 오류 발생:', bulkError);
        continue;
      }
    }

    console.log('✅ 모든 약국 데이터 색인 완료');
  } catch (error) {
    console.error('❌ 색인 오류:', error);
    throw error;
  } finally {
    // MongoDB 연결 종료
    await mongoose.disconnect();
    console.log('✅ MongoDB 연결 종료');
  }
}

module.exports = { bulkPharmaciesIndex }; 