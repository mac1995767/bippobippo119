const mongoose = require('mongoose');
const fs = require('fs');
const client = require('../config/elasticsearch');
const proj4 = require('proj4');

const BATCH_SIZE = 1;
const MAX_RETRIES = 3;
const COORD_LIMIT = 4000;

// EPSG:5186 정의 (원천 데이터 CRS)
proj4.defs(
  'EPSG:5186',
  '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 ' +
    '+x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs'
);
// WGS84
proj4.defs('EPSG:4326', proj4.WGS84);

function isValidCoordinate(coord) {
  return Array.isArray(coord)
    && coord.length === 2
    && Number.isFinite(coord[0])
    && Number.isFinite(coord[1]);
}

/**
 * 좌표 변환: raw EPSG:5186 [X, Y] -> WGS84 [lon, lat] + Naver Maps 오프셋
 */
function transform5186Point([x, y]) {
  // EPSG:5186 -> EPSG:4326
  let [lon, lat] = proj4('EPSG:5186', 'EPSG:4326', [x, y]);
  // 클라이언트 측에서 적용하던 경험적 보정값 사용
  lon += 0.0030;
  lat -= 0.904;
  return [lon, lat];
}

// GeoJSON Polygon/MultiPolygon 변환
function convertCoordinates(coords, type, name = '') {
  const closeRing = ring => {
    const [first, last] = [ring[0], ring[ring.length - 1]];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([...first]);
    }
    return ring;
  };

  if (type === 'Polygon') {
    return coords
      .map((ring, idx) => {
        const valid = ring.filter(isValidCoordinate);
        if (valid.length < 4) {
          console.warn(`⚠️ [${name}] Polygon ring(${idx}) 유효 좌표 부족`);
          return null;
        }
        const conv = valid.map(transform5186Point);
        return closeRing(conv);
      })
      .filter(r => r);
  }

  if (type === 'MultiPolygon') {
    return coords
      .map((poly, pIdx) => {
        const convPoly = poly
          .map((ring, rIdx) => {
            const valid = ring.filter(isValidCoordinate);
            if (valid.length < 4) {
              console.warn(`⚠️ [${name}] MultiPolygon[${pIdx}][${rIdx}] 유효 좌표 부족`);
              return null;
            }
            return valid.map(transform5186Point);
          })
          .filter(r => r);
        return convPoly.length ? convPoly : null;
      })
      .filter(p => p);
  }

  console.warn(`❌ [${name}] 알 수 없는 geometry type: ${type}`);
  return [];
}

async function bulkBoundariesIndex() {
  let Model;
  try {
    Model = mongoose.model('SgguBoundary');
  } catch {
    Model = mongoose.model(
      'SgguBoundary',
      new mongoose.Schema({}, { strict: false }),
      'sggu_boundaries'
    );
  }

  const docs = await Model.find({}).lean();
  console.log(`총 ${docs.length}개 문서 색인 시작`);

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const doc = docs[i];
    const name = doc.properties?.SGG_NM || 'unknown';
    const geom = doc.geometry;

    if (!geom || !['Polygon', 'MultiPolygon'].includes(geom.type)) {
      console.warn(`❌ [${name}] geometry type 문제: ${geom?.type}`);
      continue;
    }

    if (!Array.isArray(geom.coordinates) || !geom.coordinates.length) {
      console.warn(`❌ [${name}] 빈 coordinates`);
      continue;
    }

    const coordCount = geom.coordinates.flat(Infinity).length;
    if (coordCount > COORD_LIMIT) {
      console.warn(`⚠️ [${name}] 좌표 수 많음 (${coordCount})`);
    }

    try {
      doc.geometry.coordinates = convertCoordinates(
        geom.coordinates,
        geom.type,
        name
      );
    } catch (e) {
      fs.appendFileSync('failed_sggu.log', `[변환실패] ${name}\n`);
      console.warn(`❌ [${name}] 변환 실패`, e);
      continue;
    }

    const bulkBody = [
      { index: { _index: 'sggu-boundaries' } },
      {
        type: doc.type,
        properties: {
          ADM_SECT_C: doc.properties.ADM_SECT_C,
          SGG_NM: name,
          SGG_OID: doc.properties.SGG_OID,
          COL_ADM_SE: doc.properties.COL_ADM_SE
        },
        geometry: doc.geometry
      }
    ];

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES && !success; attempt++) {
      try {
        const res = await client.bulk({ body: bulkBody, refresh: true });
        if (res.errors) {
          const errItem = res.items.find(i => i.index?.error);
          fs.appendFileSync('failed_sggu.log', `[색인실패] ${name}\n`);
          console.error(`❌ [${name}] 색인 에러:`, JSON.stringify(errItem.index.error, null, 2));
          console.error('전송된 데이터:', JSON.stringify(bulkBody[1], null, 2));
        } else {
          if ((i + 1) % 100 === 0 || i === docs.length - 1) {
            console.log(`✅ ${i+1}/${docs.length} 색인 완료 (${name})`);
          }
        }
        success = true;
      } catch (err) {
        if (attempt === MAX_RETRIES) {
          fs.appendFileSync('failed_sggu.log', `[최종실패] ${name}\n`);
          console.error(`❌ [${name}] 색인 최종 실패`, err);
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
  }

  try {
    const countRes = await client.count({ index: 'sggu-boundaries' });
    console.log(`총 색인 문서 수: ${countRes.count || countRes.body.count}`);
  } catch (e) {
    console.error('카운트 에러', e);
  }
}

// 시도 경계 색인
async function bulkCtpBoundariesIndex() {
  let Model;
  try {
    Model = mongoose.model('CtpBoundary');
  } catch {
    Model = mongoose.model(
      'CtpBoundary',
      new mongoose.Schema({}, { strict: false }),
      'sggu_boundaries_ctprvn'
    );
  }

  const docs = await Model.find({}).lean();
  console.log(`시도 경계 총 ${docs.length}개 문서 색인 시작`);

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const doc = docs[i];
    const name = doc.properties?.CTP_KOR_NM || 'unknown';
    const geom = doc.geometry;

    if (!geom || !['Polygon', 'MultiPolygon'].includes(geom.type)) {
      console.warn(`❌ [${name}] geometry type 문제: ${geom?.type}`);
      continue;
    }

    try {
      doc.geometry.coordinates = convertCoordinates(
        geom.coordinates,
        geom.type,
        name
      );
    } catch (e) {
      fs.appendFileSync('failed_ctp.log', `[변환실패] ${name}\n`);
      console.warn(`❌ [${name}] 변환 실패`, e);
      continue;
    }

    const bulkBody = [
      { index: { _index: 'ctp-boundaries' } },
      {
        type: doc.type,
        properties: {
          CTPRVN_CD: doc.properties.CTPRVN_CD,
          CTP_KOR_NM: name,
          CTP_ENG_NM: doc.properties.CTP_ENG_NM
        },
        geometry: doc.geometry
      }
    ];

    await processBulkRequest(bulkBody, name, i, docs.length, 'ctp');
  }

  await logIndexCount('ctp-boundaries');
}

// 시군구 경계 색인
async function bulkSigBoundariesIndex() {
  let Model;
  try {
    Model = mongoose.model('SigBoundary');
  } catch {
    Model = mongoose.model(
      'SigBoundary',
      new mongoose.Schema({}, { strict: false }),
      'sggu_boundaries_sig'
    );
  }

  const docs = await Model.find({}).lean();
  console.log(`시군구 경계 총 ${docs.length}개 문서 색인 시작`);

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const doc = docs[i];
    const name = doc.properties?.SIG_KOR_NM || 'unknown';
    const geom = doc.geometry;

    if (!geom || !['Polygon', 'MultiPolygon'].includes(geom.type)) {
      console.warn(`❌ [${name}] geometry type 문제: ${geom?.type}`);
      continue;
    }

    try {
      doc.geometry.coordinates = convertCoordinates(
        geom.coordinates,
        geom.type,
        name
      );
    } catch (e) {
      fs.appendFileSync('failed_sig.log', `[변환실패] ${name}\n`);
      console.warn(`❌ [${name}] 변환 실패`, e);
      continue;
    }

    const bulkBody = [
      { index: { _index: 'sig-boundaries' } },
      {
        type: doc.type,
        properties: {
          SIG_CD: doc.properties.SIG_CD,
          SIG_KOR_NM: name,
          SIG_ENG_NM: doc.properties.SIG_ENG_NM,
          CTPRVN_CD: doc.properties.CTPRVN_CD
        },
        geometry: doc.geometry
      }
    ];

    await processBulkRequest(bulkBody, name, i, docs.length, 'sig');
  }

  await logIndexCount('sig-boundaries');
}

// 읍면동 경계 색인
async function bulkEmdBoundariesIndex() {
  let Model;
  try {
    Model = mongoose.model('EmdBoundary');
  } catch {
    Model = mongoose.model(
      'EmdBoundary',
      new mongoose.Schema({}, { strict: false }),
      'sggu_boundaries_emd'
    );
  }

  const docs = await Model.find({}).lean();
  console.log(`읍면동 경계 총 ${docs.length}개 문서 색인 시작`);

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const doc = docs[i];
    const name = doc.properties?.EMD_KOR_NM || 'unknown';
    const geom = doc.geometry;

    if (!geom || !['Polygon', 'MultiPolygon'].includes(geom.type)) {
      console.warn(`❌ [${name}] geometry type 문제: ${geom?.type}`);
      continue;
    }

    try {
      doc.geometry.coordinates = convertCoordinates(
        geom.coordinates,
        geom.type,
        name
      );
    } catch (e) {
      fs.appendFileSync('failed_emd.log', `[변환실패] ${name}\n`);
      console.warn(`❌ [${name}] 변환 실패`, e);
      continue;
    }

    const bulkBody = [
      { index: { _index: 'emd-boundaries' } },
      {
        type: doc.type,
        properties: {
          EMD_CD: doc.properties.EMD_CD,
          EMD_KOR_NM: name,
          EMD_ENG_NM: doc.properties.EMD_ENG_NM,
          SIG_CD: doc.properties.SIG_CD
        },
        geometry: doc.geometry
      }
    ];

    await processBulkRequest(bulkBody, name, i, docs.length, 'emd');
  }

  await logIndexCount('emd-boundaries');
}

// 리 경계 색인
async function bulkLiBoundariesIndex() {
  let Model;
  try {
    Model = mongoose.model('LiBoundary');
  } catch {
    Model = mongoose.model(
      'LiBoundary',
      new mongoose.Schema({}, { strict: false }),
      'sggu_boundaries_li'
    );
  }

  const docs = await Model.find({}).lean();
  console.log(`리 경계 총 ${docs.length}개 문서 색인 시작`);

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const doc = docs[i];
    const name = doc.properties?.LI_KOR_NM || 'unknown';
    const geom = doc.geometry;

    if (!geom || !['Polygon', 'MultiPolygon'].includes(geom.type)) {
      console.warn(`❌ [${name}] geometry type 문제: ${geom?.type}`);
      continue;
    }

    try {
      doc.geometry.coordinates = convertCoordinates(
        geom.coordinates,
        geom.type,
        name
      );
    } catch (e) {
      fs.appendFileSync('failed_li.log', `[변환실패] ${name}\n`);
      console.warn(`❌ [${name}] 변환 실패`, e);
      continue;
    }

    const bulkBody = [
      { index: { _index: 'li-boundaries' } },
      {
        type: doc.type,
        properties: {
          LI_CD: doc.properties.LI_CD,
          LI_KOR_NM: name,
          LI_ENG_NM: doc.properties.LI_ENG_NM,
          EMD_CD: doc.properties.EMD_CD
        },
        geometry: doc.geometry
      }
    ];

    await processBulkRequest(bulkBody, name, i, docs.length, 'li');
  }

  await logIndexCount('li-boundaries');
}

// 공통 bulk 요청 처리 함수
async function processBulkRequest(bulkBody, name, index, total, type) {
  let success = false;
  for (let attempt = 1; attempt <= MAX_RETRIES && !success; attempt++) {
    try {
      const res = await client.bulk({ 
        body: bulkBody, 
        refresh: true,
        timeout: '120s',  // 120초 타임아웃
        wait_for_active_shards: 1
      });
      if (res.errors) {
        const errItem = res.items.find(i => i.index?.error);
        fs.appendFileSync(`failed_${type}.log`, `[색인실패] ${name}\n`);
        console.error(`❌ [${name}] 색인 에러:`, JSON.stringify(errItem.index.error, null, 2));
        console.error('전송된 데이터:', JSON.stringify(bulkBody[1], null, 2));
      } else {
        if ((index + 1) % 100 === 0 || index === total - 1) {
          console.log(`✅ ${index+1}/${total} 색인 완료 (${name})`);
        }
      }
      success = true;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        fs.appendFileSync(`failed_${type}.log`, `[최종실패] ${name}\n`);
        console.error(`❌ [${name}] 색인 최종 실패`, err);
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
}

// 인덱스 문서 수 로깅
async function logIndexCount(indexName) {
  try {
    const countRes = await client.count({ index: indexName });
    console.log(`${indexName} 총 색인 문서 수: ${countRes.body?.count || countRes.count || 0}`);
  } catch (e) {
    console.error(`${indexName} 카운트 에러`, e);
  }
}

// 모든 경계 데이터 색인 실행
async function indexAllBoundaries() {
  console.log('모든 경계 데이터 색인 시작...');
  
  try {
    await bulkCtpBoundariesIndex();
    await bulkSigBoundariesIndex();
    await bulkEmdBoundariesIndex();
    await bulkLiBoundariesIndex();
    console.log('모든 경계 데이터 색인 완료!');
  } catch (error) {
    console.error('경계 데이터 색인 중 오류 발생:', error);
  }
}

module.exports = { 
  bulkBoundariesIndex,
  bulkCtpBoundariesIndex,
  bulkSigBoundariesIndex,
  bulkEmdBoundariesIndex,
  bulkLiBoundariesIndex,
  indexAllBoundaries
};
