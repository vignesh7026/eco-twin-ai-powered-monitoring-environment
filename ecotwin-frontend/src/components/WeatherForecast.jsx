import { useEffect, useState } from "react";

/* ---------------------------------------------------------- */
/* Config                                                       */
/* ---------------------------------------------------------- */
const API_KEY = "0b294ed82262f68270ccf92376bfbd87";
const CITY    = { name: "Bengaluru", lat: 12.9716, lon: 77.5946 };
const REFRESH = 10 * 60 * 1000; // 10 min

/* ---------------------------------------------------------- */
/* Inline icons                                                 */
/* ---------------------------------------------------------- */
const IconSun = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const IconCloud = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9z" />
  </svg>
);
const IconCloudSun = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2M4.22 4.22l1.42 1.42M20 12h2M4.22 11.78l1.42 1.42" />
    <circle cx="10" cy="10" r="3" />
    <path d="M20 17H9a6 6 0 11.6-11.9A6 6 0 0120 17z" />
  </svg>
);
const IconRain = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 16H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9z" />
    <path d="M8 19v2M12 19v2M16 19v2" />
  </svg>
);
const IconSnow = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07L19.07 4.93" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const IconStorm = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 16H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9z" />
    <path d="M13 12l-3 5h4l-3 5" />
  </svg>
);
const IconCalendar = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconWind = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10a3 3 0 100-6" /><path d="M3 14h13a3 3 0 110 6" />
  </svg>
);
const IconDrop = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6 10 4 14 4 16a8 8 0 0016 0c0-2-2-6-8-14z" />
  </svg>
);
const IconRefresh = ({ className = "w-4 h-4", spin = false }) => (
  <svg className={`${className} ${spin ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 10-2.6 6.4" /><polyline points="21 5 21 12 14 12" />
  </svg>
);

/* ---------------------------------------------------------- */
/* Map OWM weather id -> our type                               */
/* ---------------------------------------------------------- */
function owmIdToType(id) {
  if (id >= 200 && id < 300) return "storm";
  if (id >= 300 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id === 800)             return "sunny";
  if (id === 801 || id === 802) return "partcloud";
  return "cloud";
}

const weatherMeta = {
  sunny:     { Icon: IconSun,      color: "#fbbf24" },
  partcloud: { Icon: IconCloudSun, color: "#2dd4bf" },
  rain:      { Icon: IconRain,     color: "#60a5fa" },
  storm:     { Icon: IconStorm,    color: "#a78bfa" },
  snow:      { Icon: IconSnow,     color: "#e2e8f0" },
  cloud:     { Icon: IconCloud,    color: "#94a3b8" },
};

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const LABELS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/* ---------------------------------------------------------- */
/* Fetch helpers                                                */
/* ---------------------------------------------------------- */
async function fetchCurrent() {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${CITY.lat}&lon=${CITY.lon}&appid=${API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error("current fetch failed");
  return res.json();
}

async function fetchForecast() {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${CITY.lat}&lon=${CITY.lon}&appid=${API_KEY}&units=metric&cnt=40`
  );
  if (!res.ok) throw new Error("forecast fetch failed");
  return res.json();
}

/* Group 3-hour slots by day, pick max/min temp + dominant condition */
function groupByDay(list) {
  const map = {};
  list.forEach((item) => {
    const d = new Date(item.dt * 1000);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map[key]) {
      map[key] = { date: d, temps: [], ids: [] };
    }
    map[key].temps.push(item.main.temp);
    map[key].ids.push(item.weather[0].id);
  });

  return Object.values(map).slice(0, 7).map(({ date, temps, ids }) => {
    const high = Math.round(Math.max(...temps));
    const low  = Math.round(Math.min(...temps));
    // pick the most common weather id
    const freq = {};
    ids.forEach((id) => { freq[id] = (freq[id] || 0) + 1; });
    const dominantId = Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
    const type = owmIdToType(dominantId);
    const dayIdx = date.getDay();
    return { day: DAYS[dayIdx], label: LABELS[dayIdx], high, low, type };
  });
}

/* ---------------------------------------------------------- */
/* Skeleton                                                     */
/* ---------------------------------------------------------- */
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-slate-900/40 border border-teal-400/10 rounded-3xl p-8 h-48" />
      <div className="bg-slate-900/40 border border-teal-400/10 rounded-3xl p-6 h-40" />
      <div className="bg-slate-900/40 border border-teal-400/10 rounded-3xl p-6 h-52" />
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Main component                                               */
/* ---------------------------------------------------------- */
function WeatherForecast() {
  const [current, setCurrent]     = useState(null);
  const [days, setDays]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);
  const [lastSync, setLastSync]   = useState(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const [cur, fore] = await Promise.all([fetchCurrent(), fetchForecast()]);

      const type = owmIdToType(cur.weather[0].id);
      setCurrent({
        temp:     Math.round(cur.main.temp),
        feels:    Math.round(cur.main.feels_like),
        low:      Math.round(cur.main.temp_min),
        high:     Math.round(cur.main.temp_max),
        desc:     cur.weather[0].description,
        humidity: cur.main.humidity,
        wind:     Math.round(cur.wind.speed * 3.6), // m/s -> km/h
        type,
        dayLabel: LABELS[new Date().getDay()],
      });

      setDays(groupByDay(fore.list));
      setLastSync(new Date());
    } catch {
      setError("Unable to load weather data. Check your API key or network.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), REFRESH);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Skeleton />;

  if (error) return (
    <div className="bg-slate-900/40 border border-rose-400/20 rounded-3xl p-8 text-center space-y-3">
      <p className="text-rose-300 text-sm font-mono">{error}</p>
      <button onClick={() => load()} className="px-5 py-2 rounded-2xl bg-teal-400/10 border border-teal-400/20 text-teal-300 text-xs font-mono uppercase tracking-widest hover:bg-teal-400/20 transition-all">
        Retry
      </button>
    </div>
  );

  const { Icon: TodayIcon, color: todayColor } = weatherMeta[current.type];
  const allTemps = days.flatMap((d) => [d.high, d.low]);
  const tempMin  = Math.min(...allTemps) - 1;
  const tempMax  = Math.max(...allTemps) + 1;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Weather Forecast</h1>
          <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
            </span>
            Live · {CITY.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Synced {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900/60 border border-teal-400/10 text-teal-400/80 text-[10px] font-mono uppercase tracking-widest hover:border-teal-400/30 hover:bg-teal-400/10 disabled:opacity-40 transition-all"
          >
            <IconRefresh className="w-3 h-3" spin={refreshing} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Today hero ── */}
      <div
        className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-8 relative overflow-hidden"
        style={{ boxShadow: `0 0 60px -20px ${todayColor}55` }}
      >
        <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-20" style={{ background: todayColor }} />

        <div className="flex items-center justify-between gap-6 relative flex-wrap">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80 mb-3">
              <IconCalendar className="w-4 h-4 text-teal-400" />
              Today · {current.dayLabel}
            </h2>
            <div className="flex items-end gap-3">
              <span className="text-7xl font-bold tabular-nums text-white">{current.temp}°</span>
              <span className="text-2xl text-slate-400 mb-2">/ {current.low}°</span>
            </div>
            <p className="text-sm font-mono uppercase tracking-widest mt-2 capitalize" style={{ color: todayColor }}>
              {current.desc}
            </p>

            {/* Extra stats */}
            <div className="flex gap-4 mt-4">
              <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                <IconDrop className="w-3 h-3 text-blue-400" />
                {current.humidity}% humidity
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                <IconWind className="w-3 h-3 text-teal-400" />
                {current.wind} km/h wind
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Feels {current.feels}°
              </span>
            </div>
          </div>

          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center border"
            style={{ background: `${todayColor}15`, borderColor: `${todayColor}40`, color: todayColor, boxShadow: `0 0 30px -8px ${todayColor}` }}
          >
            <TodayIcon className="w-12 h-12" />
          </div>
        </div>

        {/* Temp range bar */}
        <div className="mt-6 relative">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Temperature Range</span>
            <span className="text-[10px] font-mono text-slate-500 tabular-nums">{current.low}° – {current.high}°</span>
          </div>
          <div className="w-full bg-slate-950/60 border border-white/5 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                marginLeft: `${((current.low - tempMin) / (tempMax - tempMin)) * 100}%`,
                width: `${((current.high - current.low) / (tempMax - tempMin)) * 100}%`,
                background: todayColor,
                boxShadow: `0 0 8px ${todayColor}88`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 5-day grid ── */}
      {days.length > 0 && (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80 mb-6">
            <IconCalendar className="w-4 h-4 text-teal-400" />
            5-Day Forecast
          </h2>

          <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
            {days.map(({ day, high, low, type }, i) => {
              const { Icon, color } = weatherMeta[type];
              const isToday = i === 0;
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-2 border transition-all duration-200 cursor-default hover:scale-105
                    ${isToday ? "border-teal-400/30 bg-teal-400/5" : "border-teal-400/10 bg-slate-900/60 hover:border-teal-400/20"}`}
                  style={isToday ? { boxShadow: `0 0 20px -8px ${color}66` } : {}}
                >
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${isToday ? "text-teal-400" : "text-slate-500"}`}>
                    {isToday ? "Now" : day}
                  </span>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${color}15`, borderColor: `${color}35`, color }}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-lg font-bold tabular-nums text-white leading-none">{high}°</span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-500">{low}°</span>
                  <div className="w-full bg-slate-950/60 rounded-full h-1 overflow-hidden">
                    <div className="h-1 rounded-full" style={{
                      marginLeft: `${((low - tempMin) / (tempMax - tempMin)) * 100}%`,
                      width: `${((high - low) / (tempMax - tempMin)) * 100}%`,
                      background: color,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Weekly overview ── */}
      {days.length > 0 && (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80 mb-6">
            <IconCalendar className="w-4 h-4 text-teal-400" />
            Weekly Overview
          </h2>

          <div className="space-y-3">
            {days.map(({ day, label, high, low, type }, i) => {
              const { Icon, color } = weatherMeta[type];
              const isToday = i === 0;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className={`w-20 text-[10px] font-mono uppercase tracking-widest shrink-0 ${isToday ? "text-teal-400" : "text-slate-500"}`}>
                    {isToday ? "Today" : day}
                  </span>
                  <span className="shrink-0 w-7 h-7 rounded-xl flex items-center justify-center border" style={{ background: `${color}15`, borderColor: `${color}35`, color }}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="w-24 text-[10px] font-mono text-slate-400 shrink-0 capitalize">{type.replace("partcloud","Partly cloudy").replace("partrain","Light rain").replace("sunny","Clear skies")}</span>
                  <div className="flex-1 bg-slate-950/60 border border-white/5 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-700" style={{
                      marginLeft: `${((low - tempMin) / (tempMax - tempMin)) * 100}%`,
                      width: `${((high - low) / (tempMax - tempMin)) * 100}%`,
                      background: color,
                      boxShadow: `0 0 6px ${color}66`,
                    }} />
                  </div>
                  <span className="w-10 text-right text-sm font-bold tabular-nums text-white shrink-0">{high}°</span>
                  <span className="w-8 text-right text-[10px] font-mono tabular-nums text-slate-500 shrink-0">{low}°</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

export default WeatherForecast;
