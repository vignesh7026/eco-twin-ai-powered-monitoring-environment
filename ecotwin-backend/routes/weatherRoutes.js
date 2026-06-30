const express = require("express");
const router = express.Router();

const {
  currentWeather,
  forecast,
  airQuality
} = require("../controllers/weatherController");

router.get("/current", currentWeather);
router.get("/forecast", forecast);
router.get("/air-quality", airQuality);

module.exports = router;