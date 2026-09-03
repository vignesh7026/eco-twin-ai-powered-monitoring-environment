const Reading = require("../models/Reading");
const { getCurrentWeather, getAirQuality, getAirQualityHistory } = require("../services/openWeatherService");

const MAX_ENTRIES = 12;
const CITY = { lat: 12.9716, lon: 77.5946 };

// Same US EPA breakpoint table EnvironmentalTimeline.jsx used client-side.
function pm25ToAQI(pm) {
  const breakpoints = [
    [0.0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ];
  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (pm >= cLow && pm <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm - cLow) + iLow);
    }
  }
  return 500;
}

function timeLabel(date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// Walks readings in chronological order and emits the same event types
// EnvironmentalTimeline.jsx's diffToEvents() used to compute client-side.
function eventsFromSamples(samples) {
  const events = [];
  for (let i = 0; i < samples.length; i++) {
    const curr = samples[i];
    const prev = samples[i - 1];

    if (!prev) {
      events.push({ time: timeLabel(curr.timestamp), tone: "cyan", text: `Monitoring started — AQI ${curr.aqi}` });
      continue;
    }

    const aqiDelta = curr.aqi - prev.aqi;
    if (Math.abs(aqiDelta) >= 8) {
      events.push({
        time: timeLabel(curr.timestamp),
        tone: aqiDelta > 0 ? "rose" : "emerald",
        text: `AQI ${aqiDelta > 0 ? "increased" : "improved"} to ${curr.aqi}`,
      });
    }

    const wasRaining = (prev.weatherMain || "").toLowerCase().includes("rain") || prev.rainVolume > 0;
    const isRaining = (curr.weatherMain || "").toLowerCase().includes("rain") || curr.rainVolume > 0;
    if (isRaining && !wasRaining) {
      events.push({ time: timeLabel(curr.timestamp), tone: "cyan", text: "Rainfall detected" });
    } else if (!isRaining && wasRaining) {
      events.push({ time: timeLabel(curr.timestamp), tone: "emerald", text: "Rainfall has cleared" });
    }

    if (curr.rainVolume > 4) {
      events.push({ time: timeLabel(curr.timestamp), tone: "rose", text: "Flood alert generated — heavy rainfall sustained" });
    }

    if (curr.tempC >= 38 && prev.tempC < 38) {
      events.push({ time: timeLabel(curr.timestamp), tone: "amber", text: `Heatwave threshold crossed at ${Math.round(curr.tempC)}°C` });
    }
  }
  return events;
}

exports.getEvents = async (req, res) => {
  try {
    const hours = Number(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await Reading.find({ timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .lean();

    let events = [];

    if (readings.length >= 2) {
      const samples = readings.map((r) => ({
        timestamp: r.timestamp,
        aqi: pm25ToAQI(r.pm2_5 ?? 0),
        weatherMain: r.weather_condition || "",
        rainVolume: r.rain_1h || 0,
        tempC: r.temp_c ?? 25,
      }));
      events = eventsFromSamples(samples);
    } else {
      // Not enough logged history — fall back to OpenWeatherMap's own
      // AQI history (still gives real past readings) plus a live snapshot.
      try {
        const end = Math.floor(Date.now() / 1000);
        const start = end - hours * 60 * 60;
        const history = await getAirQualityHistory({ lat: CITY.lat, lon: CITY.lon, start, end });
        const samples = (history.list || []).map((entry) => ({
          timestamp: entry.dt * 1000,
          aqi: pm25ToAQI(entry.components?.pm2_5 ?? 0),
          weatherMain: "",
          rainVolume: 0,
          tempC: 25,
        }));
        events = eventsFromSamples(samples);
      } catch {
        // OWM history unavailable — fall through to just a live snapshot below.
      }

      const [weather, airQuality] = await Promise.all([
        getCurrentWeather({ lat: CITY.lat, lon: CITY.lon }),
        getAirQuality({ lat: CITY.lat, lon: CITY.lon }),
      ]);
      const liveAqi = pm25ToAQI(airQuality.list?.[0]?.components?.pm2_5 ?? 0);
      events.push({
        time: timeLabel(new Date()),
        tone: "cyan",
        text: `Live snapshot — AQI ${liveAqi}, ${weather.weather?.[0]?.main ?? "conditions unknown"}`,
      });
    }

    const ordered = events.slice(-MAX_ENTRIES).reverse();
    res.status(200).json({ success: true, data: ordered });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
    });
  }
};
