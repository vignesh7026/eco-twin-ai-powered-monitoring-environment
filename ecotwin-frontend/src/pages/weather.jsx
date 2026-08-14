import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

/* ---------------------------------------------------------- */
/* Inline icon set — matches Assistant.jsx / Simulator.jsx     */
/* ---------------------------------------------------------- */
const IconWind = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10a3 3 0 100-6" />
    <path d="M3 14h13a3 3 0 110 6" />
  </svg>
);

const IconDroplet = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.7l5.7 6.6a7 7 0 11-11.4 0z" />
  </svg>
);

const IconEye = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconGauge = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 14l3-4" />
    <path d="M4 14a8 8 0 1116 0" />
    <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const IconCalendar = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

const IconClock = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const IconAlertTriangle = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const IconRefresh = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

/* ---------------------------------------------------------- */
/* Map OpenWeather's condition "main" field to an emoji         */
/* ---------------------------------------------------------- */
const weatherEmoji = (main) => {
  const map = {
    Clear: "☀️",
    Clouds: "⛅",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
    Haze: "🌫️",
  };
  return map[main] || "🌤️";
};

/* ---------------------------------------------------------- */
/* Section — consistent eyebrow header, matches Dashboard.jsx  */
/* ---------------------------------------------------------- */
function Section({ label, Icon, children, className = "" }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-3.5 h-3.5 text-teal-400" />
        <h2 className="text-xs font-mono uppercase tracking-widest text-teal-400/80">
          {label}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-teal-400/20 to-transparent" />
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, Icon, value, suffix }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6 transition-colors hover:border-teal-400/20">
      <h3 className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">
        <Icon className="w-3.5 h-3.5 text-teal-400" />
        {label}
      </h3>
      <p className="text-4xl font-bold text-white tabular-nums">
        {value}
        {suffix && <span className="text-lg text-slate-400 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function Weather() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    if (!apiKey) {
      setError("Missing OpenWeather API key. Set VITE_OPENWEATHER_API_KEY in your .env file.");
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      try {
        const [currentRes, forecastRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?q=Bengaluru&appid=${apiKey}&units=metric`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Bengaluru&appid=${apiKey}&units=metric`),
        ]);

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        if (currentData.cod !== 200) {
          setError(currentData.message || "Failed to fetch current weather.");
          setLoading(false);
          return;
        }
        if (String(forecastData.cod) !== "200") {
          setError(forecastData.message || "Failed to fetch forecast.");
          setLoading(false);
          return;
        }

        setWeather(currentData);

        // Hourly strip: next 6 slots straight from the API (3-hour steps)
        setHourly(
          forecastData.list.slice(0, 6).map((slot) => ({
            time: new Date(slot.dt * 1000).toLocaleTimeString("en-IN", {
              hour: "numeric",
              hour12: true,
            }),
            icon: weatherEmoji(slot.weather[0].main),
            temp: `${Math.round(slot.main.temp)}°`,
          }))
        );

        // Daily forecast: group 3-hour slots by calendar date
        const byDay = {};
        forecastData.list.forEach((slot) => {
          const date = new Date(slot.dt * 1000);
          const key = date.toLocaleDateString("en-IN");
          if (!byDay[key]) byDay[key] = { temps: [], slots: [], date };
          byDay[key].temps.push(slot.main.temp);
          byDay[key].slots.push(slot);
        });

        const days = Object.values(byDay)
          .slice(0, 5) // free tier forecast covers ~5 days
          .map((day) => {
            // pick the slot closest to 1 PM to represent the day's icon
            const midday = day.slots.reduce((closest, slot) => {
              const h = new Date(slot.dt * 1000).getHours();
              const closestH = new Date(closest.dt * 1000).getHours();
              return Math.abs(h - 13) < Math.abs(closestH - 13) ? slot : closest;
            }, day.slots[0]);

            return {
              day: day.date.toLocaleDateString("en-IN", { weekday: "short" }),
              icon: weatherEmoji(midday.weather[0].main),
              high: Math.round(Math.max(...day.temps)),
              low: Math.round(Math.min(...day.temps)),
            };
          });

        setForecast(days);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        setError("Unable to reach the weather service.");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // refresh every 10 min

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0B1120] min-h-screen relative overflow-hidden">
      {/* ambient glow — matches Assistant.jsx / Simulator.jsx / Dashboard.jsx */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-72 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px]" />

      <Sidebar />

      <div className="ml-72 relative">
        <Navbar />

        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Weather Intelligence
              </h1>
              <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
                </span>
                {error ? "Feed interrupted" : weather ? "Live · Connected to OpenWeather" : "Connecting..."}
              </p>
            </div>
            {lastUpdated && (
              <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                <IconRefresh className="w-3 h-3" />
                Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
              </p>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5 mb-8">
              <IconAlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-rose-400 font-semibold">Weather feed unavailable</h3>
                <p className="text-slate-300 mt-1 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !weather && !error && (
            <div className="space-y-8">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl h-56 animate-pulse" />
              <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl h-32 animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {weather && (
            <>
              {/* Hero */}
              <div className="relative bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 shadow-[0_0_60px_-15px_rgba(45,212,191,0.25)] rounded-[32px] p-10 mb-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 via-cyan-600/5 to-transparent" />
                <div className="relative flex items-center justify-between flex-wrap gap-6">
                  <div>
                    <p className="text-teal-300 text-lg mb-2 font-mono uppercase tracking-widest text-xs">
                      {weather.name}
                    </p>
                    <h2 className="text-7xl md:text-8xl font-black text-white tabular-nums">
                      {Math.round(weather.main.temp)}°
                    </h2>
                    <p className="text-2xl text-slate-300 mt-2">
                      {weather.weather[0].main}
                    </p>
                    <p className="text-slate-500 mt-3 text-sm">
                      Feels like {Math.round(weather.main.feels_like)}°C
                    </p>
                  </div>

                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                    alt={weather.weather[0].description || "weather icon"}
                    className="w-36 h-36 drop-shadow-[0_0_30px_rgba(45,212,191,0.35)]"
                  />
                </div>
              </div>

              {/* Weather Metrics */}
              <Section label="Current Conditions" Icon={IconGauge} className="mb-10">
                <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
                  <MetricCard label="Humidity" Icon={IconDroplet} value={weather.main.humidity} suffix="%" />
                  <MetricCard label="Wind Speed" Icon={IconWind} value={weather.wind.speed} suffix="m/s" />
                  <MetricCard label="Visibility" Icon={IconEye} value={(weather.visibility / 1000).toFixed(1)} suffix="km" />
                  <MetricCard label="Pressure" Icon={IconGauge} value={weather.main.pressure} suffix="hPa" />
                </div>
              </Section>

              {/* Forecast */}
              {forecast.length > 0 && (
                <Section label="5-Day Forecast" Icon={IconCalendar} className="mb-10">
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-[32px] p-8">
                    <div className="grid grid-cols-5 gap-4">
                      {forecast.map((item, i) => (
                        <div
                          key={`${item.day}-${i}`}
                          className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 text-center transition-colors hover:border-teal-400/20"
                        >
                          <p className="text-slate-400 text-sm font-mono uppercase tracking-wide">{item.day}</p>
                          <div className="text-4xl my-3">{item.icon}</div>
                          <p className="text-white font-semibold tabular-nums">
                            {item.high}° <span className="text-slate-500">{item.low}°</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>
              )}

              {/* Hourly */}
              {hourly.length > 0 && (
                <Section label="Upcoming Hours" Icon={IconClock}>
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-[32px] p-8">
                    <div className="grid grid-cols-6 gap-5">
                      {hourly.map((item, i) => (
                        <div
                          key={`${item.time}-${i}`}
                          className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 text-center transition-colors hover:border-teal-400/20"
                        >
                          <p className="text-slate-500 text-xs font-mono uppercase tracking-wide">{item.time}</p>
                          <div className="text-3xl my-3">{item.icon}</div>
                          <p className="text-white font-bold tabular-nums">{item.temp}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Weather;