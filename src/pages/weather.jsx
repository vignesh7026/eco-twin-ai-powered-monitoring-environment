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
  const [error, setError] = useState(null);

  const forecast = [
    { day: "Mon", icon: "☀️", temp: "31°C" },
    { day: "Tue", icon: "⛅", temp: "29°C" },
    { day: "Wed", icon: "🌧️", temp: "27°C" },
    { day: "Thu", icon: "⛈️", temp: "26°C" },
    { day: "Fri", icon: "☀️", temp: "30°C" },
    { day: "Sat", icon: "🌦️", temp: "28°C" },
    { day: "Sun", icon: "⛅", temp: "29°C" },
  ];

  const hourly = [
    { time: "Now", icon: "⛅", temp: "29°" },
    { time: "2 PM", icon: "☀️", temp: "30°" },
    { time: "4 PM", icon: "🌦️", temp: "29°" },
    { time: "6 PM", icon: "🌧️", temp: "27°" },
    { time: "8 PM", icon: "⛈️", temp: "26°" },
    { time: "10 PM", icon: "🌙", temp: "24°" },
  ];

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // NOTE: never hardcode API keys in client source — anyone can read
        // them from the bundled JS. Set this in your .env file instead,
        // e.g. VITE_OPENWEATHER_API_KEY=xxxx, then reference it here.
        const apiKey = "0b294ed82262f68270ccf92376bfbd87";

        if (!apiKey) {
          setError("Missing OpenWeather API key. Set VITE_OPENWEATHER_API_KEY in your .env file.");
          return;
        }

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Bengaluru&appid=${apiKey}&units=metric`
        );

        const data = await response.json();

        if (data.cod === 200) {
          setWeather(data);
          setError(null);
        } else {
          setError(data.message || "Failed to fetch weather data.");
        }
      } catch (err) {
        setError("Unable to reach the weather service.");
      }
    };

    fetchWeather();

    const interval = setInterval(fetchWeather, 600000);

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
          <div className="mb-6">
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
          {!weather && !error && (
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
              <Section label="7-Day Forecast" Icon={IconCalendar} className="mb-10">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-[32px] p-8">
                  <div className="grid grid-cols-7 gap-4">
                    {forecast.map((item) => (
                      <div
                        key={item.day}
                        className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 text-center transition-colors hover:border-teal-400/20"
                      >
                        <p className="text-slate-400 text-sm font-mono uppercase tracking-wide">{item.day}</p>
                        <div className="text-4xl my-3">{item.icon}</div>
                        <p className="text-white font-semibold tabular-nums">{item.temp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              {/* Hourly */}
              <Section label="Hourly Forecast" Icon={IconClock}>
                <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-[32px] p-8">
                  <div className="grid grid-cols-6 gap-5">
                    {hourly.map((item) => (
                      <div
                        key={item.time}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Weather;
