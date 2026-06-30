import { useState, useEffect, Fragment } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ---------------------------------------------------------- */
/* API key — set VITE_OPENWEATHER_API_KEY in a .env file at    */
/* your project root. Same key used by RiskMap3D.               */
/* ---------------------------------------------------------- */
const apiKey = "0b294ed82262f68270ccf92376bfbd87";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/* Static facts that don't change in real time */
const CITY_CONFIG = {
  Bengaluru: { lat: 12.9716, lon: 77.5946, population: "13.6M" },
  Chennai: { lat: 13.0827, lon: 80.2707, population: "11.5M" },
  Mumbai: { lat: 19.076, lon: 72.8777, population: "21.3M" },
  Delhi: { lat: 28.6139, lon: 77.209, population: "32.9M" },
};

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

/* Risk palette stays semantic (green/amber/orange/red) since it encodes      */
/* meaning — only the rest of the UI is unified to the teal/cyan theme.       */
function getRisk(aqi) {
  if (aqi <= 80) return { label: "Low", color: "#34d399" };
  if (aqi <= 130) return { label: "Moderate", color: "#fbbf24" };
  if (aqi <= 170) return { label: "Warning", color: "#fb923c" };
  return { label: "Critical", color: "#fb7185" };
}

function getFloodRisk(weatherMain, humidity) {
  const w = (weatherMain || "").toLowerCase();
  if (w.includes("rain") && humidity > 80) return { label: "High", color: "#fb7185" };
  if (w.includes("rain") || humidity > 70) return { label: "Moderate", color: "#fbbf24" };
  return { label: "Low", color: "#34d399" };
}

function generateInsight({ aqi, floodLabel, humidity }) {
  if (aqi > 170) return `Air quality deterioration detected. AQI may cross ${aqi + 20}.`;
  if (floodLabel === "High") return "Coastal flood probability has increased — monitor rainfall closely.";
  if (floodLabel === "Moderate" && humidity > 75) return "Heavy rainfall expected within 48 hours.";
  if (aqi <= 80) return "Air quality is within healthy limits this period.";
  return "Conditions are stable; continue routine monitoring.";
}

function popToNumber(popStr) {
  return parseFloat(popStr) || 1;
}

/* ---------------------------------------------------------- */
/* Live data fetch per city                                     */
/* ---------------------------------------------------------- */
async function fetchCityLive(name, base) {
  try {
    const [wRes, pRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${base.lat}&lon=${base.lon}&appid=${apiKey}&units=metric`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${base.lat}&lon=${base.lon}&appid=${apiKey}`
      ),
    ]);

    if (!wRes.ok || !pRes.ok) throw new Error(`Failed to fetch live data for ${name}`);

    const w = await wRes.json();
    const p = await pRes.json();

    const pm25 = p?.list?.[0]?.components?.pm2_5 ?? 0;
    const aqi = pm25ToAQI(pm25);
    const risk = getRisk(aqi);
    const humidityVal = w?.main?.humidity ?? 0;
    const weatherMain = w?.weather?.[0]?.main ?? "—";
    const flood = getFloodRisk(weatherMain, humidityVal);
    const tempVal = Math.round(w?.main?.temp ?? 0);
    const carbonIndex = Math.round(aqi * 0.55);

    return {
      city: name,
      aqi,
      risk: risk.label,
      riskColor: risk.color,
      temperature: `${tempVal}°C`,
      humidity: `${humidityVal}%`,
      floodRisk: flood.label,
      floodColor: flood.color,
      carbonIndex,
      insight: generateInsight({ aqi, floodLabel: flood.label, humidity: humidityVal }),
      error: false,
    };
  } catch (err) {
    return { city: name, error: true };
  }
}

/* ---------------------------------------------------------- */
/* Custom glowing-dot marker (avoids Leaflet's default icon     */
/* image path issues entirely)                                  */
/* ---------------------------------------------------------- */
function makeIcon(color) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:26px;height:26px;">
        <span style="position:absolute;inset:-9px;border-radius:50%;background:${color};opacity:0.25;animation:ecoPulse 2s infinite;"></span>
        <span style="position:absolute;inset:0;border-radius:50%;background:${color};box-shadow:0 0 10px 2px ${color};border:2px solid white;"></span>
      </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}

/* ---------------------------------------------------------- */
/* Inline icon set — matches Assistant.jsx / Simulator.jsx /    */
/* Dashboard.jsx / Weather.jsx                                  */
/* ---------------------------------------------------------- */
const IconRefresh = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 10-2.6 6.4" />
    <polyline points="21 5 21 12 14 12" />
  </svg>
);

const IconAlertTriangle = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const IconMap = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />
    <path d="M9 3v15M15 6v15" />
  </svg>
);

const IconSparkle = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
);

/* ---------------------------------------------------------- */
/* Section — consistent eyebrow header, matches Dashboard.jsx   */
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

function StatRow({ label, value, color = "#f8fafc" }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <h3 className="text-3xl font-bold tabular-nums" style={{ color }}>
        {value}
      </h3>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Main component                                                */
/* ---------------------------------------------------------- */
function RiskMap() {
  const [liveData, setLiveData] = useState({});
  const [selectedCityName, setSelectedCityName] = useState("Delhi");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    const names = Object.keys(CITY_CONFIG);
    const results = await Promise.all(
      names.map((name) => fetchCityLive(name, CITY_CONFIG[name]))
    );

    const merged = {};
    results.forEach((r) => {
      merged[r.city] = r;
    });

    setLiveData(merged);
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

  const getCity = (name) => ({ city: name, ...CITY_CONFIG[name], ...liveData[name] });
  const selectedCity = getCity(selectedCityName);

  return (
    <div className="bg-[#0B1120] min-h-screen relative overflow-hidden">
      {/* ambient glow — matches Assistant.jsx / Simulator.jsx / Dashboard.jsx / Weather.jsx */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-72 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px]" />

      <Sidebar />

      <div className="ml-72 relative">
        <Navbar />

        <div className="p-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                Environmental Risk Intelligence
              </h1>
              <p className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
                </span>
                {refreshing ? "Syncing..." : "Live · Climate threat monitoring"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-[10px] font-mono text-slate-500">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <button
                onClick={() => loadAll(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-400/10 border border-teal-400/20 text-teal-300 text-sm hover:bg-teal-400/20 hover:border-teal-400/40 disabled:opacity-50 transition-colors"
              >
                <IconRefresh className={refreshing ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                Refresh
              </button>
            </div>
          </div>

          {!apiKey && (
            <div className="mb-6 flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <IconAlertTriangle />
              Missing VITE_OPENWEATHER_API_KEY — add it to a .env file at your project root to
              enable live data.
            </div>
          )}

          <div className="grid lg:grid-cols-5 gap-8">
            {/* MAP */}
            <div className="lg:col-span-4">
              <Section label="Live Risk Map" Icon={IconMap} className="mb-4">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-[32px] overflow-hidden shadow-[0_0_60px_-15px_rgba(45,212,191,0.25)]">
                  <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "760px", width: "100%" }}>
                    <TileLayer
                      attribution="© OpenStreetMap © CARTO"
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {Object.entries(CITY_CONFIG).map(([name, base]) => {
                      const data = getCity(name);
                      const color = data.error ? "#64748b" : data.riskColor || "#64748b";
                      const radius = popToNumber(base.population) * 1000;

                      return (
                        <Fragment key={name}>
                          <Circle
                            center={[base.lat, base.lon]}
                            radius={radius}
                            pathOptions={{ color, fillColor: color, fillOpacity: 0.35 }}
                            eventHandlers={{ click: () => setSelectedCityName(name) }}
                          />
                          <Marker
                            position={[base.lat, base.lon]}
                            icon={makeIcon(color)}
                            eventHandlers={{ click: () => setSelectedCityName(name) }}
                          >
                            <Popup>
                              {name}
                              <br />
                              AQI: {data.error ? "—" : data.aqi}
                            </Popup>
                          </Marker>
                        </Fragment>
                      );
                    })}
                  </MapContainer>
                </div>
              </Section>
            </div>

            {/* RIGHT PANEL */}
            <div>
              <div className="sticky top-8 bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 shadow-[0_0_60px_-15px_rgba(45,212,191,0.25)] rounded-[32px] p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`relative flex h-2 w-2`}
                  >
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                        refreshing ? "bg-amber-400" : "bg-teal-400"
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        refreshing ? "bg-amber-400" : "bg-teal-400"
                      }`}
                    />
                  </span>
                  <p
                    className={`text-xs font-mono uppercase tracking-widest ${
                      refreshing ? "text-amber-400" : "text-teal-400/80"
                    }`}
                  >
                    {refreshing ? "Syncing..." : "Live data stream"}
                  </p>
                </div>

                <h2 className="text-3xl font-bold text-white mb-8">{selectedCity.city}</h2>

                {loading ? (
                  <div className="space-y-5 animate-pulse">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-10 bg-slate-800/60 rounded-xl" />
                    ))}
                  </div>
                ) : selectedCity.error ? (
                  <p className="text-slate-400 text-sm">
                    Live data is currently unavailable for this city. It'll retry on the next
                    refresh.
                  </p>
                ) : (
                  <div className="space-y-5">
                    <StatRow label="Risk Level" value={selectedCity.risk} color={selectedCity.riskColor} />
                    <StatRow label="AQI" value={selectedCity.aqi} color="#fbbf24" />
                    <StatRow label="Temperature" value={selectedCity.temperature} color="#38bdf8" />
                    <StatRow label="Humidity" value={selectedCity.humidity} color="#2dd4bf" />
                    <StatRow label="Flood Risk" value={selectedCity.floodRisk} color={selectedCity.floodColor} />
                    <StatRow label="Carbon Index" value={selectedCity.carbonIndex} color="#34d399" />
                    <StatRow label="Population" value={selectedCity.population} color="#f8fafc" />
                  </div>
                )}

                {!loading && !selectedCity.error && (
                  <div className="mt-8 p-5 rounded-2xl bg-teal-400/5 border border-teal-400/20">
                    <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-teal-400/80 mb-2">
                      <IconSparkle className="w-3.5 h-3.5" />
                      AI Insight
                    </p>
                    <p className="text-slate-200 text-sm leading-relaxed">{selectedCity.insight}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ecoPulse {
          0% { transform: scale(0.6); opacity: 0.35; }
          70% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default RiskMap;
