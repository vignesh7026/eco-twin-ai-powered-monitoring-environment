import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Config — Bengaluru by default, matches the rest of EcoTwin's components
// ---------------------------------------------------------------------------
const LAT = 12.9716;
const LON = 77.5946;
const CITY_FALLBACK = 'Bengaluru';
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 min, same cadence as your other live cards

// ---------------------------------------------------------------------------
// EPA breakpoint AQI formula (PM2.5) — same approach as Simulator/HealthGauge
// ---------------------------------------------------------------------------
const PM25_BREAKPOINTS = [
  { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
  { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

function pm25ToAQI(pm25) {
  if (pm25 == null || Number.isNaN(pm25)) return null;
  const bp =
    PM25_BREAKPOINTS.find((b) => pm25 >= b.cLow && pm25 <= b.cHigh) ||
    PM25_BREAKPOINTS[PM25_BREAKPOINTS.length - 1];
  const { cLow, cHigh, iLow, iHigh } = bp;
  return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow);
}

function aqiAccent(aqi) {
  if (aqi == null) return 'text-slate-400';
  if (aqi <= 50) return 'text-teal-300';
  if (aqi <= 100) return 'text-yellow-300';
  if (aqi <= 150) return 'text-orange-400';
  if (aqi <= 200) return 'text-red-400';
  if (aqi <= 300) return 'text-fuchsia-400';
  return 'text-rose-600';
}

// ---------------------------------------------------------------------------
// useAnimatedNumber — drop this if you already have the shared one;
// import { useAnimatedNumber } from '../hooks/useAnimatedNumber' instead
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
// Custom inline SVG icons (no icon library, matches EcoTwin's icon set)
// ---------------------------------------------------------------------------
function SunIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="12" cy="12" r="4.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="12"
          y1="2.5"
          x2="12"
          y2="5"
          transform={`rotate(${deg} 12 12)`}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.4 6.4 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function CloudIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path
        d="M7.5 17a4 4 0 0 1-.5-7.97A5 5 0 0 1 17 9.5a3.5 3.5 0 0 1-.5 7.5h-9Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PartlyCloudyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="8.5" cy="8.5" r="3.2" />
      <path
        d="M11 17a4 4 0 0 0-.4-7.97 5 5 0 0 0-7.3 4.3A3.3 3.3 0 0 0 4 17h7Z"
        strokeLinejoin="round"
        transform="translate(2.5 0)"
      />
    </svg>
  );
}

function RainIcon(props) {
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

function ThunderIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path
        d="M7 13.5a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.5 6a3.5 3.5 0 0 1-.5 7.5h-9Z"
        strokeLinejoin="round"
      />
      <path d="M12.5 13.5 10 18h3l-1.5 4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function SnowIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path
        d="M7 13.5a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.5 6a3.5 3.5 0 0 1-.5 7.5h-9Z"
        strokeLinejoin="round"
      />
      <g strokeLinecap="round">
        <line x1="8" y1="17" x2="8" y2="21" />
        <line x1="6" y1="19" x2="10" y2="19" />
        <line x1="15" y1="17" x2="15" y2="21" />
        <line x1="13" y1="19" x2="17" y2="19" />
      </g>
    </svg>
  );
}

function MistIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <g strokeLinecap="round">
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="13" x2="17" y2="13" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </g>
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
      className={spinning ? 'animate-spin' : ''}
      {...props}
    >
      <path d="M3.5 12a8.5 8.5 0 0 1 14.5-6" />
      <path d="M20.5 12a8.5 8.5 0 0 1-14.5 6" />
      <path d="M18 3v4h-4" />
      <path d="M6 21v-4h4" />
    </svg>
  );
}

const ICON_MAP = {
  '01d': SunIcon,
  '01n': MoonIcon,
  '02d': PartlyCloudyIcon,
  '02n': PartlyCloudyIcon,
  '03d': CloudIcon,
  '03n': CloudIcon,
  '04d': CloudIcon,
  '04n': CloudIcon,
  '09d': RainIcon,
  '09n': RainIcon,
  '10d': RainIcon,
  '10n': RainIcon,
  '11d': ThunderIcon,
  '11n': ThunderIcon,
  '13d': SnowIcon,
  '13n': SnowIcon,
  '50d': MistIcon,
  '50n': MistIcon,
};

function WeatherIcon({ code, className }) {
  const Icon = ICON_MAP[code] || PartlyCloudyIcon;
  return <Icon className={className} />;
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
function Stat({ label, value, accentClass = 'text-white' }) {
  return (
    <div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`font-bold tabular-nums ${accentClass}`}>{value}</p>
    </div>
  );
}

function timeAgo(date) {
  if (!date) return '';
  const secs = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}

function ShellCard({ children }) {
  return (
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-white overflow-hidden shadow-[0_0_40px_-15px_rgba(45,212,191,0.3)]">
      <div className="absolute -top-20 -right-16 w-56 h-56 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <ShellCard>
      <div className="h-6 w-40 bg-white/10 rounded-md animate-pulse mb-4" />
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-12 w-28 bg-white/10 rounded-md animate-pulse" />
          <div className="h-4 w-32 bg-white/10 rounded-md animate-pulse" />
        </div>
        <div className="h-16 w-16 bg-white/10 rounded-full animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-16 bg-white/10 rounded-md animate-pulse" />
            <div className="h-5 w-10 bg-white/10 rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </ShellCard>
  );
}

function ErrorCard({ onRetry }) {
  return (
    <ShellCard>
      <h2 className="text-xl font-bold mb-2">Current Weather</h2>
      <p className="text-slate-400 text-sm mb-4">
        Couldn't load live conditions right now.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-400/10 border border-teal-400/30 text-teal-300 text-sm font-medium hover:bg-teal-400/20 transition-colors"
      >
        <RefreshIcon className="w-4 h-4" />
        Try again
      </button>
    </ShellCard>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [, forceTick] = useState(0); // re-render every 30s to keep "Xs ago" fresh

  const fetchData = useCallback(async (isManual) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      const [weatherRes, pollutionRes] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${LAT}&lon=${LON}&appid=${apiKey}`
        ),
      ]);

      if (!weatherRes.ok) throw new Error('Weather request failed');
      const weatherJson = await weatherRes.json();
      const pollutionJson = pollutionRes.ok ? await pollutionRes.json() : null;
      const pm25 = pollutionJson?.list?.[0]?.components?.pm2_5 ?? null;

      setWeather(weatherJson);
      setAqi(pm25ToAQI(pm25));
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || 'Unable to fetch weather data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
    const refreshTimer = setInterval(() => fetchData(false), REFRESH_INTERVAL_MS);
    const tickTimer = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => {
      clearInterval(refreshTimer);
      clearInterval(tickTimer);
    };
  }, [fetchData]);

  const temp = useAnimatedNumber(weather?.main?.temp);
  const humidity = useAnimatedNumber(weather?.main?.humidity);
  const windKmh = useAnimatedNumber(weather ? weather.wind.speed * 3.6 : 0);
  const aqiAnimated = useAnimatedNumber(aqi ?? 0);

  if (loading) return <SkeletonCard />;
  if (error) return <ErrorCard onRetry={() => fetchData(true)} />;

  const iconCode = weather?.weather?.[0]?.icon;
  const cityName = weather?.name || CITY_FALLBACK;

  return (
    <ShellCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight">Current Weather</h2>
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-teal-300/80 bg-teal-400/10 border border-teal-400/20 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Live
          </span>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          aria-label="Refresh weather"
          className="p-1.5 rounded-full text-slate-400 hover:text-teal-300 hover:bg-white/5 transition-colors disabled:opacity-60"
        >
          <RefreshIcon spinning={refreshing} className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-5xl font-bold tabular-nums">{Math.round(temp)}°C</p>
          <p className="text-slate-400">{cityName}, Karnataka</p>
        </div>
        <WeatherIcon code={iconCode} className="w-16 h-16 text-cyan-300" />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <Stat label="Humidity" value={`${Math.round(humidity)}%`} />
        <Stat label="Wind" value={`${windKmh.toFixed(1)} km/h`} />
        <Stat
          label="AQI"
          value={aqi != null ? Math.round(aqiAnimated) : '—'}
          accentClass={aqiAccent(aqi)}
        />
      </div>

      {lastUpdated && (
        <p className="mt-4 text-xs text-slate-500">Updated {timeAgo(lastUpdated)}</p>
      )}
    </ShellCard>
  );
}

export default WeatherWidget;
