// models/Reading.js — Mongoose schema for historical environmental readings.
// Place in ecotwin-backend/models/Reading.js (or wherever your other
// Mongoose models live, matching your existing connectDB.js setup).

const mongoose = require("mongoose");

const readingSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  pm2_5: Number,
  pm10: Number,
  co: Number,
  no2: Number,
  o3: Number,
  so2: Number,
  aqi_category: Number,      // OpenWeatherMap's 1-5 scale
  temp_c: Number,
  humidity: Number,
  wind_speed: Number,
  rain_1h: { type: Number, default: 0 },
  weather_condition: String,
});

module.exports = mongoose.model("Reading", readingSchema);