const { getCurrentWeather, getAirQuality } = require("../services/openWeatherService");
const CITIES = require("../config/cities");

exports.getDigitalTwin = async (req, res) => {
  try {
    const cityName = req.query.city || "Bengaluru";
    const cityConfig = CITIES[cityName] || CITIES.Bengaluru;
    const lat = req.query.lat || cityConfig.lat;
    const lon = req.query.lon || cityConfig.lon;

    const [weather, airQuality] = await Promise.all([
      getCurrentWeather({ lat, lon }),
      getAirQuality({ lat, lon }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        city: cityName,
        temp: weather.main?.temp ?? null,
        humidity: weather.main?.humidity ?? null,
        windSpeed: weather.wind?.speed ?? null,
        pm25: airQuality.list?.[0]?.components?.pm2_5 ?? null,
        population: cityConfig.population,
        greenCover: cityConfig.greenCover,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
    });
  }
};
