// src/models/Horoscope.js

const mongoose = require('mongoose');

const horoscopeSchema = new mongoose.Schema({
  title: String,
  link: String,
  content: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Horoscope', horoscopeSchema);