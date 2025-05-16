// server/src/elastic/createIndex.js
const client = require('../config/elasticsearch'); // ✅ 클라이언트 가져오기

async function createHospitalIndex() {
  try {
    // 인덱스 존재 여부 확인
    const exists = await client.indices.exists({ index: 'hospitals' });
    if (exists.body) {
      console.log("기존 인덱스 'hospitals' 삭제 중...");
      await client.indices.delete({ index: 'hospitals' });
      console.log("기존 인덱스 'hospitals' 삭제 완료!");
    }

    // 인덱스 생성
    await client.indices.create({
      index: 'hospitals',
      body: {
        mappings: {
          properties: {
            yadmNm: { type: 'text' },
            addr: { type: 'text' },
            region: { type: 'keyword' },
            subject: { type: 'text' },
            major: { type: 'keyword' },
            location: { type: "geo_point" },
            hospUrl: { type: "text" },
            telno: { type: "text" },
            times: {
              type: "object",
              dynamic: true,
              properties: {
                trmtMonStart: { type: "text" },
                trmtMonEnd: { type: "text" },
                trmtTueStart: { type: "text" },
                trmtTueEnd: { type: "text" },
                trmtWedStart: { type: "text" },
                trmtWedEnd: { type: "text" },
                trmtThuStart: { type: "text" },
                trmtThuEnd: { type: "text" },
                trmtFriStart: { type: "text" },
                trmtFriEnd: { type: "text" },
                trmtSatStart: { type: "text" },
                trmtSatEnd: { type: "text" },
                lunchWeek: { type: "text" },
                rcvWeek: { type: "text" },
                rcvSat: { type: "text" },
                emyNgtYn: { type: "text" },
                noTrmtSat: { type: "text" },
                noTrmtSun: { type: "text" },
                emyDayTelNo1: { type: "text" },
                emyDayTelNo2: { type: "text" },
                emyDayYn: { type: "text" },
                emyNgtTelNo1: { type: "text" },
                emyNgtTelNo2: { type: "text" },
                noTrmtHoli: { type: "text" },
                parkEtc: { type: "text" },
                parkQty: { type: "integer" },
                parkXpnsYn: { type: "text" },
                plcDir: { type: "text" },
                plcDist: { type: "text" },
                plcNm: { type: "text" }
              }
            },
            equipment: {
              type: "nested",
              properties: {
                typeCd: { type: "text" },
                typeCdNm: { type: "text" },
                typeCnt: { type: "text" }
              }
            },
            food_treatment: {
              type: "nested",
              properties: {
                typeCd: { type: "text" },
                typeCdNm: { type: "text" },
                genMealAddYn: { type: "text" },
                psnlCnt: { type: "text" }
              }
            },
            intensive_care: {
              type: "nested",
              properties: {
                typeCd: { type: "text" },
                typeCdNm: { type: "text" }
              }
            },
            nursing_grade: {
              type: "nested",
              properties: {
                typeCd: { type: "text" },
                typeCdNm: { type: "text" },
                nursingRt: { type: "text" }
              }
            },
            personnel: {
              type: "nested",
              properties: {
                pharmCd: { type: "text" },
                pharmCdNm: { type: "text" },
                pharmCnt: { type: "text" }
              }
            },
            speciality: {
              type: "nested",
              properties: {
                typeCd: { type: "text" },
                typeCdNm: { type: "text" }
              }
            }
          }
        }
      }
    });

    console.log("인덱스 'hospitals' 생성 완료!");
  } catch (error) {
    console.error("인덱스 생성 오류:", error.meta ? error.meta.body.error : error);
  }
}

module.exports = { createHospitalIndex } ;
