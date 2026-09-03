const {
  getCurrentWeather,
  getForecast,
  getAirQuality,
  getAirQualityHistory,
} = require("../services/openWeatherService");

exports.currentWeather = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;

    if (!(lat && lon) && !city) {
      return res.status(400).json({
        message: "Provide either lat & lon, or city",
      });
    }

    const data = await getCurrentWeather({ lat, lon, q: city });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: error.response?.data?.message || error.message,
    });
  }
};

exports.forecast = async (req, res) => {
  try {
    const { lat, lon, city, cnt } = req.query;

    if (!(lat && lon) && !city) {
      return res.status(400).json({
        message: "Provide either lat & lon, or city",
      });
    }

    const data = await getForecast({ lat, lon, q: city, cnt });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: error.response?.data?.message || error.message,
    });
  }
};

exports.airQuality = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        message: "Latitude and Longitude are required",
      });
    }

    const data = await getAirQuality({ lat, lon });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: error.response?.data?.message || error.message,
    });
  }
};

exports.airQualityHistory = async (req, res) => {
  try {
    const { lat, lon, start, end } = req.query;

    if (!lat || !lon || !start || !end) {
      return res.status(400).json({
        message: "lat, lon, start and end are required",
      });
    }

    const data = await getAirQualityHistory({ lat, lon, start, end });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: error.response?.data?.message || error.message,
    });
  }
};
