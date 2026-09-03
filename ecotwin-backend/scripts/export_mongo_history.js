// One-off export: pulls all Reading docs from MongoDB and writes them to
// ecotwin-backend/ml/data/ecotwin_history.csv in the same format as the
// GET /api/history/csv route, so forecast_pm25.py can train on the latest
// MongoDB data without needing the server running.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Reading = require("../models/Reading");

const OUT_PATH = path.join(__dirname, "..", "ml", "data", "ecotwin_history.csv");

const columns = [
  "timestamp", "lat", "lon", "pm2_5", "pm10", "co", "no2", "o3", "so2",
  "aqi_category", "temp_c", "humidity", "wind_speed", "rain_1h", "weather_condition",
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const readings = await Reading.find().sort({ timestamp: 1 }).lean();
  console.log(`Fetched ${readings.length} readings from MongoDB.`);

  if (readings.length === 0) {
    console.error("No data in the readings collection.");
    process.exit(1);
  }

  const headerRow = columns.join(",");
  const dataRows = readings.map((r) =>
    columns
      .map((col) => {
        const val = col === "timestamp" ? new Date(r.timestamp).toISOString() : r[col];
        return val ?? "";
      })
      .join(",")
  );
  fs.writeFileSync(OUT_PATH, [headerRow, ...dataRows].join("\n"));

  const first = readings[0].timestamp;
  const last = readings[readings.length - 1].timestamp;
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Date range: ${first} -> ${last}`);

  await mongoose.disconnect();
})().catch((err) => {
  console.error("Export failed:", err.message);
  process.exit(1);
});
