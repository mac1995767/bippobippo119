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

  console.log('1. 데이터 로드 시작...');
  // 병원 데이터
  const hospitals = await Hospital.find({});
  // 약국 데이터
  const pharmacies = await Pharmacy.find({});
  // 시설 데이터도 필요하다면 아래 주석 해제
  // const facilities = await Facility.find({});

  console.log('총 병원 수:', hospitals.length);
  console.log('총 약국 수:', pharmacies.length);

  console.log('2. 위치 기반 그룹화 시작...');
  // 위치 기반으로 데이터 그룹화
  const locationGroups = new Map();

  // 병원 데이터 처리
  hospitals.forEach(h => {
    const key = `${h.YPos}_${h.XPos}`;
    if (!locationGroups.has(key)) {
      locationGroups.set(key, {
        location: { lat: h.YPos, lon: h.XPos },
        markers: []
      });
    }
    locationGroups.get(key).markers.push({
      type: 'hospital',
      data: h
    });
  });

  // 약국 데이터 처리
  pharmacies.forEach(p => {
    const key = `${p.Ypos}_${p.Xpos}`;
    if (!locationGroups.has(key)) {
      locationGroups.set(key, {
        location: { lat: p.Ypos, lon: p.Xpos },
        markers: []
      });
    }
    locationGroups.get(key).markers.push({
      type: 'pharmacy',
      data: p
    });
  });

  console.log('총 그룹 수:', locationGroups.size);

  console.log('3. Elasticsearch 문서 변환 시작...');
  // 그룹화된 데이터를 Elasticsearch 문서로 변환
  const allDocs = [];
  locationGroups.forEach((group, key) => {
    const totalCount = group.markers.length;
    
    // 같은 위치에 2개 이상의 마커가 있는 경우 클러스터링
    if (totalCount > 1) {
      const hospitalDetails = group.markers
        .filter(m => m.type === 'hospital')
        .map(m => ({
          type: 'hospital',
          name: m.data.name,
          yadmNm: m.data.yadmNm,
          addr: m.data.addr,
          telno: m.data.telno,
          clCd: m.data.clCd,
          clCdNm: m.data.clCdNm,
          cmdcGdrCnt: m.data.cmdcGdrCnt,
          cmdcIntnCnt: m.data.cmdcIntnCnt,
          cmdcResdntCnt: m.data.cmdcResdntCnt,
          cmdcSdrCnt: m.data.cmdcSdrCnt,
          detyGdrCnt: m.data.detyGdrCnt,
          detyIntnCnt: m.data.detyIntnCnt,
          detyResdntCnt: m.data.detyResdntCnt,
          detySdrCnt: m.data.detySdrCnt,
          drTotCnt: m.data.drTotCnt,
          emdongNm: m.data.emdongNm,
          estbDd: m.data.estbDd,
          hospUrl: m.data.hospUrl,
          mdeptGdrCnt: m.data.mdeptGdrCnt,
          mdeptIntnCnt: m.data.mdeptIntnCnt,
          mdeptResdntCnt: m.data.mdeptResdntCnt,
          mdeptSdrCnt: m.data.mdeptSdrCnt,
          pnursCnt: m.data.pnursCnt,
          postNo: m.data.postNo,
          sgguCd: m.data.sgguCd,
          sgguCdNm: m.data.sgguCdNm,
          sidoCd: m.data.sidoCd,
          sidoCdNm: m.data.sidoCdNm,
          ykiho: m.data.ykiho
        }));

      const pharmacyDetails = group.markers
        .filter(m => m.type === 'pharmacy')
        .map(m => ({
          type: 'pharmacy',
          ykiho: m.data.ykiho,
          yadmNm: m.data.yadmNm,
          clCd: m.data.clCd,
          clCdNm: m.data.clCdNm,
          sidoCd: m.data.sidoCd,
          sidoCdNm: m.data.sidoCdNm,
          sgguCd: m.data.sgguCd,
          sgguCdNm: m.data.sgguCdNm,
          emdongNm: m.data.emdongNm,
          postNo: m.data.postNo,
          addr: m.data.addr,
          telno: m.data.telno,
          estbDd: m.data.estbDd
        }));

      allDocs.push({
        type: 'cluster',
        location: group.location,
        clusterId: key,
        clusterCount: totalCount,
        isClustered: true,
        hospitals: hospitalDetails,
        pharmacies: pharmacyDetails,
        hospitalCount: hospitalDetails.length,
        pharmacyCount: pharmacyDetails.length,
        details: {
          hospitals: hospitalDetails,
          pharmacies: pharmacyDetails
        }
      });
    } else {
      // 단일 마커인 경우
      const marker = group.markers[0];
      if (marker.type === 'hospital') {
        const h = marker.data;
        allDocs.push({
          type: 'hospital',
          name: h.name,
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
          location: group.location,
          isClustered: false
        });
      } else {
        const p = marker.data;
        allDocs.push({
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
          location: group.location,
          isClustered: false
        });
      }
    }
  });

  console.log('색인할 총 문서 수:', allDocs.length);
  console.log('클러스터 수:', allDocs.filter(doc => doc.isClustered).length);
  console.log('단일 마커 수:', allDocs.filter(doc => !doc.isClustered).length);

  console.log('4. Elasticsearch 색인 시작...');
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
