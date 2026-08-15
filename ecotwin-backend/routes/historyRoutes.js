// historyRoutes.js — exposes the logged dataset for charting and for
// exporting to CSV so you can train the forecasting model in Python.
//
// In your Express app (after connectDB):
//   app.use("/api/history", require("./historyRoutes"));

const express = require("express");
const router = express.Router();
const Reading = require("../models/Reading");
const { fetchAndLog } = require("../logHistory");

const READINGS_PER_DAY = 96; // at 15-min interval

// GET /api/history/log-now — manually triggers a fetch+log cycle.
// Wire an external cron service (e.g. cron-job.org, free) to hit this
// every 15 min. This matters specifically because Render's free tier
// spins the server down after ~15 min of no incoming traffic — if that
// happens, the INTERNAL node-cron job inside logHistory.js simply won't
// fire, since the whole process is asleep. An external ping both wakes
// the server AND guarantees the log actually happens on schedule.
router.get("/log-now", async (req, res) => {
  try {
    await fetchAndLog();
    // Minimal plain-text response — cron-job.org only needs to see this
    // request succeeded, not the actual reading count. Keeping the
    // response tiny sidesteps any response-size/format quirk on their end.
    res.status(200).type("text/plain").send("OK");
  } catch (err) {
    console.error("[log-now] Failed:", err.message);
    res.status(500).type("text/plain").send("FAILED");
  }
});

// GET /api/history/status — quick check on how much data you've collected
router.get("/status", async (req, res) => {
  try {
    const count = await Reading.countDocuments();
    res.json({
      totalReadings: count,
      approxDaysCollected: (count / READINGS_PER_DAY).toFixed(1),
      readyForForecasting: count >= 672, // ~1 week minimum for a first pass
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/all — raw JSON
router.get("/all", async (req, res) => {
  try {
    const readings = await Reading.find().sort({ timestamp: 1 }).lean();
    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/since?date=2026-08-01 — filtered JSON
router.get("/since", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Provide ?date=YYYY-MM-DD" });
  try {
    const readings = await Reading.find({ timestamp: { $gte: new Date(date) } })
      .sort({ timestamp: 1 })
      .lean();
    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/csv — for feeding straight into the Python training script
router.get("/csv", async (req, res) => {
  try {
    const readings = await Reading.find().sort({ timestamp: 1 }).lean();
    if (readings.length === 0) return res.status(404).send("No data logged yet.");

    const columns = [
      "timestamp", "lat", "lon", "pm2_5", "pm10", "co", "no2", "o3", "so2",
      "aqi_category", "temp_c", "humidity", "wind_speed", "rain_1h", "weather_condition",
    ];

    const headerRow = columns.join(",");
    const dataRows = readings.map((r) =>
      columns
        .map((col) => {
          const val = col === "timestamp" ? new Date(r.timestamp).toISOString() : r[col];
          return val ?? "";
        })
        .join(",")
    );

    const csv = [headerRow, ...dataRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=ecotwin_history.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;