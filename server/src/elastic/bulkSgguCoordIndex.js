const mongoose = require("mongoose");
const client = require("../config/elasticsearch");

async function bulkIndexSgguCoordinates() {
  try {
    // 모델이 이미 존재하는지 확인
    let SgguCoord;
    try {
      SgguCoord = mongoose.model('SgguCoord');
    } catch (error) {
      // 모델이 없는 경우에만 새로 생성
      SgguCoord = mongoose.model('SgguCoord', new mongoose.Schema({}), 'sggu_coords');
    }

    const documents = await SgguCoord.find({}).lean();
    
    const operations = documents.flatMap(doc => [
      { index: { _index: 'sggu-coordinates' } },
      {
        sidoNm: doc.sidoNm,
        sgguNm: doc.sgguNm,
        emdongNm: doc.emdongNm,
        riNm: doc.riNm,
        YPos: doc.YPos,
        XPos: doc.XPos,
        location: {
          lat: doc.YPos,
          lng: doc.XPos
        }
      }
    ]);

    if (operations.length > 0) {
      const response = await client.bulk({ refresh: true, operations });
      console.log(`총 ${documents.length}개의 문서가 색인되었습니다.`);
    } else {
      console.log('색인할 문서가 없습니다.');
    }
  } catch (error) {
    console.error('벌크 색인 중 오류 발생:', error);
    throw error;
  }
}

module.exports = { bulkIndexSgguCoordinates };
