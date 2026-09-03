// simulatorService.js — the "what-if" scenario formula, moved server-side
// out of Simulator.jsx's useSimulation()/buildRecommendations() so the
// backend is the single source of truth. Formula is unchanged from the
// original client-side implementation.

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function runSimulation({ trees, vehicles, industry }) {
  const predictedAQI = clamp(
    120 - trees * 0.008 + vehicles * 0.012 + industry * 0.9,
    10,
    200
  );

  const risk =
    predictedAQI > 130
      ? "Severe"
      : predictedAQI > 90
      ? "High"
      : predictedAQI > 55
      ? "Moderate"
      : "Low";

  const riskColor = {
    Severe: "#fb7185",
    High: "#fbbf24",
    Moderate: "#2dd4bf",
    Low: "#34d399",
  }[risk];

  const carbonIndex = Math.round(predictedAQI * 0.6 + industry * 0.4);
  const ecoScore = clamp(100 - predictedAQI / 2.2 + trees / 400, 0, 100);
  const dialAngle = -120 + (predictedAQI / 200) * 240;

  return { predictedAQI, risk, riskColor, carbonIndex, ecoScore, dialAngle };
}

function buildRecommendations({ trees, vehicles, industry, ecoScore, risk }) {
  const recs = [];

  recs.push(
    trees < 4000
      ? { key: "trees", text: `Plant ${4000 - trees} more trees to pull AQI down meaningfully.` }
      : { key: "trees", text: "Tree coverage is strong — maintain it through protected zoning." }
  );

  recs.push(
    vehicles > 4000
      ? { key: "vehicles", text: "Vehicle load is the dominant pressure — expand transit to cut it." }
      : { key: "vehicles", text: "Traffic levels are manageable — keep incentivizing carpooling." }
  );

  recs.push(
    industry > 60
      ? { key: "industry", text: "Industrial output is the largest single risk factor right now." }
      : industry > 30
      ? { key: "industry", text: "Industrial emissions are moderate — filtration upgrades help." }
      : { key: "industry", text: "Industrial footprint is low — a good baseline to build from." }
  );

  recs.push({
    key: "eco",
    text:
      ecoScore > 70
        ? "Eco score is healthy — renewables can lock in these gains."
        : risk === "Severe" || risk === "High"
        ? "Eco score is under strain — prioritize renewable conversion now."
        : "Eco score is average — renewable adoption offers the fastest lift.",
  });

  return recs;
}

module.exports = { runSimulation, buildRecommendations };
