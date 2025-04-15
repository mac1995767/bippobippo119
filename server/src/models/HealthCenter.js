const mongoose = require('mongoose');

const healthCenterSchema = new mongoose.Schema({
  yadmNm: { type: String, required: true }, // 건강증진센터명
  clCdNm: { type: String, required: true }, // 건강증진센터구분
  addr: { type: String, required: true }, // 소재지도로명주소
  jibunAddr: { type: String }, // 소재지지번주소
  YPos: { type: Number, required: true }, // 위도
  XPos: { type: Number, required: true }, // 경도
  bizCont: { type: String }, // 건강증진업무내용
  startTime: { type: String }, // 운영시작시각
  endTime: { type: String }, // 운영종료시각
  holidayInfo: { type: String }, // 휴무일정보
  buildingArea: { type: Number }, // 건물면적
  drTotCnt: { type: Number, default: 0 }, // 의사수
  pnursCnt: { type: Number, default: 0 }, // 간호사수
  socialWorkerCnt: { type: Number, default: 0 }, // 사회복지사수
  nutritionistCnt: { type: Number, default: 0 }, // 영양사수
  etcPersonnelStatus: { type: String }, // 기타인력현황
  etcUseInfo: { type: String }, // 기타이용안내
  telno: { type: String }, // 운영기관전화번호
  operOrgNm: { type: String }, // 운영기관명
  mgrTelno: { type: String }, // 관리기관전화번호
  mgrOrgNm: { type: String }, // 관리기관명
  dataStdDt: { type: Date }, // 데이터기준일자
  providerCd: { type: String }, // 시도코드
  providerNm: { type: String }, // 시도명
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'hospital_healthcenter' });

module.exports = mongoose.model('HealthCenter', healthCenterSchema); 