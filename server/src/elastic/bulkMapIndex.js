const mongoose = require('mongoose');
const client = require('../config/elasticsearch');
const { Hospital } = require('../models/hospital');
const { Pharmacy } = require('../models/pharmacy');
// const { Facility } = require('../models/facility'); // 시설 모델이 있다면 주석 해제

console.log('Hospital:', Hospital);
console.log('Pharmacy:', Pharmacy);

const BATCH_SIZE = 500;

async function bulkMapIndex() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // 병원 데이터
  const hospitals = await Hospital.find({});
  // 약국 데이터
  const pharmacies = await Pharmacy.find({});
  // 시설 데이터도 필요하다면 아래 주석 해제
  // const facilities = await Facility.find({});

  const allDocs = [
    ...hospitals.map(h => {
      const doc = {
        type: 'hospital',
        name: h.name,
        address: h.address,
        yadmNm: h.yadmNm,
        addr: h.addr,
        telno: h.telno,
        clCd: h.clCd,
        clCdNm: h.clCdNm,
        cmdcGdrCnt: h.cmdcGdrCnt,
        cmdcIntnCnt: h.cmdcIntnCnt,
        cmdcResdntCnt: h.cmdcResdntCnt,
        cmdcSdrCnt: h.cmdcSdrCnt,
        detyGdrCnt: h.detyGdrCnt,
        detyIntnCnt: h.detyIntnCnt,
        detyResdntCnt: h.detyResdntCnt,
        detySdrCnt: h.detySdrCnt,
        drTotCnt: h.drTotCnt,
        emdongNm: h.emdongNm,
        estbDd: h.estbDd,
        hospUrl: h.hospUrl,
        mdeptGdrCnt: h.mdeptGdrCnt,
        mdeptIntnCnt: h.mdeptIntnCnt,
        mdeptResdntCnt: h.mdeptResdntCnt,
        mdeptSdrCnt: h.mdeptSdrCnt,
        pnursCnt: h.pnursCnt,
        postNo: h.postNo,
        sgguCd: h.sgguCd,
        sgguCdNm: h.sgguCdNm,
        sidoCd: h.sidoCd,
        sidoCdNm: h.sidoCdNm,
        ykiho: h.ykiho,
        updatedAt: h.updatedAt,
        createdAt: h.createdAt,
        // ... 기타 필요한 필드
      };
      if (h.YPos != null && h.XPos != null) {
        doc.location = { lat: h.YPos, lon: h.XPos };
      }
      return doc;
    }),
    ...pharmacies.map(p => {
      const doc = {
        type: 'pharmacy',
        ykiho: p.ykiho,
        yadmNm: p.yadmNm,
        clCd: p.clCd,
        clCdNm: p.clCdNm,
        sidoCd: p.sidoCd,
        sidoCdNm: p.sidoCdNm,
        sgguCd: p.sgguCd,
        sgguCdNm: p.sgguCdNm,
        emdongNm: p.emdongNm,
        postNo: p.postNo,
        addr: p.addr,
        telno: p.telno,
        estbDd: p.estbDd,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        // ... 기타 필요한 필드
      };
      if (p.Ypos != null && p.Xpos != null) {
        doc.location = { lat: p.Ypos, lon: p.Xpos };
      }
      return doc;
    })
    // ...facilities.map(f => {
    //   const doc = { ... };
    //   if (f.lat != null && f.lon != null) doc.location = { lat: f.lat, lon: f.lon };
    //   return doc;
    // })
  ];

  console.log('색인할 총 문서 수:', allDocs.length);
  console.log('샘플 문서:', allDocs.slice(0, 2));

  for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
    const chunk = allDocs.slice(i, i + BATCH_SIZE);
    const body = chunk.flatMap(doc => [{ index: { _index: 'map_data' } }, doc]);
    const response = await client.bulk({ refresh: true, body });
    if (response.body && response.body.errors) {
      const erroredItems = response.body.items.filter(item => item.index && item.index.error);
      if (erroredItems.length > 0) {
        console.error('첫 번째 색인 실패 문서:', erroredItems[0]);
      }
      console.error(`❌ ${erroredItems.length}개 문서 색인 실패`);
      erroredItems.forEach(item => {
        console.error(`  - 오류: ${item.index.error.reason}`);
      });
    }
    console.log(`✅ ${i + chunk.length}개 색인 완료`);
  }

  // 색인 후 실제 문서 개수 조회 (응답 구조에 따라 안전하게 처리)
  try {
    const countResp = await client.count({ index: 'map_data' });
    console.log('countResp:', countResp);
    const count = countResp.body ? countResp.body.count : countResp.count;
    console.log('Elasticsearch map_data 문서 개수:', count);
  } catch (err) {
    console.error('count API 호출 중 오류:', err);
  }

  await mongoose.disconnect();
  console.log('✅ 모든 지도 데이터 색인 완료');
}

module.exports = { bulkMapIndex };
