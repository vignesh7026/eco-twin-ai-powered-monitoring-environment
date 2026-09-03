// openWeatherService.js — single place that talks to OpenWeatherMap.
// Controllers call these instead of hitting axios/OWM directly, so the
// API key only ever lives server-side (process.env.OPENWEATHER_API_KEY).

const axios = require("axios");

const BASE_URL = "https://api.openweathermap.org/data/2.5";

function locationParams({ lat, lon, q }) {
  if (lat !== undefined && lon !== undefined) return { lat, lon };
  if (q) return { q };
  throw new Error("Provide either lat/lon or a city name (q)");
}

async function getCurrentWeather({ lat, lon, q }) {
  const response = await axios.get(`${BASE_URL}/weather`, {
    params: {
      ...locationParams({ lat, lon, q }),
      appid: process.env.OPENWEATHER_API_KEY,
      units: "metric",
    },
  });
  return response.data;
}

async function getForecast({ lat, lon, q, cnt }) {
  const response = await axios.get(`${BASE_URL}/forecast`, {
    params: {
      ...locationParams({ lat, lon, q }),
      appid: process.env.OPENWEATHER_API_KEY,
      units: "metric",
      ...(cnt ? { cnt } : {}),
    },
  });
  return response.data;
}

async function getAirQuality({ lat, lon }) {
  const response = await axios.get(`${BASE_URL}/air_pollution`, {
    params: { lat, lon, appid: process.env.OPENWEATHER_API_KEY },
  });
  return response.data;
}

async function getAirQualityHistory({ lat, lon, start, end }) {
  const response = await axios.get(`${BASE_URL}/air_pollution/history`, {
    params: { lat, lon, start, end, appid: process.env.OPENWEATHER_API_KEY },
  });
  return response.data;
}

module.exports = {
  getCurrentWeather,
  getForecast,
  getAirQuality,
  getAirQualityHistory,
};
