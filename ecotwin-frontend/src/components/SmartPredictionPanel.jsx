import { useState, useEffect } from "react";

/* ---------------------------------------------------------- */
/* Config                                                       */
/* ---------------------------------------------------------- */
// NOTE: never hardcode API keys in client source — anyone can read them
// from the bundled JS. Set VITE_OPENWEATHER_API_KEY in your .env file.
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const LAT     = 12.9716;
const LON     = 77.5946;
const REFRESH = 10 * 60 * 1000;

/* ---------------------------------------------------------- */
/* Inline icons — matches Simulator.jsx                        */
/* ---------------------------------------------------------- */
const IconBolt = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
  </svg>
);
const IconRain = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 16H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9z" />
    <path d="M8 19v2M12 19v2M16 19v2" />
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
const IconSun = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const IconCloud = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9z" />
  </svg>
);
const IconGauge = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 14l3-4" /><path d="M4 14a8 8 0 1116 0" />
    <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
const IconRefresh = ({ className = "w-4 h-4", spin = false }) => (
  <svg className={`${className} ${spin ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 10-2.6 6.4" /><polyline points="21 5 21 12 14 12" />
  </svg>
);
const IconAlert = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v4" />
    <path d="M10.3 3.9L2.7 17a1.8 1.8 0 001.5 2.7h15.6a1.8 1.8 0 001.5-2.7L13.7 3.9a1.8 1.8 0 00-3.4 0z" />
    <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

/* ---------------------------------------------------------- */
/* AQI helper                                                   */
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

/* ---------------------------------------------------------- */
/* Build predictions from real 5-day/3-hour forecast           */
/* ---------------------------------------------------------- */
function buildPredictions(forecastList, currentAqi, currentHumidity, currentWeatherId) {
  const now   = new Date();
  const slots = forecastList.slice(0, 8); // next 24h in 3h steps

  return slots.map((item) => {
    const time     = new Date(item.dt * 1000);
    const hour     = time.getHours();
    const label    = time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const temp     = Math.round(item.main.temp);
    const humidity = item.main.humidity;
    const weatherId= item.weather[0].id;
    const desc     = item.weather[0].description;
    const windKmh  = Math.round(item.wind.speed * 3.6);
    const pop      = Math.round((item.pop ?? 0) * 100); // probability of precipitation %

    const isRain   = weatherId >= 500 && weatherId < 700;
    const isStorm  = weatherId >= 200 && weatherId < 300;
    const isClear  = weatherId === 800;
    const isNight  = hour >= 20 || hour < 6;

    /* Derive flood risk from humidity + rain probability */
    const floodRisk = Math.min(100, Math.round(pop * 0.6 + (humidity > 80 ? 30 : 10)));

    /* Derive AQI shift — rain washes PM2.5, heat + low wind raises it */
    let aqiDelta = 0;
    if (isRain || isStorm) aqiDelta = -Math.round(currentAqi * 0.15);
    else if (temp > 32 && windKmh < 10) aqiDelta = +Math.round(currentAqi * 0.12);
    else if (isClear && !isNight) aqiDelta = +Math.round(currentAqi * 0.05);
    const projectedAqi = Math.max(10, currentAqi + aqiDelta);

    /* Pick icon */
    let Icon  = IconCloud;
    let color = "#2dd4bf";
    let event = desc.charAt(0).toUpperCase() + desc.slice(1);

    if (isStorm)        { Icon = IconBolt; color = "#a78bfa"; event = "Thunderstorm risk"; }
    else if (isRain)    { Icon = IconRain; color = "#60a5fa"; event = `Rainfall · ${pop}% chance`; }
    else if (isClear)   { Icon = IconSun;  color = "#fbbf24"; event = isNight ? "Clear night" : "Clear skies"; }
    else if (floodRisk > 50) { Icon = IconDrop; color = "#fb7185"; event = `Flood risk ${floodRisk}%`; }
    else if (aqiDelta > 5)   { Icon = IconGauge; color = "#fb923c"; event = `AQI rise likely (+${aqiDelta})`; }
    else if (aqiDelta < -5)  { Icon = IconWind;  color = "#34d399"; event = `AQI improving (${aqiDelta})`; }

    /* Confidence — OWM short-range is reliable; degrades over time */
    const hoursAhead = Math.round((time - now) / 36e5);
    const confidence = Math.max(40, 95 - hoursAhead * 3);

    return { label, temp, humidity, windKmh, pop, floodRisk, projectedAqi, Icon, color, event, confidence, hoursAhead };
  });
}

/* ---------------------------------------------------------- */
/* Skeleton                                                     */
/* ---------------------------------------------------------- */
function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[0,1,2,3].map(i => (
        <div key={i} className="bg-slate-900/60 border border-teal-400/10 rounded-2xl h-20" />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Main component                                               */
/* ---------------------------------------------------------- */
function SmartPredictionPanel() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState(null);
  const [lastSync, setLastSync]       = useState(null);
  const [currentAqi, setCurrentAqi]   = useState(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      if (!API_KEY) throw new Error("Missing OpenWeather API key. Set VITE_OPENWEATHER_API_KEY in your .env file.");

      const [foreRes, pollRes, wxRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${LAT}&lon=${LON}&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`),
      ]);
      if (!foreRes.ok) throw new Error("Forecast fetch failed");

      const fore  = await foreRes.json();
      const poll  = pollRes.ok ? await pollRes.json() : null;
      const wx    = wxRes.ok  ? await wxRes.json()   : null;

      const pm25        = poll?.list?.[0]?.components?.pm2_5 ?? 30;
      const aqi         = pm25ToAQI(pm25);
      const humidity    = wx?.main?.humidity ?? 60;
      const weatherId   = wx?.weather?.[0]?.id ?? 800;

      setCurrentAqi(aqi);
      setPredictions(buildPredictions(fore.list, aqi, humidity, weatherId));
      setLastSync(new Date());
    } catch (e) {
      setError(e.message || "Unable to load forecast data");
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

  return (
    // h-full + flex flex-col: lets this card stretch to match its sibling's
    // height when placed in a `grid items-stretch` or `flex items-stretch` row.
    <div className="h-full flex flex-col bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-[60px]" />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-6 relative flex-wrap shrink-0">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80">
            <IconBolt className="w-4 h-4 text-teal-400" />
            AI Future Forecast
          </h2>
          <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
            </span>
            Live · Next 24h · 3h intervals
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

      {/* Current AQI badge */}
      {currentAqi !== null && (
        <div className="flex items-center gap-2 mb-5 relative shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Baseline AQI</span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
            style={{
              color: currentAqi > 150 ? "#fb7185" : currentAqi > 100 ? "#fbbf24" : "#34d399",
              borderColor: currentAqi > 150 ? "#fb718540" : currentAqi > 100 ? "#fbbf2440" : "#34d39940",
              background: currentAqi > 150 ? "#fb718510" : currentAqi > 100 ? "#fbbf2410" : "#34d39910",
            }}
          >
            {currentAqi}
          </span>
          {lastSync && (
            <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}

      <div className="w-full h-px bg-teal-400/10 mb-5 shrink-0" />

      {/* ── Body ── */}
      {/* flex-1 + overflow-y-auto: list scrolls internally so this card's
          height stays in sync with LiveAQIChart's height, regardless of how
          many forecast slots there are. Without this, more items = taller
          card = misaligned bottom edge against the neighboring panel. */}
      {loading ? (
        <div className="flex-1 overflow-y-auto"><Skeleton /></div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <span className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-400 flex items-center justify-center">
            <IconAlert className="w-5 h-5" />
          </span>
          <p className="text-slate-400 text-sm">{error}</p>
          <button onClick={() => load()} className="px-5 py-2 rounded-2xl bg-teal-400/10 border border-teal-400/20 text-teal-300 text-[10px] font-mono uppercase tracking-widest hover:bg-teal-400/20 transition-all">
            Retry
          </button>
        </div>
      ) : (
        // relative wrapper: flex-1 + min-h-0 gives it the remaining card
        // height (min-h-0 is required inside a flex column or the list
        // won't shrink below its content size and scrolling won't kick in).
        // The fade div below overlays the bottom edge to hint "more below" —
        // the <ul> itself does the actual scrolling.
        <div className="relative flex-1 min-h-0">
          <ul className="forecast-scroll h-full space-y-3 overflow-y-auto pr-2">
            {predictions.map(({ label, temp, humidity, windKmh, pop, floodRisk, projectedAqi, Icon, color, event, confidence }, i) => (
            <li
              key={i}
              className="group bg-slate-900/60 border border-teal-400/10 rounded-2xl p-4 hover:border-teal-400/20 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                {/* Icon badge */}
                <span
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border mt-0.5"
                  style={{ background: `${color}15`, borderColor: `${color}35`, color }}
                >
                  <Icon className="w-4 h-4" />
                </span>

                <div className="flex-1 min-w-0">
                  {/* Time + event */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400/70">{label}</span>
                    <span
                      className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0"
                      style={{ color, borderColor: `${color}40`, background: `${color}10` }}
                    >
                      {confidence}% confidence
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-white mb-2">{event}</p>

                  {/* Mini stats row */}
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { label: "Temp",   value: `${temp}°C` },
                      { label: "Hum",    value: `${humidity}%` },
                      { label: "Wind",   value: `${windKmh}km/h` },
                      { label: "Rain",   value: `${pop}%` },
                      { label: "AQI",    value: projectedAqi },
                    ].map(({ label: l, value: v }) => (
                      <span key={l} className="text-[10px] font-mono text-slate-500">
                        <span className="text-slate-600">{l} </span>{v}
                      </span>
                    ))}
                  </div>

                  {/* Confidence bar */}
                  <div className="mt-2 w-full bg-slate-950/60 border border-white/5 rounded-full h-1 overflow-hidden">
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{ width: `${confidence}%`, background: color, boxShadow: `0 0 6px ${color}66` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
          </ul>

          {/* Bottom fade — signals there's more to scroll to without
              needing a visible scrollbar track. Purely decorative,
              pointer-events-none so it never blocks clicks/scroll. */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900/90 to-transparent rounded-b-2xl" />
        </div>
      )}

      {/* Thin custom scrollbar for the forecast list — matches the teal
          accent instead of the browser default. Webkit + Firefox. */}
      <style>{`
        .forecast-scroll::-webkit-scrollbar { width: 6px; }
        .forecast-scroll::-webkit-scrollbar-track { background: transparent; }
        .forecast-scroll::-webkit-scrollbar-thumb {
          background: rgba(45, 212, 191, 0.25);
          border-radius: 9999px;
        }
        .forecast-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(45, 212, 191, 0.45);
        }
        .forecast-scroll { scrollbar-width: thin; scrollbar-color: rgba(45, 212, 191, 0.25) transparent; }
      `}</style>
    </div>
  );
}

export default SmartPredictionPanel;