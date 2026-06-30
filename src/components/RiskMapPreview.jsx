import { useState, useEffect } from "react";

/* ---------------------------------------------------------- */
/* API key                                                      */
/* ---------------------------------------------------------- */
const apiKey = "0b294ed82262f68270ccf92376bfbd87";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const CITIES_BASE = [
  { city: "Delhi",     lat: 28.6139, lon: 77.209,  position: "top-[27%] left-[49%]" },
  { city: "Mumbai",   lat: 19.076,  lon: 72.8777, position: "top-[55%] left-[39%]" },
  { city: "Bengaluru",lat: 12.9716, lon: 77.5946, position: "top-[74%] left-[50%]" },
  { city: "Chennai",  lat: 13.0827, lon: 80.2707, position: "top-[74%] left-[57%]" },
];

/* ---------------------------------------------------------- */
/* Inline icon set — matches Simulator.jsx / Navbar / Sidebar  */
/* ---------------------------------------------------------- */
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

const IconMap = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const IconWind = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1111 8H2" />
    <path d="M12.59 19.41A2 2 0 1014 16H2" />
    <path d="M6.59 11.41A2 2 0 108 15H2" />
  </svg>
);

const IconThermo = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
  </svg>
);

const IconDrop = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6 10 4 14 4 16a8 8 0 0016 0c0-2-2-6-8-14z" />
  </svg>
);

const IconGauge = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 14l3-4" />
    <path d="M4 14a8 8 0 1116 0" />
    <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
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

function getRisk(aqi) {
  if (aqi <= 50)  return { label: "Low",      color: "#34d399" };
  if (aqi <= 100) return { label: "Moderate", color: "#fbbf24" };
  if (aqi <= 150) return { label: "High",     color: "#fb923c" };
  if (aqi <= 200) return { label: "Severe",   color: "#fb7185" };
  return               { label: "Critical",  color: "#c084fc" };
}

function getFloodRisk(weatherMain, humidity) {
  const w = (weatherMain || "").toLowerCase();
  if (w.includes("rain") && humidity > 80) return { label: "High",     color: "#fb7185" };
  if (w.includes("rain") || humidity > 70) return { label: "Moderate", color: "#fbbf24" };
  return                                        { label: "Low",      color: "#34d399" };
}

/* ---------------------------------------------------------- */
/* Fetch                                                        */
/* ---------------------------------------------------------- */
async function fetchCityData(base) {
  const [weatherRes, pollutionRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${base.lat}&lon=${base.lon}&appid=${apiKey}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${base.lat}&lon=${base.lon}&appid=${apiKey}`),
  ]);
  if (!weatherRes.ok || !pollutionRes.ok) throw new Error(`Failed to fetch live data for ${base.city}`);
  const weather   = await weatherRes.json();
  const pollution = await pollutionRes.json();
  const pm25      = pollution?.list?.[0]?.components?.pm2_5 ?? 0;
  const aqi       = pm25ToAQI(pm25);
  const risk      = getRisk(aqi);
  const humidity  = weather?.main?.humidity ?? 0;
  const weatherMain = weather?.weather?.[0]?.main ?? "—";
  const flood     = getFloodRisk(weatherMain, humidity);
  return { ...base, aqi, risk: risk.label, riskColor: risk.color, temp: Math.round(weather?.main?.temp ?? 0), humidity, weatherMain, flood: flood.label, floodColor: flood.color, error: false };
}

/* ---------------------------------------------------------- */
/* City hotspot pin                                             */
/* ---------------------------------------------------------- */
function CityHotspot({ data, isSelected, onSelect }) {
  const color = data.error ? "#475569" : data.riskColor;
  return (
    <button
      onClick={() => onSelect(data.city)}
      className={`absolute ${data.position} group`}
      aria-label={`Select ${data.city}`}
    >
      {/* Outer ping rings */}
      <span className="absolute -left-6 -top-6 w-16 h-16 rounded-full animate-ping opacity-10" style={{ background: color }} />
      <span className="absolute -left-4 -top-4 w-12 h-12 rounded-full animate-pulse opacity-20" style={{ background: color }} />

      {/* Pin dot */}
      <span
        className={`relative flex w-5 h-5 rounded-full ring-2 transition-all duration-200 group-hover:scale-125 ${isSelected ? "ring-white scale-125" : "ring-transparent"}`}
        style={{ background: color, boxShadow: `0 0 12px ${color}99` }}
      />

      {/* City label */}
      <span
        className="absolute left-1/2 -translate-x-1/2 top-7 whitespace-nowrap bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl text-white text-xs font-mono uppercase tracking-widest border transition-all duration-200"
        style={{ borderColor: `${color}40` }}
      >
        {data.city}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------- */
/* Stat row in side panel                                       */
/* ---------------------------------------------------------- */
function StatRow({ Icon, label, value, color }) {
  return (
    <div className="bg-slate-900/60 border border-teal-400/10 rounded-2xl px-4 py-3 flex items-center gap-3">
      <span
        className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border"
        style={{ background: `${color}1a`, borderColor: `${color}40`, color }}
      >
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-base font-bold tabular-nums leading-tight" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Main component                                               */
/* ---------------------------------------------------------- */
function RiskMap3D() {
  const [cityData, setCityData]           = useState([]);
  const [selectedCityName, setSelected]   = useState("Delhi");
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [lastUpdated, setLastUpdated]     = useState(null);

  const loadAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const results = await Promise.all(
      CITIES_BASE.map(async (base) => {
        try   { return await fetchCityData(base); }
        catch { return { ...base, error: true };   }
      })
    );
    setCityData(results);
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => loadAll(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCity = cityData.find((c) => c.city === selectedCityName);

  return (
    <div className="bg-[#0B1120] min-h-screen relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px]" />

      <div className="relative p-6 space-y-6">

        {/* ── Header ── */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">

            <div>
              <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80 mb-1">
                <IconMap className="w-4 h-4 text-teal-400" />
                EcoTwin Risk Intelligence Map
              </h2>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Real-Time Environmental Monitoring
              </h1>
              <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
                </span>
                Live · Sensor network active
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Stat badges */}
              {[
                { label: "Cities Online", value: "24",   color: "#34d399" },
                { label: "Sensors",       value: "1,248",color: "#2dd4bf" },
                { label: "AI Models",     value: "12",   color: "#a78bfa" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-900/60 border border-teal-400/10 rounded-2xl px-4 py-2 flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</span>
                  <span className="text-base font-bold tabular-nums" style={{ color }}>{value}</span>
                </div>
              ))}

              {/* Refresh button */}
              <button
                onClick={() => loadAll(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-teal-400/10 text-teal-400/80 text-[10px] font-mono uppercase tracking-widest hover:border-teal-400/30 hover:bg-teal-400/10 disabled:opacity-40 transition-all duration-200"
              >
                <IconRefresh className="w-3 h-3" spin={refreshing} />
                {refreshing ? "Syncing…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-4">
              Last sync · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

          {/* Missing key warning */}
          {!apiKey && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-300 text-[10px] font-mono uppercase tracking-widest">
              <IconAlert className="w-4 h-4 shrink-0" />
              Missing VITE_OPENWEATHER_API_KEY — add it to a .env file at your project root.
            </div>
          )}
        </div>

        {/* ── Map + Panel ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Map */}
          <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl overflow-hidden">
            <div className="relative h-[680px]">
              <img
                src="/maps/india map.jpg"
                alt="India"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/50" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-transparent to-slate-900/20" />

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                  <div className="flex items-center gap-3 bg-slate-900/80 border border-teal-400/20 rounded-2xl px-5 py-3">
                    <IconRefresh className="w-4 h-4 text-teal-400 animate-spin" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400/80">
                      Syncing live sensor data…
                    </span>
                  </div>
                </div>
              )}

              {/* Hotspots */}
              {(cityData.length ? cityData : CITIES_BASE).map((city) => (
                <CityHotspot
                  key={city.city}
                  data={city}
                  isSelected={city.city === selectedCityName}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>

          {/* City intelligence panel */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6 relative overflow-hidden sticky top-6 self-start">

            {/* Ambient color glow */}
            {selectedCity && !selectedCity.error && (
              <div
                className="pointer-events-none absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] opacity-15 transition-colors duration-500"
                style={{ background: selectedCity.riskColor }}
              />
            )}

            {/* Panel header */}
            <div className="flex items-center justify-between mb-5 relative">
              <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80">
                <IconGauge className="w-4 h-4 text-teal-400" />
                City Intelligence
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${refreshing ? "bg-amber-400" : "bg-teal-400"}`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${refreshing ? "bg-amber-400" : "bg-teal-400"}`} />
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${refreshing ? "text-amber-400/80" : "text-teal-400/80"}`}>
                  {refreshing ? "Syncing" : "Live"}
                </span>
              </div>
            </div>

            {/* City name */}
            <div className="mb-5 relative">
              <h3 className="text-4xl font-bold text-white tracking-tight">
                {selectedCity?.city ?? selectedCityName}
              </h3>
              {selectedCity && !selectedCity.error && (
                <p className="text-[10px] font-mono uppercase tracking-widest mt-1" style={{ color: selectedCity.riskColor }}>
                  {selectedCity.weatherMain} · {selectedCity.humidity}% humidity
                </p>
              )}
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-teal-400/10 mb-5" />

            {/* Data rows */}
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-800/60 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : !selectedCity || selectedCity.error ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-400 flex items-center justify-center">
                  <IconAlert className="w-5 h-5" />
                </span>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Live data unavailable for this city. Will retry on next refresh.
                </p>
              </div>
            ) : (
              <div className="space-y-3 relative">
                <StatRow Icon={IconGauge} label="Risk Level"   value={selectedCity.risk}         color={selectedCity.riskColor} />
                <StatRow Icon={IconWind}  label="AQI"          value={selectedCity.aqi}           color="#2dd4bf" />
                <StatRow Icon={IconThermo}label="Temperature"  value={`${selectedCity.temp}°C`}   color="#60a5fa" />
                <StatRow Icon={IconDrop}  label="Flood Risk"   value={selectedCity.flood}         color={selectedCity.floodColor} />

                {/* AQI progress bar — mirrors Simulator.jsx */}
                <div className="pt-2">
                  <div className="flex justify-between text-slate-300 mb-2 text-sm">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">AQI Impact</span>
                    <span className="text-[10px] font-mono text-slate-500 tabular-nums">{selectedCity.aqi} / 300</span>
                  </div>
                  <div className="w-full bg-slate-950/60 border border-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min((selectedCity.aqi / 300) * 100, 100)}%`,
                        background: selectedCity.riskColor,
                        boxShadow: `0 0 8px ${selectedCity.riskColor}88`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiskMap3D;
