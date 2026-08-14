import { useEffect, useState } from "react";

/* ---------------------------------------------------------- */
/* API key — set VITE_OPENWEATHER_API_KEY in a .env file at    */
/* your project root. Same key used by Weather.jsx / RiskMap.   */
/* ---------------------------------------------------------- */
const apiKey = "0b294ed82262f68270ccf92376bfbd87";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CITY = { name: "Bengaluru", lat: 12.9716, lon: 77.5946 };

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/* ---------------------------------------------------------- */
/* PM2.5 (µg/m³) -> US EPA AQI conversion                       */
/* ---------------------------------------------------------- */
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

/* ---------------------------------------------------------- */
/* Derive the four radar scores (0-100) from live conditions    */
/* ---------------------------------------------------------- */
function deriveRisks({ tempC, humidity, windSpeed, rainVolume, aqi }) {
  // Flood: driven by recent rainfall + how saturated the air already is
  const floodScore = clamp(rainVolume * 12 + Math.max(0, humidity - 60) * 1.2, 0, 100);

  // Heatwave: scales from a comfortable 25°C baseline up to 42°C
  const heatScore = clamp(((tempC - 25) / (42 - 25)) * 100, 0, 100);

  // Pollution: AQI is already 0-500, rescale the part that matters (0-200) to 0-100
  const pollutionScore = clamp((aqi / 200) * 100, 0, 100);

  // Cyclone: rough proxy from sustained wind speed (m/s), 25 m/s ≈ severe
  const cycloneScore = clamp((windSpeed / 25) * 100, 0, 100);

  return [
    { name: "Flood", value: Math.round(floodScore), tone: "rose" },
    { name: "Heatwave", value: Math.round(heatScore), tone: "amber" },
    { name: "Pollution", value: Math.round(pollutionScore), tone: "yellow" },
    { name: "Cyclone", value: Math.round(cycloneScore), tone: "emerald" },
  ];
}

const toneStyles = {
  rose: { bar: "bg-rose-500", text: "text-rose-400" },
  amber: { bar: "bg-amber-500", text: "text-amber-400" },
  yellow: { bar: "bg-yellow-400", text: "text-yellow-300" },
  emerald: { bar: "bg-emerald-500", text: "text-emerald-400" },
};

async function fetchLiveRisks() {
  if (!apiKey) return { error: "missing_key" };

  try {
    const [wRes, pRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${CITY.lat}&lon=${CITY.lon}&appid=${apiKey}&units=metric`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${CITY.lat}&lon=${CITY.lon}&appid=${apiKey}`
      ),
    ]);

    if (!wRes.ok || !pRes.ok) throw new Error("Live data request failed");

    const w = await wRes.json();
    const p = await pRes.json();

    const pm25 = p?.list?.[0]?.components?.pm2_5 ?? 0;
    const aqi = pm25ToAQI(pm25);
    const tempC = w?.main?.temp ?? 25;
    const humidity = w?.main?.humidity ?? 0;
    const windSpeed = w?.wind?.speed ?? 0;
    const rainVolume = w?.rain?.["1h"] ?? w?.rain?.["3h"] ?? 0;

    return { risks: deriveRisks({ tempC, humidity, windSpeed, rainVolume, aqi }), error: null };
  } catch (err) {
    return { error: "fetch_failed" };
  }
}

/* ---------------------------------------------------------- */
/* Inline icon set — matches Assistant.jsx / Dashboard.jsx /    */
/* Weather.jsx / RiskMap.jsx                                    */
/* ---------------------------------------------------------- */
const IconRadar = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 12 L12 4 A8 8 0 0 1 18 8 Z" fill="currentColor" stroke="none" opacity="0.3" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

const IconAlertTriangle = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

function RiskRadar() {
  const [live, setLive] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      const snapshot = await fetchLiveRisks();
      if (active) {
        setLive(snapshot);
        setRefreshing(false);
      }
    };

    load();
    const interval = setInterval(() => load(true), REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const hasLiveData = live && !live.error;

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6 transition-colors hover:border-teal-400/20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
          <IconRadar className="w-3.5 h-3.5 text-teal-400" />
          Disaster Risk Radar
        </h2>

        <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                refreshing ? "bg-amber-400" : "bg-teal-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                refreshing ? "bg-amber-400" : "bg-teal-400"
              }`}
            />
          </span>
          {refreshing ? "Syncing" : CITY.name}
        </span>
      </div>

      {live?.error === "missing_key" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-4">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          Missing VITE_OPENWEATHER_API_KEY — add it to your .env file to power this radar with
          live conditions.
        </div>
      )}

      {live?.error === "fetch_failed" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-4">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          Couldn't reach the weather service. Showing the last known values until the next retry.
        </div>
      )}

      {!live && (
        <div className="space-y-5 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-slate-800/60 rounded-full" />
              <div className="h-3 w-full bg-slate-800/60 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {hasLiveData &&
        live.risks.map((risk) => {
          const tone = toneStyles[risk.tone];
          return (
            <div key={risk.name} className="mb-4 last:mb-0">
              <div className="flex justify-between text-sm text-slate-200">
                <span>{risk.name}</span>
                <span className={`font-semibold tabular-nums ${tone.text}`}>{risk.value}%</span>
              </div>

              <div className="w-full bg-slate-950/60 border border-white/5 h-3 rounded-full mt-2 overflow-hidden">
                <div
                  className={`${tone.bar} h-3 rounded-full transition-all duration-700`}
                  style={{ width: `${risk.value}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default RiskRadar;
