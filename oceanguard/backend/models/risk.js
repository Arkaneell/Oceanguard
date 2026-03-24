const mongoose = require('mongoose');

const riskSchema = new mongoose.Schema({
  image_url: String,
  description: String,
  location: {
    lat: Number,
    lng: Number,
    label: String
  },
  risk_score: Number,
  risk_level: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Risk', riskSchema);