import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AlertBanner from "../components/AlertBanner";
import WeatherWidget from "../components/WeatherWidget";
import RecommendationCard from "../components/RecommendationCard";
import StatCard from "../components/StatCard";
import RecentAlerts from "../components/RecentAlerts";
import RiskMapPreview from "../components/RiskMapPreview";
import WeatherForecast from "../components/WeatherForecast";
import RiskRadar from "../components/RiskRadar";
import DigitalTwinPanel from "../components/DigitalTwinPanel";
import HealthGauge from "../components/HealthGauge";
import AICommandFeed from "../components/AICommandFeed";
import Earth3D from "../components/Earth3D";
import LiveAQIChart from "../components/LiveAQIChart";
import SmartPredictionPanel from "../components/SmartPredictionPanel";
import AIOrb from "../components/AIOrb";

/* ---------------------------------------------------------- */
/* API key                                                      */
/* ---------------------------------------------------------- */
// NOTE: never hardcode API keys in client source — anyone can read them
// from the bundled JS. Set VITE_OPENWEATHER_API_KEY in your .env file.
const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const CITY = { name: "Bengaluru", lat: 12.9716, lon: 77.5946 };

/* ---------------------------------------------------------- */
/* PM2.5 -> AQI                                                 */
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

function getRiskLabel(aqi) {
  if (aqi <= 80) return "Low";
  if (aqi <= 130) return "Moderate";
  if (aqi <= 170) return "Warning";
  return "Critical";
}

async function fetchLiveSnapshot() {
  if (!apiKey) return { error: "missing_key" };
  try {
    const [wRes, pRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${CITY.lat}&lon=${CITY.lon}&appid=${apiKey}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${CITY.lat}&lon=${CITY.lon}&appid=${apiKey}`),
    ]);
    if (!wRes.ok || !pRes.ok) throw new Error("Live data request failed");
    const w = await wRes.json();
    const p = await pRes.json();
    const pm25 = p?.list?.[0]?.components?.pm2_5 ?? 0;
    const aqi = pm25ToAQI(pm25);
    const tempVal = Math.round(w?.main?.temp ?? 0);
    const carbonIndex = Math.round(aqi * 0.55);
    return { aqi, temperature: `${tempVal}°C`, carbonIndex, risk: getRiskLabel(aqi), error: null };
  } catch {
    return { error: "fetch_failed" };
  }
}

/* ---------------------------------------------------------- */
/* Inline icons                                                 */
/* ---------------------------------------------------------- */
const IconWind = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10a3 3 0 100-6" />
    <path d="M3 14h13a3 3 0 110 6" />
  </svg>
);

const IconMap = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />
    <path d="M9 3v15M15 6v15" />
  </svg>
);

const IconActivity = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const IconCpu = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
  </svg>
);

const IconGrid = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconCloudSun = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19a4.5 4.5 0 000-9 6 6 0 10-11.4 2A4 4 0 007 19h10.5z" />
    <path d="M4 4l1.5 1.5M20 4l-1.5 1.5" />
  </svg>
);

const IconRadar = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 12 L12 4 A8 8 0 0 1 18 8 Z" fill="currentColor" stroke="none" opacity="0.3" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

const IconBolt = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
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
/* Section header                                               */
/* ---------------------------------------------------------- */
function Section({ id, label, Icon, children, className = "" }) {
  return (
    <div id={id} className={`px-8 mt-10 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-3.5 h-3.5 text-teal-400" />
        <h2 className="text-xs font-mono uppercase tracking-widest text-teal-400/80">{label}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-teal-400/20 to-transparent" />
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Dashboard                                                    */
/* ---------------------------------------------------------- */
function Dashboard() {
  const [live, setLive] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      const snapshot = await fetchLiveSnapshot();
      if (active) { setLive(snapshot); setRefreshing(false); }
    };
    load();
    const interval = setInterval(() => load(true), REFRESH_INTERVAL_MS);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const hasLiveData = live && !live.error;

  return (
    <div className="bg-[#0B1120] min-h-screen relative overflow-hidden">
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-72 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px]" />

      <Sidebar />

      <div className="ml-72 relative">
        <Navbar />

        {/* Status strip */}
        <div className="px-8 pt-6 flex items-center justify-between flex-wrap gap-2">
          <p className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${refreshing ? "bg-amber-400" : "bg-teal-400"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${refreshing ? "bg-amber-400" : "bg-teal-400"}`} />
            </span>
            {refreshing ? "Syncing live data..." : hasLiveData ? `Live · ${CITY.name} sensor mesh synced` : "Awaiting live data feed"}
          </p>
        </div>

        {live?.error === "missing_key" && (
          <div className="px-8 mt-4">
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <IconAlertTriangle />
              Missing VITE_OPENWEATHER_API_KEY — add it to a .env file at your project root.
            </div>
          </div>
        )}

        {/* Earth Hero */}
        <div className="p-8 pt-4">
          <div className="rounded-3xl border border-teal-400/10 shadow-[0_0_80px_-20px_rgba(45,212,191,0.25)] overflow-hidden">
            <Earth3D />
          </div>
        </div>

        {/* Alert Banner */}
        <div className="px-8">
          <AlertBanner />
        </div>

        {/* AQI Analytics + AI Forecast */}
        <Section id="aqi" label="Live AQI &amp; AI Forecast" Icon={IconWind}>
          {/* Fixed row height via inline style, not a Tailwind arbitrary-value
              class — if h-[640px] isn't being generated by your Tailwind
              build for any reason, it fails silently and this row falls
              back to auto height, which is exactly the bug we're chasing.
              An inline style always applies regardless of Tailwind config. */}
          <div className="grid grid-cols-3 gap-8" style={{ height: "640px", overflow: "hidden" }}>
            <div className="col-span-2" style={{ height: "100%", overflow: "hidden" }}><LiveAQIChart /></div>
            <div style={{ height: "100%", overflow: "hidden" }}><SmartPredictionPanel /></div>
          </div>
        </Section>

        {/* Digital Twin Overview */}
        <Section id="twin" label="Digital Twin Overview" Icon={IconCpu}>
          <DigitalTwinPanel />
        </Section>

        {/* Risk Intelligence Map */}
        <Section id="risk-map" label="Risk Intelligence Map" Icon={IconMap}>
          <RiskMapPreview />
        </Section>

        {/* Environmental Health */}
        <Section id="health" label="Environmental Health" Icon={IconActivity}>
          <div className="grid grid-cols-2 gap-8">
            <HealthGauge />
            <AICommandFeed />
          </div>
        </Section>

        {/* KPI Cards */}
        <Section id="kpis" label={`Key Indicators · ${CITY.name}`} Icon={IconGrid}>
          <div className="grid grid-cols-4 gap-6">
            <StatCard title="AQI"          value={hasLiveData ? String(live.aqi)          : live === null ? "—" : "N/A"} />
            <StatCard title="Temperature"  value={hasLiveData ? live.temperature           : live === null ? "—" : "N/A"} />
            <StatCard title="Carbon Index" value={hasLiveData ? String(live.carbonIndex)   : live === null ? "—" : "N/A"} />
            <StatCard title="Risk Score"   value={hasLiveData ? live.risk                  : live === null ? "—" : "N/A"} />
          </div>
        </Section>

        {/* Weather */}
        <Section id="trends" label="Weather" Icon={IconCloudSun}>
          <WeatherWidget />
        </Section>

        {/* Weather Forecast — full width now that ClimateSimulator is removed */}
        <Section id="forecast" label="Forecast" Icon={IconCloudSun}>
          <WeatherForecast />
        </Section>

        {/* Risk Radar */}
        <Section id="radar" label="Risk Radar" Icon={IconRadar}>
          <RiskRadar />
        </Section>

        {/* AI Recommendations */}
        <Section id="recommendations" label="AI Recommendations" Icon={IconBolt}>
          <RecommendationCard />
        </Section>

        {/* Alert History */}
        <Section id="alerts" label="Alert History" Icon={IconClock} className="mb-12">
          <RecentAlerts />
        </Section>

        {/* Floating AI Assistant */}
        <AIOrb />
      </div>
    </div>
  );
}

export default Dashboard;