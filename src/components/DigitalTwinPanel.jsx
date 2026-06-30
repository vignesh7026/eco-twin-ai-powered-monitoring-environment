import { useEffect, useState } from "react";

/* ---------------------------------------------------------- */
/* API key — set VITE_OPENWEATHER_API_KEY in a .env file at    */
/* your project root. Same key used by Weather.jsx / RiskMap /  */
/* RiskRadar.jsx.                                                */
/*                                                                */
/* This component accepts an optional `liveData` prop so a       */
/* parent (e.g. Dashboard.jsx) can fetch once and share it across */
/* RiskRadar / DigitalTwinPanel / StatCards instead of each one   */
/* hitting the OpenWeather API independently. If no prop is        */
/* passed, it fetches on its own as a standalone fallback.         */
/* ---------------------------------------------------------- */
const apiKey = "0b294ed82262f68270ccf92376bfbd87";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CITY = { name: "Bengaluru", lat: 12.9716, lon: 77.5946 };

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/* Static facts that don't move in real time */
const POPULATION = "13.6M";
const GREEN_COVER = "38%";

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

function deriveTwinMetrics({ aqi, tempC, windSpeed, humidity }) {
  // Energy usage proxy: hotter days push cooling/grid load up
  const energyUsage = Math.round(clamp(40 + (tempC - 24) * 3, 20, 98));

  // Water quality proxy: heavy humidity/rain pressure nudges it down slightly
  const waterQuality = Math.round(clamp(88 - Math.max(0, humidity - 70) * 0.6, 40, 95));

  // City health: inverse of AQI, the main live signal we trust most
  const cityHealth = Math.round(clamp(100 - aqi / 2.2, 0, 100));

  const carbonFootprint = aqi > 150 ? "High" : aqi > 90 ? "Medium" : "Low";

  const disasterRisk =
    aqi > 170 || windSpeed > 18
      ? "High"
      : aqi > 110 || windSpeed > 10
      ? "Moderate"
      : "Low";

  return { energyUsage, waterQuality, cityHealth, carbonFootprint, disasterRisk };
}

async function fetchLiveTwinData() {
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
    const windSpeed = w?.wind?.speed ?? 0;
    const humidity = w?.main?.humidity ?? 0;

    return { metrics: deriveTwinMetrics({ aqi, tempC, windSpeed, humidity }), error: null };
  } catch (err) {
    return { error: "fetch_failed" };
  }
}

/* ---------------------------------------------------------- */
/* Inline icon set — matches the rest of the app                */
/* ---------------------------------------------------------- */
const IconCpu = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
  </svg>
);

const IconAlertTriangle = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const toneStyles = {
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  rose: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
};

function riskTone(label) {
  if (label === "Low") return "emerald";
  if (label === "Moderate" || label === "Medium") return "amber";
  return "rose";
}

function MiniStat({ label, value, color = "text-white" }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 p-5 rounded-2xl transition-colors hover:border-teal-400/20">
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</p>
      <h3 className={`text-3xl font-bold mt-2 tabular-nums ${color}`}>{value}</h3>
    </div>
  );
}

function StatusTile({ label, value }) {
  const tone = toneStyles[riskTone(value)];
  return (
    <div className={`rounded-2xl p-4 border ${tone.bg} ${tone.border}`}>
      <p className={`text-[10px] font-mono uppercase tracking-widest ${tone.text}`}>{label}</p>
      <h3 className="text-4xl font-bold mt-2 text-white tabular-nums">{value}</h3>
    </div>
  );
}

function DigitalTwinPanel({ liveData }) {
  const [internalLive, setInternalLive] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const usingExternalData = liveData !== undefined;

  useEffect(() => {
    if (usingExternalData) return; // parent is supplying data — skip own fetch
    let active = true;

    const load = async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      const snapshot = await fetchLiveTwinData();
      if (active) {
        setInternalLive(snapshot);
        setRefreshing(false);
      }
    };

    load();
    const interval = setInterval(() => load(true), REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingExternalData]);

  const live = usingExternalData ? liveData : internalLive;
  const hasLiveData = live && !live.error;

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-8 shadow-[0_0_60px_-15px_rgba(45,212,191,0.25)]">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold text-white">
            <IconCpu className="w-6 h-6 text-teal-400" />
            {CITY.name} Digital Twin
          </h2>
          <p className="text-slate-400 mt-1">Real-time Environmental Replica</p>
        </div>

        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-500">
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
          {refreshing ? "Syncing" : "Live"}
        </span>
      </div>

      {live?.error === "missing_key" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-6">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          Missing VITE_OPENWEATHER_API_KEY — add it to your .env file to drive this twin with
          live conditions.
        </div>
      )}

      {live?.error === "fetch_failed" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-6">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          Couldn't reach the weather service. Showing the last known reading.
        </div>
      )}

      <div className="grid grid-cols-4 gap-5">
        <MiniStat label="Population" value={POPULATION} />
        <MiniStat label="Green Cover" value={GREEN_COVER} color="text-emerald-400" />
        <MiniStat
          label="Energy Usage"
          value={hasLiveData ? `${live.metrics.energyUsage}%` : !live ? "—" : "N/A"}
          color="text-amber-400"
        />
        <MiniStat
          label="Water Quality"
          value={hasLiveData ? `${live.metrics.waterQuality}%` : !live ? "—" : "N/A"}
          color="text-cyan-400"
        />
      </div>

      <div className="grid grid-cols-3 gap-5 mt-8">
        <StatusTile
          label="City Health"
          value={hasLiveData ? `${live.metrics.cityHealth}%` : !live ? "—" : "N/A"}
        />
        <StatusTile
          label="Carbon Footprint"
          value={hasLiveData ? live.metrics.carbonFootprint : !live ? "—" : "N/A"}
        />
        <StatusTile
          label="Disaster Risk"
          value={hasLiveData ? live.metrics.disasterRisk : !live ? "—" : "N/A"}
        />
      </div>
    </div>
  );
}

export default DigitalTwinPanel;
