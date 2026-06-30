import { useState, useEffect, useRef } from "react";

/* ---------------------------------------------------------- */
/* API key                                                      */
/* ---------------------------------------------------------- */
const apiKey = "0b294ed82262f68270ccf92376bfbd87";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/* ---------------------------------------------------------- */
/* Inline icon set — matches Simulator.jsx / Navbar / Sidebar  */
/* ---------------------------------------------------------- */
const IconGlobe = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8" />
    <path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9c2.5-3 4-5.5 4-9s-1.5-6-4-9z" />
  </svg>
);

const IconRefresh = ({ className = "w-4 h-4", spin = false }) => (
  <svg
    className={`${className} ${spin ? "animate-spin" : ""}`}
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 10-2.6 6.4" />
    <polyline points="21 5 21 12 14 12" />
  </svg>
);

const IconAlert = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v4" />
    <path d="M10.3 3.9L2.7 17a1.8 1.8 0 001.5 2.7h15.6a1.8 1.8 0 001.5-2.7L13.7 3.9a1.8 1.8 0 00-3.4 0z" />
    <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

const IconGauge = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 14l3-4" />
    <path d="M4 14a8 8 0 1116 0" />
    <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const IconLeaf = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21c8 0 14-6 14-15-9 0-15 6-15 14 0 .3 0 .7.1 1z" />
    <path d="M5 21c2-5 5-8 9-10" />
  </svg>
);

/* ---------------------------------------------------------- */
/* AQI helpers                                                  */
/* ---------------------------------------------------------- */
function pm25ToAQI(pm) {
  const breakpoints = [
    [0.0,   12.0,  0,   50],
    [12.1,  35.4,  51,  100],
    [35.5,  55.4,  101, 150],
    [55.5,  150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ];
  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (pm >= cLow && pm <= cHigh)
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm - cLow) + iLow);
  }
  return 500;
}

function aqiToHealthScore(aqi) {
  return Math.max(0, Math.min(100, 100 - aqi / 2));
}

function getHealthStatus(score) {
  if (score > 75) return { label: "Healthy",   color: "#34d399" };
  if (score > 50) return { label: "Moderate",  color: "#fbbf24" };
  if (score > 25) return { label: "Poor",      color: "#fb923c" };
  return             { label: "Unhealthy", color: "#fb7185" };
}

/* ---------------------------------------------------------- */
/* Fetch                                                        */
/* ---------------------------------------------------------- */
async function fetchCurrentAqi(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
  );
  if (!res.ok) throw new Error("Failed to fetch AQI data");
  const data = await res.json();
  const pm25 = data?.list?.[0]?.components?.pm2_5;
  if (pm25 === undefined) throw new Error("No AQI data available for this location");
  return pm25ToAQI(pm25);
}

/* ---------------------------------------------------------- */
/* Animated number hook                                         */
/* ---------------------------------------------------------- */
function useAnimatedNumber(target, duration = 600) {
  const [value, setValue] = useState(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = value;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

/* ---------------------------------------------------------- */
/* Skeleton pulse ring                                          */
/* ---------------------------------------------------------- */
function SkeletonRing() {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative w-52 h-52">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(45,212,191,0.06)" strokeWidth="14" />
          <circle
            cx="100" cy="100" r="80" fill="none"
            stroke="rgba(45,212,191,0.12)" strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="502"
            strokeDashoffset="350"
            className="animate-pulse"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-2 text-center">
            <div className="w-16 h-10 bg-teal-400/10 rounded-xl animate-pulse mx-auto" />
            <div className="w-20 h-3 bg-slate-700/60 rounded-full animate-pulse mx-auto" />
          </div>
        </div>
      </div>
      <div className="w-full space-y-2">
        <div className="flex justify-between">
          <div className="w-8 h-3 bg-slate-700/60 rounded animate-pulse" />
          <div className="w-8 h-3 bg-slate-700/60 rounded animate-pulse" />
        </div>
        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
          <div className="h-2 w-1/3 bg-teal-400/20 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Mini stat row                                                */
/* ---------------------------------------------------------- */
function StatBadge({ label, value, color }) {
  return (
    <div className="bg-slate-900/60 border border-teal-400/10 rounded-2xl px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-lg font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Main component                                               */
/* ---------------------------------------------------------- */
function HealthGauge({ lat = 12.9716, lon = 77.5946, cityLabel = "Bengaluru" }) {
  const [aqi, setAqi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const value = await fetchCurrentAqi(lat, lon);
      setAqi(value);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load environmental data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  const score  = aqi !== null ? aqiToHealthScore(aqi) : 0;
  const animScore = useAnimatedNumber(score);
  const status = getHealthStatus(score);

  const r            = 80;
  const circumference = 2 * Math.PI * r;
  const dashOffset   = circumference * (1 - score / 100);
  const aqiBarPct    = aqi !== null ? Math.min((aqi / 300) * 100, 100) : 0;

  /* AQI risk label mirrors Simulator.jsx */
  const aqiRisk =
    aqi > 200 ? "Severe" : aqi > 150 ? "High" : aqi > 100 ? "Moderate" : "Low";

  return (
    <div
      className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6 relative overflow-hidden transition-all duration-300"
      style={{ boxShadow: aqi !== null ? `0 0 60px -20px ${status.color}55` : undefined }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-20 transition-colors duration-500"
        style={{ background: status.color }}
      />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-6 relative">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80">
            <IconGauge className="w-4 h-4 text-teal-400" />
            Environmental Health Score
          </h2>
          <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
            </span>
            Live · {cityLabel}
          </p>
        </div>

        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/60 border border-teal-400/10 text-teal-400/80 text-[10px] font-mono uppercase tracking-widest hover:border-teal-400/30 hover:bg-teal-400/10 disabled:opacity-40 transition-all duration-200"
        >
          <IconRefresh className="w-3 h-3" spin={refreshing} />
          Refresh
        </button>
      </div>

      {/* ── Missing key warning ── */}
      {!apiKey && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-300 text-[10px] font-mono uppercase tracking-widest">
          <IconAlert className="w-4 h-4 shrink-0" />
          Missing VITE_OPENWEATHER_API_KEY — add it to your .env file.
        </div>
      )}

      {/* ── Body ── */}
      {loading ? (
        <SkeletonRing />
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center gap-4 py-10">
          <span className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-400 flex items-center justify-center">
            <IconAlert className="w-5 h-5" />
          </span>
          <p className="text-slate-400 text-sm max-w-xs leading-relaxed">{error}</p>
          <button
            onClick={() => load()}
            className="px-5 py-2 rounded-2xl bg-teal-400/10 border border-teal-400/20 text-teal-300 text-[10px] font-mono uppercase tracking-widest hover:bg-teal-400/20 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Ring */}
          <div className="flex justify-center items-center mb-6">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                <circle
                  cx="100" cy="100" r={r}
                  fill="none"
                  stroke="rgba(148,163,184,0.08)"
                  strokeWidth="14"
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="50%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor={status.color} />
                  </linearGradient>
                </defs>
                <circle
                  cx="100" cy="100" r={r}
                  fill="none"
                  stroke={score > 50 ? "url(#healthGradient)" : status.color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: "stroke-dashoffset 0.8s cubic-bezier(0.34,1.2,0.64,1), stroke 0.4s ease",
                    filter: `drop-shadow(0 0 10px ${status.color}88)`,
                  }}
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span
                    className="text-5xl font-bold tabular-nums transition-colors duration-500"
                    style={{ color: status.color }}
                  >
                    {Math.round(animScore)}
                  </span>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">
                    {status.label}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stat badges */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatBadge label="AQI"       value={aqi}      color="#2dd4bf" />
            <StatBadge label="Risk"      value={aqiRisk}  color={status.color} />
            <StatBadge label="Health %"  value={`${Math.round(score)}%`} color="#a78bfa" />
          </div>

        
          {/* Last sync */}
          {lastUpdated && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 text-right mt-5">
              Synced · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default HealthGauge;
