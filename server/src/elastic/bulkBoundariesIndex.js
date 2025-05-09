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
          console.error(`❌ [${name}] 색인 에러:`, errItem);
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

module.exports = { bulkBoundariesIndex };
