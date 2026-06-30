import { useEffect, useState } from "react";

/* ---------------------------------------------------------- */
/* API key — set VITE_OPENWEATHER_API_KEY in a .env file at    */
/* your project root. Same key used elsewhere in the app.       */
/*                                                                */
/* Accepts an optional `liveData` prop so a parent (e.g.          */
/* Dashboard.jsx) can share one fetch across components instead   */
/* of each one calling OpenWeather independently. Falls back to    */
/* its own fetch if no prop is passed.                              */
/* ---------------------------------------------------------- */
const apiKey = "0b294ed82262f68270ccf92376bfbd87";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CITY = { name: "Bengaluru", lat: 12.9716, lon: 77.5946 };

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

/* Build a feed of observations from current conditions. Each item  */
/* is grounded in an actual reading rather than a fixed script, so   */
/* the feed only shows what's actually happening right now.          */
function buildFeed({ tempC, humidity, windSpeed, rainVolume, weatherMain, aqi }) {
  const items = [];
  const w = (weatherMain || "").toLowerCase();

  if (rainVolume > 1 || (w.includes("rain") && humidity > 80)) {
    items.push({ tone: "rose", icon: "🌊", text: `Flood probability elevated — ${humidity}% humidity with active rainfall.` });
  } else if (w.includes("rain") || humidity > 70) {
    items.push({ tone: "cyan", icon: "🌦", text: "Rainfall conditions detected — monitor drainage in low-lying zones." });
  } else {
    items.push({ tone: "emerald", icon: "💧", text: `Ground saturation normal — humidity steady at ${humidity}%.` });
  }

  if (tempC >= 38) {
    items.push({ tone: "rose", icon: "🔥", text: `Severe heatwave warning — ${Math.round(tempC)}°C recorded.` });
  } else if (tempC >= 33) {
    items.push({ tone: "yellow", icon: "☀", text: `Heatwave watch — temperature reaching ${Math.round(tempC)}°C.` });
  } else {
    items.push({ tone: "emerald", icon: "🌤", text: `Temperature within normal range at ${Math.round(tempC)}°C.` });
  }

  if (aqi > 150) {
    items.push({ tone: "rose", icon: "🏭", text: `Air quality critical — AQI at ${aqi}, limit outdoor exposure.` });
  } else if (aqi > 90) {
    items.push({ tone: "yellow", icon: "🌫", text: `Air quality declining — AQI climbed to ${aqi}.` });
  } else {
    items.push({ tone: "green", icon: "🌳", text: `Air quality healthy — AQI holding at ${aqi}.` });
  }

  if (windSpeed > 12) {
    items.push({ tone: "amber", icon: "🌬", text: `Strong winds recorded at ${windSpeed.toFixed(1)} m/s — secure loose structures.` });
  }

  return items;
}

async function fetchLiveFeed() {
  if (!apiKey) return { error: "missing_key" };

  try {
    const [wRes, pRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${CITY.lat}&lon=${CITY.lon}&appid=${apiKey}&units=metric`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${CITY.lat}&lon=${CITY.lon}&appid=${apiKey}`
      ),
    ]);

    if (!wRes.ok || !pRes.ok) throw new Error("Live data request failed");

    const w = await wRes.json();
    const p = await pRes.json();

    const pm25 = p?.list?.[0]?.components?.pm2_5 ?? 0;
    const aqi = pm25ToAQI(pm25);
    const tempC = w?.main?.temp ?? 25;
    const humidity = w?.main?.humidity ?? 0;
    const windSpeed = w?.wind?.speed ?? 0;
    const rainVolume = w?.rain?.["1h"] ?? w?.rain?.["3h"] ?? 0;
    const weatherMain = w?.weather?.[0]?.main ?? "—";

    return {
      feed: buildFeed({ tempC, humidity, windSpeed, rainVolume, weatherMain, aqi }),
      timestamp: new Date(),
      error: null,
    };
  } catch (err) {
    return { error: "fetch_failed" };
  }
}

const toneBorder = {
  rose: "border-rose-500",
  amber: "border-amber-500",
  yellow: "border-yellow-400",
  emerald: "border-emerald-500",
  green: "border-emerald-400",
  cyan: "border-cyan-400",
};

/* ---------------------------------------------------------- */
/* Icons — matches the rest of the app                          */
/* ---------------------------------------------------------- */
const IconCpu = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
  </svg>
);

const IconAlertTriangle = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

function AICommandFeed({ liveData }) {
  const [internalLive, setInternalLive] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const usingExternalData = liveData !== undefined;

  useEffect(() => {
    if (usingExternalData) return; // parent is supplying data — skip own fetch
    let active = true;

    const load = async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      const snapshot = await fetchLiveFeed();
      if (active) {
        setInternalLive(snapshot);
        setRefreshing(false);
      }
    };

    load();
    const interval = setInterval(() => load(true), REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [usingExternalData]);

  const live = usingExternalData ? liveData : internalLive;
  const hasLiveData = live && !live.error;

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6 transition-colors hover:border-teal-400/20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
          <IconCpu className="w-3.5 h-3.5 text-teal-400" />
          Live AI Analysis
        </h2>

        <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                refreshing ? "bg-amber-400" : "bg-teal-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                refreshing ? "bg-amber-400" : "bg-teal-400"
              }`}
            />
          </span>
          {refreshing
            ? "Syncing"
            : hasLiveData
            ? live.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "—"}
        </span>
      </div>

      {live?.error === "missing_key" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-2">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          Missing VITE_OPENWEATHER_API_KEY — add it to your .env file to power live analysis.
        </div>
      )}

      {live?.error === "fetch_failed" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-2">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          Couldn't reach the weather service. Showing the last known reading.
        </div>
      )}

      {!live && (
        <div className="space-y-4 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-800/60 rounded-xl" />
          ))}
        </div>
      )}

      {hasLiveData && (
        <div className="space-y-4">
          {live.feed.map((item, i) => (
            <div
              key={i}
              className={`bg-slate-950/40 border border-white/5 p-4 rounded-xl border-l-4 ${toneBorder[item.tone]} text-sm text-slate-200`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AICommandFeed;
