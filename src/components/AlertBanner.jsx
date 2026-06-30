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

function getFloodAssessment(weatherMain, humidity, rainVolume) {
  const w = (weatherMain || "").toLowerCase();

  if (rainVolume > 4 || (w.includes("rain") && humidity > 85)) {
    return { level: "High", impact: "Severe", tone: "rose" };
  }
  if (rainVolume > 1 || w.includes("rain") || humidity > 75) {
    return { level: "Moderate", impact: "Moderate", tone: "amber" };
  }
  return { level: "Low", impact: "Minimal", tone: "emerald" };
}

async function fetchLiveAlert() {
  if (!apiKey) return { error: "missing_key" };

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${CITY.lat}&lon=${CITY.lon}&appid=${apiKey}&units=metric`
    );
    if (!res.ok) throw new Error("Live data request failed");

    const w = await res.json();
    const humidity = w?.main?.humidity ?? 0;
    const weatherMain = w?.weather?.[0]?.main ?? "—";
    const rainVolume = w?.rain?.["1h"] ?? w?.rain?.["3h"] ?? 0;

    return { assessment: getFloodAssessment(weatherMain, humidity, rainVolume), error: null };
  } catch (err) {
    return { error: "fetch_failed" };
  }
}

const toneStyles = {
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-300",
    heading: "text-rose-400",
    icon: "text-rose-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-200",
    heading: "text-amber-400",
    icon: "text-amber-400",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-200",
    heading: "text-emerald-400",
    icon: "text-emerald-400",
  },
};

/* ---------------------------------------------------------- */
/* Icons — matches the rest of the app                          */
/* ---------------------------------------------------------- */
const IconDroplet = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.7l5.7 6.6a7 7 0 11-11.4 0z" />
  </svg>
);

const IconAlertTriangle = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const IconX = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

function AlertBanner({ liveData }) {
  const [internalLive, setInternalLive] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const usingExternalData = liveData !== undefined;

  useEffect(() => {
    if (usingExternalData) return; // parent is supplying data — skip own fetch
    let active = true;

    const load = async () => {
      const snapshot = await fetchLiveAlert();
      if (active) setInternalLive(snapshot);
    };

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [usingExternalData]);

  const live = usingExternalData ? liveData : internalLive;

  if (dismissed) return null;

  // Missing key / fetch failure — calm, neutral notice, not a false flood alarm
  if (live?.error) {
    return (
      <div className="flex items-center justify-between gap-3 bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 text-slate-300 p-4 rounded-2xl mb-6">
        <div className="flex items-center gap-3">
          <IconAlertTriangle className="w-5 h-5 text-slate-500 shrink-0" />
          <p className="text-sm">
            {live.error === "missing_key"
              ? "Flood monitoring is offline — add VITE_OPENWEATHER_API_KEY to enable live alerts."
              : "Couldn't reach the weather service. Retrying shortly."}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <IconX />
        </button>
      </div>
    );
  }

  // Still loading on first mount
  if (!live) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-2xl p-4 mb-6 h-[88px] animate-pulse" />
    );
  }

  const { level, impact, tone } = live.assessment;
  const styles = toneStyles[tone];

  // Low risk: keep it visible but quiet, not an alarm banner
  if (level === "Low") {
    return (
      <div
        className={`flex items-center justify-between gap-3 ${styles.bg} border ${styles.border} text-white p-4 rounded-2xl mb-6`}
      >
        <div className="flex items-center gap-3">
          <IconDroplet className={`${styles.icon} shrink-0`} />
          <p className={`text-sm ${styles.text}`}>
            No active flood risk detected near {CITY.name}.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <IconX />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${styles.bg} border ${styles.border} text-white p-5 rounded-2xl mb-6`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <IconX />
      </button>

      <h2 className={`flex items-center gap-2 font-bold text-xl ${styles.heading}`}>
        <IconAlertTriangle className="w-5 h-5" />
        Flood Risk Detected
      </h2>

      <div className="mt-3 grid sm:grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Location</p>
          <p className={`font-semibold ${styles.text}`}>{CITY.name}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Risk Level</p>
          <p className={`font-semibold ${styles.heading}`}>{level}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Predicted Impact</p>
          <p className={`font-semibold ${styles.text}`}>{impact}</p>
        </div>
      </div>
    </div>
  );
}

export default AlertBanner;
