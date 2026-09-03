const Reading = require("../models/Reading");
const Alert = require("../models/Alert");
const { getCurrentWeather, getAirQuality } = require("../services/openWeatherService");

const CITY = { lat: 12.9716, lon: 77.5946 };

function riskLevelFromPm25(pm25) {
  if (pm25 == null) return "Unknown";
  if (pm25 <= 12) return "Low";
  if (pm25 <= 35.4) return "Moderate";
  if (pm25 <= 55.4) return "High";
  return "Severe";
}

exports.getDashboardData = async (req, res) => {
  try {
    const [activeSensors, activeAlerts, latestReading] = await Promise.all([
      Reading.countDocuments(),
      Alert.countDocuments(),
      Reading.findOne().sort({ timestamp: -1 }).lean(),
    ]);

    let avgTemperature = latestReading?.temp_c ?? null;
    let pm25 = latestReading?.pm2_5 ?? null;

    if (avgTemperature == null || pm25 == null) {
      // Reading collection is empty/sparse — fall back to a live lookup
      // so the dashboard doesn't show nothing at all.
      const [weather, airQuality] = await Promise.all([
        getCurrentWeather(CITY),
        getAirQuality(CITY),
      ]);
      avgTemperature = avgTemperature ?? weather.main?.temp ?? null;
      pm25 = pm25 ?? airQuality.list?.[0]?.components?.pm2_5 ?? null;
    }

    res.json({
      success: true,
      data: {
        activeSensors,
        activeAlerts,
        avgTemperature,
        pm25,
        riskLevel: riskLevelFromPm25(pm25),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
