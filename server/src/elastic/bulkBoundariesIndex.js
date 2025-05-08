const mongoose = require('mongoose');
const fs = require('fs');
const client = require('../config/elasticsearch');
const turf = require('@turf/turf');
const proj4 = require('proj4');

const BATCH_SIZE = 1;
const MAX_RETRIES = 3;
const COORD_LIMIT = 4000;

proj4.defs(
  "EPSG:5186",
  "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 " +
  "+x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs"
);

// 변경 후 (Naver UTMK_NAVER ≒ EPSG:5179 정의)
proj4.defs(
  "EPSG:5179",
  "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=1 " +
  "+x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs"
);

proj4.defs("EPSG:4326", proj4.WGS84);

function isValidCoordinate(coord) {
  return (
    Array.isArray(coord) &&
    coord.length === 2 &&
    Number.isFinite(coord[0]) &&
    Number.isFinite(coord[1])
  );
}

// ✅ MultiPolygon, Polygon 모두 지원하는 좌표 변환 함수
function convertCoordinates(coordinates, type, sgguName = '') {
    const closeRing = (ring) => {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([...first]);
      }
      return ring;
    };
  
    if (type === 'Polygon') {
      return coordinates.map((ring, i) => {
        const validRing = ring.filter(isValidCoordinate);
        if (validRing.length < 4) {
          console.warn(`⚠️ [${sgguName}] Polygon ring(${i}) 유효 좌표 부족으로 제외됨`);
          return null;
        }
        const converted = validRing.map(([x, y]) => proj4("EPSG:5179", "EPSG:4326", [x, y]));
        return closeRing(converted);
      }).filter(ring => ring !== null);
    }
  

  if (type === 'MultiPolygon') {
    return coordinates.map((polygon, p) => {
      const converted = polygon.map((ring, r) => {
        const validRing = ring.filter(isValidCoordinate);
        if (validRing.length < 4) {
          console.warn(`⚠️ [${sgguName}] MultiPolygon[${p}][${r}] 유효 좌표 부족으로 제외됨`);
          return null;
        }
        return validRing.map(([x, y]) => proj4("EPSG:5179", "EPSG:4326", [x, y]));
      }).filter(ring => ring !== null);

      return converted.length > 0 ? converted : null;
    }).filter(polygon => polygon !== null);
  }

  console.warn(`❌ [${sgguName}] 알 수 없는 geometry type: ${type}`);
  return [];
}

async function bulkBoundariesIndex() {
  try {
    let SgguBoundary;
    try {
      SgguBoundary = mongoose.model('SgguBoundary');
    } catch {
      SgguBoundary = mongoose.model('SgguBoundary', new mongoose.Schema({}, { strict: false }), 'sggu_boundaries');
    }

    const documents = await SgguBoundary.find({}).lean();
    console.log(`총 ${documents.length}개의 문서를 색인합니다.`);

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const doc = documents[i];
      const { SGG_NM } = doc.properties || {};

      if (!doc.geometry || !['Polygon', 'MultiPolygon'].includes(doc.geometry.type)) {
        if (i % 100 === 0) console.log(`[${i}/${documents.length}] 진행 중...`);
        console.warn(`❌ [${SGG_NM}] 잘못된 geometry type: ${doc.geometry?.type}`);
        continue;
      }

      if (!Array.isArray(doc.geometry.coordinates) || doc.geometry.coordinates.length === 0) {
        if (i % 100 === 0) console.log(`[${i}/${documents.length}] 진행 중...`);
        console.warn(`❌ [${SGG_NM}] geometry.coordinates가 비어 있음`);
        continue;
      }

      const coordsCount = doc.geometry.coordinates.flat(Infinity).length;
      if (coordsCount > COORD_LIMIT) {
        if (i % 100 === 0) console.log(`[${i}/${documents.length}] 진행 중...`);
        console.warn(`⚠️ [${SGG_NM}] 좌표 수 ${coordsCount}개로 매우 큽니다`);
      }

      try {
        doc.geometry.coordinates = convertCoordinates(doc.geometry.coordinates, doc.geometry.type, SGG_NM);
      } catch (err) {
        fs.appendFileSync('failed_sggu.log', `[변환실패] ${SGG_NM}\n`);
        console.warn(`❌ [${SGG_NM}] 좌표 변환 실패:`, err);
        continue;
      }

      const body = [
        { index: { _index: 'sggu-boundaries' } },
        {
          type: doc.type,
          properties: {
            ADM_SECT_C: doc.properties.ADM_SECT_C,
            SGG_NM,
            SGG_OID: doc.properties.SGG_OID,
            COL_ADM_SE: doc.properties.COL_ADM_SE
          },
          geometry: doc.geometry
        }
      ];

      let success = false;
      for (let attempt = 1; attempt <= MAX_RETRIES && !success; attempt++) {
        try {
          const response = await client.bulk(
            {
              refresh: true,
              body,
              timeout: '5m',
              wait_for_active_shards: 1
            },
            {
              requestTimeout: 160000
            }
          );

          if (response.errors) {
            const erroredItems = response.items.filter(item => item.index && item.index.error);
            if (erroredItems.length > 0) {
              fs.appendFileSync('failed_sggu.log', `[색인실패] ${SGG_NM}\n`);
              console.error(`❌ 색인 실패 (${SGG_NM}):`, erroredItems[0]);
            }
          }

          if ((i + 1) % 100 === 0 || i === documents.length - 1) {
            console.log(`✅ ${i + 1}/${documents.length} 문서 색인 완료 (${SGG_NM})`);
          }
          success = true;
        } catch (err) {
          if (attempt === MAX_RETRIES) {
            fs.appendFileSync('failed_sggu.log', `[최종실패] ${SGG_NM}\n`);
            console.error(`❌ 색인 실패: ${SGG_NM}`, err);
          }
          await new Promise(res => setTimeout(res, 2000));
        }
      }
    }

    try {
      const countResponse = await client.count({ index: 'sggu-boundaries' });
      const count = countResponse.body ? countResponse.body.count : countResponse.count;
      console.log(`Elasticsearch 색인된 문서 수: ${count}`);
    } catch (error) {
      console.error('문서 개수 확인 중 오류:', error);
    }

  } catch (error) {
    console.error('전체 벌크 색인 중 오류:', error);
    throw error;
  }
}

module.exports = { bulkBoundariesIndex }; 