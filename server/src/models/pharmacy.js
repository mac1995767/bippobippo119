const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  ykiho: { type: String, required: true, unique: true },
  yadmNm: { type: String, required: true },
  clCd: { type: String },
  clCdNm: { type: String },
  sidoCd: { type: String },
  sidoCdNm: { type: String },
  sgguCd: { type: String },
  sgguCdNm: { type: String },
  emdongNm: { type: String },
  postNo: { type: String },
  addr: { type: String },
  telno: { type: String },
  estbDd: { type: String },
  Xpos: { type: Number },
  Ypos: { type: Number }
}, {
  timestamps: true
});

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

module.exports = Pharmacy; 