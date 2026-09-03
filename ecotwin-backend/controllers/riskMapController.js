const { getCurrentWeather, getAirQuality } = require("../services/openWeatherService");
const CITIES = require("../config/cities");

function riskLevelFromPm25(pm25) {
  if (pm25 == null) return "Unknown";
  if (pm25 <= 12) return "Low";
  if (pm25 <= 35.4) return "Moderate";
  if (pm25 <= 55.4) return "High";
  return "Severe";
}

exports.getCities = async (req, res) => {
  try {
    const cityNames = Object.keys(CITIES);

    const results = await Promise.all(
      cityNames.map(async (city) => {
        const { lat, lon, population } = CITIES[city];
        try {
          const [weather, airQuality] = await Promise.all([
            getCurrentWeather({ lat, lon }),
            getAirQuality({ lat, lon }),
          ]);
          const pm25 = airQuality.list?.[0]?.components?.pm2_5 ?? null;

          return {
            city,
            lat,
            lon,
            population,
            temp: weather.main?.temp ?? null,
            humidity: weather.main?.humidity ?? null,
            weatherMain: weather.weather?.[0]?.main ?? null,
            pm25,
            riskLevel: riskLevelFromPm25(pm25),
          };
        } catch (cityError) {
          return {
            city,
            lat,
            lon,
            population,
            error: cityError.response?.data?.message || cityError.message,
          };
        }
      })
    );

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
    });
  }
};
