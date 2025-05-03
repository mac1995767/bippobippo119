const mongoose = require('mongoose');
const client = require('../config/elasticsearch');
const Hospital = require('../models/hospital');
const Pharmacy = require('../models/pharmacy');
// const Facility = require('../models/facility'); // 시설 모델이 있다면 주석 해제

const BATCH_SIZE = 500;

function docFromModel(doc, type, latField, lonField) {
  // 모든 필드를 복사
  const base = Object.entries(doc.toObject ? doc.toObject() : doc).reduce((acc, [k, v]) => {
    if (k !== latField && k !== lonField) acc[k] = v;
    return acc;
  }, {});
  // type, location 필드 추가
  return {
    ...base,
    type,
    location: (doc[latField] && doc[lonField]) ? { lat: doc[latField], lon: doc[lonField] } : null
  };
}

async function bulkMapIndex() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // 병원 데이터
  const hospitals = await Hospital.find({ YPos: { $exists: true }, XPos: { $exists: true } });
  // 약국 데이터
  const pharmacies = await Pharmacy.find({ Ypos: { $exists: true }, Xpos: { $exists: true } });
  // 시설 데이터도 필요하다면 아래 주석 해제
  // const facilities = await Facility.find({ lat: { $exists: true }, lon: { $exists: true } });

  const allDocs = [
    ...hospitals.map(h => docFromModel(h, 'hospital', 'YPos', 'XPos')),
    ...pharmacies.map(p => docFromModel(p, 'pharmacy', 'Ypos', 'Xpos')),
    // ...facilities.map(f => docFromModel(f, 'facility', 'lat', 'lon'))
  ];

  for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
    const chunk = allDocs.slice(i, i + BATCH_SIZE);
    const body = chunk.flatMap(doc => [{ index: { _index: 'map_data' } }, doc]);
    await client.bulk({ refresh: true, body });
    console.log(`✅ ${i + chunk.length}개 색인 완료`);
  }

  await mongoose.disconnect();
  console.log('✅ 모든 지도 데이터 색인 완료');
}

module.exports = { bulkMapIndex };
