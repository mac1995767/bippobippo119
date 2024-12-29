// src/models/Horoscope.js

const mongoose = require('mongoose');

const HoroscopeSchema = new mongoose.Schema({
  zodiac: { type: String, required: true },
  year: { type: Number, required: true },
  general_horoscope: { type: String, required: true },
  specific_horoscope: { type: String, required: true },
}, { collection: 'horoscope' }); // 컬렉션 이름 명시적으로 지정

module.exports = mongoose.model('Horoscope', HoroscopeSchema);
