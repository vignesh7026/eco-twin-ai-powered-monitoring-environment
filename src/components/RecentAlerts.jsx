import { useEffect, useState, useRef, useCallback } from "react";

// Bengaluru coordinates
const LAT = 12.9716;
const LON = 77.5946;
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 min, same as your original cadence

// ---------------------------------------------------------------------------
// useAnimatedNumber — same as the rest of the suite; import the shared one
// from your hooks folder instead of this local copy if you've already got it
// ---------------------------------------------------------------------------
function useAnimatedNumber(value, duration = 700) {
  const [display, setDisplay] = useState(value ?? 0);
  const fromRef = useRef(value ?? 0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value ?? 0;
    if (from === to) return;
    let raf;
    let start = null;
    const tick = (t) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

// ---------------------------------------------------------------------------
// Custom inline SVG icons (no icon library — matches WeatherWidget etc.)
// ---------------------------------------------------------------------------
function ThermometerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path
        d="M12 14.5V5a2 2 0 1 0-4 0v9.5a3.5 3.5 0 1 0 4 0Z"
        strokeLinejoin="round"
      />
      <line x1="10" y1="7" x2="12" y2="7" strokeLinecap="round" />
    </svg>
  );
}

function CloudRainIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path
        d="M7 14.5a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.5 7a3.5 3.5 0 0 1-.5 7.5h-9Z"
        strokeLinejoin="round"
      />
      <line x1="8" y1="17" x2="7" y2="20.5" strokeLinecap="round" />
      <line x1="12" y1="17" x2="11" y2="20.5" strokeLinecap="round" />
      <line x1="16" y1="17" x2="15" y2="20.5" strokeLinecap="round" />
    </svg>
  );
}

function WindIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M3 8h11.5a2.5 2.5 0 1 0-2.2-3.7" strokeLinecap="round" />
      <path d="M3 12h15a2.5 2.5 0 1 1-2.2 3.7" strokeLinecap="round" />
      <path d="M3 16h8.5a2 2 0 1 0-1.8-3" strokeLinecap="round" />
    </svg>
  );
}

function DropletsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path
        d="M14.5 12.5c0 2.5-2 4.5-4.5 4.5S5.5 15 5.5 12.5C5.5 9.5 10 4 10 4s4.5 5.5 4.5 8.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertTriangleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path
        d="M12 4.5 21 19H3L12 4.5Z"
        strokeLinejoin="round"
      />
      <line x1="12" y1="10" x2="12" y2="14" strokeLinecap="round" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.3 11 14.8l4.5-5.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon({ spinning, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "animate-spin" : ""}
      {...props}
    >
      <path d="M3.5 12a8.5 8.5 0 0 1 14.5-6" />
      <path d="M20.5 12a8.5 8.5 0 0 1-14.5 6" />
      <path d="M18 3v4h-4" />
      <path d="M6 21v-4h4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Alert classification — unchanged logic, just swapped icon references
// ---------------------------------------------------------------------------
function classifyAlerts(current, forecastList) {
  const alerts = [];

  const temp = current?.main?.temp;
  const humidity = current?.main?.humidity;
  const windSpeedKmh = current?.wind?.speed ? current.wind.speed * 3.6 : undefined;
  const windGustKmh = current?.wind?.gust ? current.wind.gust * 3.6 : undefined;

  const next24h = (forecastList || []).slice(0, 8);
  const rainSum24h = next24h.reduce((sum, slot) => sum + (slot.rain?.["3h"] || 0), 0);
  const maxPop = next24h.reduce((max, slot) => Math.max(max, slot.pop ?? 0), 0) * 100;

  if (temp !== undefined && temp >= 34) {
    alerts.push({
      icon: ThermometerIcon,
      level: "high",
      title: "Heatwave Warning",
      detail: `Current temperature ${temp.toFixed(1)}°C — stay hydrated`,
    });
  } else if (temp !== undefined && temp >= 30) {
    alerts.push({
      icon: ThermometerIcon,
      level: "med",
      title: "Elevated Temperature",
      detail: `Current temperature ${temp.toFixed(1)}°C`,
    });
  }

  if (maxPop >= 70) {
    alerts.push({
      icon: CloudRainIcon,
      level: "high",
      title: "Heavy Rain Expected",
      detail: `${maxPop.toFixed(0)}% chance in next 24h, ~${rainSum24h.toFixed(0)}mm forecast`,
    });
  } else if (maxPop >= 40) {
    alerts.push({
      icon: CloudRainIcon,
      level: "med",
      title: "Rain Likely Soon",
      detail: `${maxPop.toFixed(0)}% chance in next 24h, ~${rainSum24h.toFixed(0)}mm forecast`,
    });
  }

  if (rainSum24h >= 20) {
    alerts.push({
      icon: AlertTriangleIcon,
      level: "high",
      title: "Flood Risk Increasing",
      detail: `${rainSum24h.toFixed(0)}mm of rain forecast over 24h — low-lying areas at risk`,
    });
  }

  if (windGustKmh !== undefined && windGustKmh >= 35) {
    alerts.push({
      icon: WindIcon,
      level: "med",
      title: "Strong Wind Gusts",
      detail: `Gusts up to ${windGustKmh.toFixed(0)} km/h`,
    });
  } else if (windSpeedKmh !== undefined && windSpeedKmh >= 30) {
    alerts.push({
      icon: WindIcon,
      level: "med",
      title: "Strong Winds",
      detail: `Sustained winds ${windSpeedKmh.toFixed(0)} km/h`,
    });
  }

  if (humidity !== undefined && humidity >= 85 && temp >= 26) {
    alerts.push({
      icon: DropletsIcon,
      level: "low",
      title: "High Humidity",
      detail: `${humidity}% humidity, feels warmer than actual temp`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      icon: CheckCircleIcon,
      level: "low",
      title: "No Active Alerts",
      detail: "Conditions are currently normal",
    });
  }

  return alerts;
}

const levelStyles = {
  high: "bg-red-500/10 border-red-500/25 text-red-100",
  med: "bg-amber-500/10 border-amber-500/25 text-amber-100",
  low: "bg-sky-500/10 border-sky-500/25 text-sky-100",
};

const iconColor = {
  high: "text-red-400",
  med: "text-amber-400",
  low: "text-sky-400",
};

function timeAgo(date) {
  if (!date) return "";
  const secs = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-slate-500 text-[11px] uppercase tracking-wide">{label}</p>
      <p className="font-bold tabular-nums text-white mt-0.5">{value}</p>
    </div>
  );
}

export default function RecentAlerts() {
  const [current, setCurrent] = useState(null);
  const [forecastList, setForecastList] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [, forceTick] = useState(0); // keeps "Xs/m ago" fresh

  const fetchWeather = useCallback(async (isManual) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      const [currentRes, forecastRes] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`
        ),
      ]);

      if (!currentRes.ok || !forecastRes.ok) {
        const failed = !currentRes.ok ? currentRes : forecastRes;
        const body = await failed.json().catch(() => ({}));
        throw new Error(body?.message || "Weather service unavailable");
      }

      const currentJson = await currentRes.json();
      const forecastJson = await forecastRes.json();

      setCurrent(currentJson);
      setForecastList(forecastJson.list || []);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e.message || "Failed to load weather");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(false);
    const refreshTimer = setInterval(() => fetchWeather(false), REFRESH_INTERVAL_MS);
    const tickTimer = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => {
      clearInterval(refreshTimer);
      clearInterval(tickTimer);
    };
  }, [fetchWeather]);

  const alerts = current && forecastList ? classifyAlerts(current, forecastList) : [];

  const temp = useAnimatedNumber(current?.main?.temp);
  const humidity = useAnimatedNumber(current?.main?.humidity);
  const windKmh = useAnimatedNumber(current ? current.wind.speed * 3.6 : 0);

  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-white w-full overflow-hidden shadow-[0_0_40px_-15px_rgba(45,212,191,0.3)]">
      <div className="absolute -top-20 -right-16 w-56 h-56 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Recent Environmental Alerts</h2>
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-teal-300/80 bg-teal-400/10 border border-teal-400/20 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Live
            </span>
          </div>
          <button
            onClick={() => fetchWeather(true)}
            disabled={refreshing}
            aria-label="Refresh weather data"
            className="p-1.5 rounded-full text-slate-400 hover:text-teal-300 hover:bg-white/5 transition-colors disabled:opacity-60"
          >
            <RefreshIcon spinning={loading || refreshing} className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Bengaluru, Karnataka
          {updatedAt && <> · Updated {timeAgo(updatedAt)}</>}
        </p>

        {loading && !current && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-sm text-red-200">
            Couldn't load live weather: {error}
          </div>
        )}

        {current && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((alert, i) => {
              const Icon = alert.icon;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border backdrop-blur-sm ${levelStyles[alert.level]}`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor[alert.level]}`} />
                  <div>
                    <div className="font-medium text-sm">{alert.title}</div>
                    <div className="text-xs text-white/70 mt-0.5">{alert.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {current?.main && (
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-4">
            <Stat label="Temp" value={`${temp.toFixed(1)}°C`} />
            <Stat label="Humidity" value={`${Math.round(humidity)}%`} />
            <Stat label="Wind" value={`${windKmh.toFixed(0)} km/h`} />
          </div>
        )}
      </div>
    </div>
  );
}
