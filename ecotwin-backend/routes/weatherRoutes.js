const express = require("express");
const router = express.Router();

const {
  currentWeather,
  forecast,
  airQuality,
  airQualityHistory
} = require("../controllers/weatherController");

router.get("/current", currentWeather);
router.get("/forecast", forecast);
router.get("/air-quality", airQuality);
router.get("/air-quality/history", airQualityHistory);

module.exports = router;