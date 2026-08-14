// logHistory.js — periodically fetches live PM2.5/weather data and stores
// it in MongoDB via the Reading model. This is what turns your "live
// snapshot" app into a real research dataset over time.
//
// Add to your server entrypoint, AFTER connectDB() has been called
// (Mongoose needs the connection established first):
//   const connectDB = require("./config/connectDB"); // adjust path to yours
//   connectDB().then(() => require("./logHistory"));
//
// Runs every 15 minutes. At that interval you'll have ~96 readings/day —
// enough for a meaningful short-term (1-6hr) forecasting dataset within
// 2-3 weeks of continuous logging.

const cron = require("node-cron");
const axios = require("axios");
const Reading = require("./models/Reading"); // adjust path if models/ lives elsewhere

const BENGALURU = { lat: 12.9716, lon: 77.5946 };
const OWM_KEY = process.env.OPENWEATHER_API_KEY; // set in .env, never commit it

async function fetchAndLog() {
  try {
    const [weatherRes, aqiRes] = await Promise.all([
      axios.get("https://api.openweathermap.org/data/2.5/weather", {
        params: { lat: BENGALURU.lat, lon: BENGALURU.lon, units: "metric", appid: OWM_KEY },
      }),
      axios.get("https://api.openweathermap.org/data/2.5/air_pollution", {
        params: { lat: BENGALURU.lat, lon: BENGALURU.lon, appid: OWM_KEY },
      }),
    ]);

    const w = weatherRes.data;
    const a = aqiRes.data?.list?.[0];

    const reading = new Reading({
      timestamp: new Date(),
      lat: BENGALURU.lat,
      lon: BENGALURU.lon,
      pm2_5: a?.components?.pm2_5 ?? null,
      pm10: a?.components?.pm10 ?? null,
      co: a?.components?.co ?? null,
      no2: a?.components?.no2 ?? null,
      o3: a?.components?.o3 ?? null,
      so2: a?.components?.so2 ?? null,
      aqi_category: a?.main?.aqi ?? null,
      temp_c: w?.main?.temp ?? null,
      humidity: w?.main?.humidity ?? null,
      wind_speed: w?.wind?.speed ?? null,
      rain_1h: w?.rain?.["1h"] ?? 0,
      weather_condition: w?.weather?.[0]?.description ?? null,
    });

    await reading.save();

    const count = await Reading.countDocuments();
    console.log(`[logHistory] Reading #${count} logged at ${new Date().toISOString()}`);
  } catch (err) {
    console.error("[logHistory] Failed to fetch/log reading:", err.message);
  }
}

// Every 15 minutes
cron.schedule("*/15 * * * *", fetchAndLog);

// Log one immediately on startup so you don't wait 15 min to see it working
fetchAndLog();

module.exports = { fetchAndLog };