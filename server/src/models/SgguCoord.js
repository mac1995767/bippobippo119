const mongoose = require('mongoose');

const SgguCoordSchema = new mongoose.Schema({
  sidoNm: String,
  sgguNm: String,
  emdongNm: String,
  riNm: String,
  YPos: Number,
  XPos: Number
  // 기타 필요한 필드 추가 가능
}, { collection: 'sggu_coords' });

module.exports = mongoose.model('SgguCoord', SgguCoordSchema); 