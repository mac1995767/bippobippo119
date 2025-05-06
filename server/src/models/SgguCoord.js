const mongoose = require('mongoose');

const SgguCoordSchema = new mongoose.Schema({
  sidoNm: String,
  sgguNm: String,
  emdongNm: String,
  riNm: String,
  YPos: Number,
  XPos: Number,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
}, { collection: 'sggu_coords' });

// 지리공간 인덱스 생성
SgguCoordSchema.index({ location: '2dsphere' });

// 저장 전에 location 필드 설정
SgguCoordSchema.pre('save', function(next) {
  if (this.isModified('XPos') || this.isModified('YPos')) {
    this.location = {
      type: 'Point',
      coordinates: [this.XPos, this.YPos]
    };
  }
  next();
});

module.exports = mongoose.model('SgguCoord', SgguCoordSchema); 