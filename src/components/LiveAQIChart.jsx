import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ---------------------------------------------------------- */
/* Config                                                       */
/* ---------------------------------------------------------- */
const apiKey = "0b294ed82262f68270ccf92376bfbd87";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/* ---------------------------------------------------------- */
/* Inline icons — matches Simulator.jsx                        */
/* ---------------------------------------------------------- */
const IconTrend = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 17 9 11 13 15 21 7" />
    <polyline points="14 7 21 7 21 14" />
  </svg>
);

const IconRefresh = ({ className = "w-4 h-4", spin = false }) => (
  <svg className={`${className} ${spin ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const IconArrowUp = ({ className = "w-3 h-3" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
  </svg>
);

const IconArrowDown = ({ className = "w-3 h-3" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
  </svg>
);

/* ---------------------------------------------------------- */
/* AQI helpers                                                  */
/* ---------------------------------------------------------- */
function pm25ToAQI(pm) {
  const bp = [
    [0.0,12.0,0,50],[12.1,35.4,51,100],[35.5,55.4,101,150],
    [55.5,150.4,151,200],[150.5,250.4,201,300],[250.5,350.4,301,400],[350.5,500.4,401,500],
  ];
  for (const [cL,cH,iL,iH] of bp)
    if (pm >= cL && pm <= cH) return Math.round(((iH-iL)/(cH-cL))*(pm-cL)+iL);
  return 500;
}

function getRisk(aqi) {
  if (aqi <= 50)  return { label: "Good",      color: "#34d399" };
  if (aqi <= 100) return { label: "Moderate",  color: "#fbbf24" };
  if (aqi <= 150) return { label: "Poor",      color: "#fb923c" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#fb7185" };
  return               { label: "Severe",    color: "#c084fc" };
}

/* ---------------------------------------------------------- */
/* Fetch                                                        */
/* ---------------------------------------------------------- */
async function fetchAqiHistory(lat, lon, hours) {
  const now   = Math.floor(Date.now() / 1000);
  const start = now - hours * 3600;
  const res   = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${now}&appid=${apiKey}`
  );
  if (!res.ok) throw new Error("Failed to fetch AQI history");
  const data = await res.json();
  const list = data?.list || [];
  if (!list.length) throw new Error("No AQI history available");
  return list.map((item) => ({
    time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: "numeric" }),
    aqi:  pm25ToAQI(item.components?.pm2_5 ?? 0),
  }));
}

/* ---------------------------------------------------------- */
/* Custom tooltip — matches Simulator dark glass style         */
/* ---------------------------------------------------------- */
function ChartTooltip({ active, payload, label, color }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-teal-400/20 rounded-2xl px-4 py-3 shadow-lg">
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="font-mono font-bold text-lg tabular-nums" style={{ color }}>
        {payload[0].value}
        <span className="text-xs text-slate-400 ml-1 font-normal">AQI</span>
      </p>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Main component                                               */
/* ---------------------------------------------------------- */
function LiveAQIChart({ lat = 12.9716, lon = 77.5946, cityLabel = "Bengaluru", hours = 12 }) {
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const history = await fetchAqiHistory(lat, lon, hours);
      setData(history);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load AQI trend");
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
  }, [lat, lon, hours]);

  const latest   = data[data.length - 1];
  const earliest = data[0];
  const delta    = latest && earliest ? latest.aqi - earliest.aqi : 0;
  const risk     = latest ? getRisk(latest.aqi) : { label: "—", color: "#2dd4bf" };

  const renderDot = (props) => {
    const { cx, cy, index } = props;
    if (index !== data.length - 1) return null;
    return (
      <g key="latest-dot">
        <circle cx={cx} cy={cy} r={10} fill={risk.color} opacity={0.2} />
        <circle cx={cx} cy={cy} r={4}  fill={risk.color} stroke="#0B1120" strokeWidth={2} />
      </g>
    );
  };

  return (
    <div
      className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-8 relative overflow-hidden transition-all duration-300"
      style={{ boxShadow: latest ? `0 0 60px -20px ${risk.color}55` : undefined }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-15 transition-colors duration-500"
        style={{ background: risk.color }}
      />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 relative flex-wrap">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80">
            <IconTrend className="w-4 h-4 text-teal-400" />
            Live AQI Trend
          </h2>
          <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
            </span>
            Live · {cityLabel} · Last {hours}h
          </p>
        </div>

        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900/60 border border-teal-400/10 text-teal-400/80 text-[10px] font-mono uppercase tracking-widest hover:border-teal-400/30 hover:bg-teal-400/10 disabled:opacity-40 transition-all duration-200"
        >
          <IconRefresh className="w-3 h-3" spin={refreshing} />
          Refresh
        </button>
      </div>

      {/* ── KPI row ── */}
      {!loading && !error && latest && (
        <div className="grid grid-cols-3 gap-4 mb-6 relative">
          {/* Current AQI */}
          <div className="bg-slate-900/60 border border-teal-400/10 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Current AQI</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: risk.color }}>{latest.aqi}</p>
          </div>

          {/* Risk level */}
          <div className="bg-slate-900/60 border border-teal-400/10 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Risk Level</p>
            <p className="text-3xl font-bold" style={{ color: risk.color }}>{risk.label}</p>
          </div>

          {/* 12h change */}
          <div className="bg-slate-900/60 border border-teal-400/10 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">{hours}h Change</p>
            <p className={`text-3xl font-bold tabular-nums flex items-center gap-1 ${delta > 0 ? "text-rose-400" : delta < 0 ? "text-emerald-400" : "text-slate-400"}`}>
              {delta > 0 ? <IconArrowUp className="w-5 h-5" /> : delta < 0 ? <IconArrowDown className="w-5 h-5" /> : null}
              {delta === 0 ? "—" : Math.abs(delta)}
            </p>
          </div>
        </div>
      )}

      {/* Sync timestamp */}
      {lastUpdated && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4 relative">
          Synced · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      {/* ── Chart ── */}
      {loading ? (
        <div className="h-[280px] bg-slate-900/60 border border-teal-400/10 rounded-2xl animate-pulse" />
      ) : error ? (
        <div className="h-[280px] flex flex-col items-center justify-center gap-4 bg-slate-900/60 border border-rose-400/10 rounded-2xl">
          <span className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-400 flex items-center justify-center">
            <IconAlert className="w-5 h-5" />
          </span>
          <p className="text-slate-400 text-sm max-w-xs text-center">{error}</p>
          <button
            onClick={() => load()}
            className="px-5 py-2 rounded-2xl bg-teal-400/10 border border-teal-400/20 text-teal-300 text-[10px] font-mono uppercase tracking-widest hover:bg-teal-400/20 transition-all"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* AQI impact bar — mirrors Simulator.jsx analysis section */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">AQI Impact</span>
              <span className="text-[10px] font-mono tabular-nums text-slate-500">{latest?.aqi ?? 0} / 300</span>
            </div>
            <div className="w-full bg-slate-950/60 border border-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(((latest?.aqi ?? 0) / 300) * 100, 100)}%`,
                  background: risk.color,
                  boxShadow: `0 0 8px ${risk.color}88`,
                }}
              />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={risk.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={risk.color} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(45,212,191,0.06)" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#475569"
                tick={{ fontSize: 10, fontFamily: "monospace", fill: "#475569", textTransform: "uppercase" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#475569"
                tick={{ fontSize: 10, fontFamily: "monospace", fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip content={<ChartTooltip color={risk.color} />} />
              <Area
                type="monotone"
                dataKey="aqi"
                stroke={risk.color}
                strokeWidth={2.5}
                fill="url(#aqiGradient)"
                dot={renderDot}
                activeDot={{ r: 5, fill: risk.color, stroke: "#0B1120", strokeWidth: 2 }}
                isAnimationActive
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default LiveAQIChart;
