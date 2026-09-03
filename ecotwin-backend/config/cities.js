// cities.js — shared city config used by digitalTwinController and
// riskMapController. Population/lat/lon were previously duplicated as
// CITY_CONFIG/CITIES_BASE in the frontend (RiskMap.jsx, RiskMapPreview.jsx).
// greenCover is only known for Bengaluru (DigitalTwinPanel.jsx's old
// GREEN_COVER constant) — left null for the others rather than invented.

module.exports = {
  Bengaluru: { lat: 12.9716, lon: 77.5946, population: "13.6M", greenCover: 38 },
  Chennai: { lat: 13.0827, lon: 80.2707, population: "11.5M", greenCover: null },
  Mumbai: { lat: 19.076, lon: 72.8777, population: "21.3M", greenCover: null },
  Delhi: { lat: 28.6139, lon: 77.209, population: "32.9M", greenCover: null },
};
