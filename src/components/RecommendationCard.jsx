import { useEffect, useState } from "react";

/* ---------------------------------------------------------- */
/* Config                                                       */
/* ---------------------------------------------------------- */
const API_KEY = "0b294ed82262f68270ccf92376bfbd87";
const CITY    = { name: "Bengaluru", lat: 12.9716, lon: 77.5946 };
const REFRESH = 10 * 60 * 1000;

/* ---------------------------------------------------------- */
/* Inline icons                                                 */
/* ---------------------------------------------------------- */
const IconLeaf = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21c8 0 14-6 14-15-9 0-15 6-15 14 0 .3 0 .7.1 1z" /><path d="M5 21c2-5 5-8 9-10" />
  </svg>
);
const IconBus = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 11h18M8 6V4M16 6V4" />
    <circle cx="7.5" cy="19.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="19.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
const IconFactory = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21V11l5 3v-3l5 3V8l6 4v9z" /><path d="M8 21v-4M13 21v-4" />
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
const IconWind = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10a3 3 0 100-6" /><path d="M3 14h13a3 3 0 110 6" />
  </svg>
);
const IconThermo = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
  </svg>
);
const IconBolt = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
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
/* PM2.5 -> AQI                                                 */
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
/* Build context-aware recommendations from live data          */
/* ---------------------------------------------------------- */
function buildRecs({ aqi, temp, humidity, windSpeed, weatherId, rain }) {
  const recs = [];

  /* --- AQI / air quality --- */
  if (aqi > 150) {
    recs.push({
      Icon: IconFactory, color: "#fb7185",
      title: "Emergency Emission Controls",
      desc: `AQI is critically high at ${aqi}. Enforce immediate industrial shutdowns and restrict heavy vehicles in central zones.`,
      impact: "Critical", impactColor: "#fb7185", priority: 1,
    });
  } else if (aqi > 100) {
    recs.push({
      Icon: IconFactory, color: "#fbbf24",
      title: "Reduce Industrial Output",
      desc: `AQI at ${aqi} is unhealthy. Mandate industrial emission caps and increase scrubber compliance checks.`,
      impact: "High", impactColor: "#34d399", priority: 2,
    });
  } else {
    recs.push({
      Icon: IconLeaf, color: "#34d399",
      title: "Sustain Air Quality Gains",
      desc: `AQI is at a healthy ${aqi}. Maintain green cover and continue low-emission policies to preserve this baseline.`,
      impact: "Low", impactColor: "#2dd4bf", priority: 5,
    });
  }

  /* --- Temperature / heat --- */
  if (temp > 35) {
    recs.push({
      Icon: IconThermo, color: "#fb923c",
      title: "Heat Alert — Cool Zones Needed",
      desc: `At ${temp}°C, urban heat stress is severe. Open cooling centers and restrict outdoor work between 11am–4pm.`,
      impact: "High", impactColor: "#34d399", priority: 2,
    });
  } else if (temp > 30) {
    recs.push({
      Icon: IconSun, color: "#fbbf24",
      title: "Solar Energy Opportunity",
      desc: `High temperature of ${temp}°C means strong solar irradiance. Ideal conditions to maximise rooftop solar generation today.`,
      impact: "Moderate", impactColor: "#fbbf24", priority: 3,
    });
  }

  /* --- Humidity / flooding --- */
  if (humidity > 85 && rain) {
    recs.push({
      Icon: IconDrop, color: "#60a5fa",
      title: "Flood Risk — Drain Inspection",
      desc: `Humidity at ${humidity}% with active rainfall. Deploy drain-clearing crews to flood-prone wards immediately.`,
      impact: "High", impactColor: "#34d399", priority: 2,
    });
  } else if (humidity > 70) {
    recs.push({
      Icon: IconDrop, color: "#60a5fa",
      title: "Monitor Drainage Systems",
      desc: `Humidity of ${humidity}% raises waterlogging risk. Pre-position pump units and inspect low-lying drainage channels.`,
      impact: "Moderate", impactColor: "#fbbf24", priority: 3,
    });
  }

  /* --- Wind --- */
  if (windSpeed > 30) {
    recs.push({
      Icon: IconWind, color: "#a78bfa",
      title: "High Wind Advisory",
      desc: `Wind speed at ${windSpeed} km/h. Secure construction scaffolding, suspend aerial spraying, and alert tree-felling crews.`,
      impact: "High", impactColor: "#34d399", priority: 2,
    });
  } else if (windSpeed > 15 && aqi > 80) {
    recs.push({
      Icon: IconWind, color: "#a78bfa",
      title: "Dispersion Conditions Favourable",
      desc: `Wind at ${windSpeed} km/h can disperse pollutants. Schedule controlled burns or industrial flaring during this window.`,
      impact: "Moderate", impactColor: "#fbbf24", priority: 3,
    });
  }

  /* --- Transport (always relevant) --- */
  recs.push({
    Icon: IconBus, color: "#2dd4bf",
    title: "Boost Public Transport",
    desc: aqi > 100
      ? `With AQI at ${aqi}, encourage commuters to switch to buses and metro to cut vehicular load significantly.`
      : `Continuing to grow public transport ridership will protect the current AQI of ${aqi} from deteriorating.`,
    impact: aqi > 100 ? "High" : "Moderate",
    impactColor: aqi > 100 ? "#34d399" : "#fbbf24",
    priority: aqi > 100 ? 2 : 4,
  });

  /* Sort by priority and return top 5 */
  return recs.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

/* ---------------------------------------------------------- */
/* Skeleton                                                     */
/* ---------------------------------------------------------- */
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-slate-900/60 border border-teal-400/10 rounded-2xl h-24" />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Main component                                               */
/* ---------------------------------------------------------- */
function RecommendationCard() {
  const [recs, setRecs]           = useState([]);
  const [snapshot, setSnapshot]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);
  const [lastSync, setLastSync]   = useState(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const [wRes, pRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${CITY.lat}&lon=${CITY.lon}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${CITY.lat}&lon=${CITY.lon}&appid=${API_KEY}`),
      ]);
      if (!wRes.ok || !pRes.ok) throw new Error("fetch failed");

      const w = await wRes.json();
      const p = await pRes.json();

      const pm25      = p?.list?.[0]?.components?.pm2_5 ?? 0;
      const aqi       = pm25ToAQI(pm25);
      const temp      = Math.round(w?.main?.temp ?? 0);
      const humidity  = w?.main?.humidity ?? 0;
      const windSpeed = Math.round((w?.wind?.speed ?? 0) * 3.6);
      const weatherId = w?.weather?.[0]?.id ?? 800;
      const rain      = weatherId >= 200 && weatherId < 700;

      const snap = { aqi, temp, humidity, windSpeed, weatherId, rain };
      setSnapshot(snap);
      setRecs(buildRecs(snap));
      setLastSync(new Date());
    } catch {
      setError("Unable to load live data. Check API key or network.");
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
    <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px]" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative flex-wrap gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80">
            <IconBolt className="w-4 h-4 text-teal-400" />
            AI Recommendations
          </h2>
          {snapshot && (
            <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Based on live data · AQI {snapshot.aqi} · {snapshot.temp}°C · {snapshot.humidity}% humidity · {snapshot.windSpeed} km/h wind
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900/60 border border-teal-400/10 text-teal-400/80 text-[10px] font-mono uppercase tracking-widest hover:border-teal-400/30 hover:bg-teal-400/10 disabled:opacity-40 transition-all duration-200"
          >
            <IconRefresh className="w-3 h-3" spin={refreshing} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live context badges */}
      {snapshot && (
        <div className="flex flex-wrap gap-2 mb-6 relative">
          {[
            { label: `AQI ${snapshot.aqi}`,          color: snapshot.aqi > 150 ? "#fb7185" : snapshot.aqi > 100 ? "#fbbf24" : "#34d399" },
            { label: `${snapshot.temp}°C`,            color: snapshot.temp > 35 ? "#fb923c" : "#2dd4bf" },
            { label: `${snapshot.humidity}% humidity`,color: snapshot.humidity > 85 ? "#60a5fa" : "#94a3b8" },
            { label: `${snapshot.windSpeed} km/h`,    color: snapshot.windSpeed > 30 ? "#a78bfa" : "#94a3b8" },
            { label: snapshot.rain ? "Rain active" : "Dry", color: snapshot.rain ? "#60a5fa" : "#34d399" },
          ].map(({ label, color }) => (
            <span key={label} className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border"
              style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Separator */}
      <div className="w-full h-px bg-teal-400/10 mb-6" />

      {/* Body */}
      {loading ? <Skeleton /> : error ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-400/20 text-rose-400 flex items-center justify-center">
            <IconAlert className="w-5 h-5" />
          </span>
          <p className="text-slate-400 text-sm">{error}</p>
          <button onClick={() => load()} className="px-5 py-2 rounded-2xl bg-teal-400/10 border border-teal-400/20 text-teal-300 text-[10px] font-mono uppercase tracking-widest hover:bg-teal-400/20 transition-all">
            Retry
          </button>
        </div>
      ) : (
        <ul className="space-y-4 relative">
          {recs.map(({ Icon, title, desc, impact, impactColor, color }, i) => (
            <li key={i} className="bg-slate-900/60 border border-teal-400/10 rounded-2xl p-5 hover:border-teal-400/20 transition-all duration-200">
              <div className="flex items-start gap-4">
                {/* Icon badge */}
                <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border mt-0.5"
                  style={{ background: `${color}15`, borderColor: `${color}35`, color }}>
                  <Icon className="w-4 h-4" />
                </span>

                <div className="flex-1 min-w-0">
                  {/* Title + impact */}
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm font-semibold text-white">{title}</span>
                    <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border"
                      style={{ color: impactColor, borderColor: `${impactColor}40`, background: `${impactColor}10` }}>
                      {impact}
                    </span>
                  </div>
                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecommendationCard;
