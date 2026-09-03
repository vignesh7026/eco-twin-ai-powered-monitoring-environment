import { useEffect, useState } from "react";
import { getBackendUrl } from "../lib/backendUrl";

/* ---------------------------------------------------------- */
/* Event history now comes from GET /api/timeline/events, which  */
/* reads the logged Reading collection (falling back to a live    */
/* OpenWeatherMap snapshot server-side when history is sparse)     */
/* instead of this component polling OpenWeatherMap directly and   */
/* diffing/persisting to localStorage itself.                       */
/* ---------------------------------------------------------- */
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const toneDot = {
  rose: "bg-rose-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  cyan: "bg-cyan-400",
  slate: "bg-slate-500",
};

/* ---------------------------------------------------------- */
/* Icons — matches the rest of the app                          */
/* ---------------------------------------------------------- */
const IconHistory = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 5v5h5" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconAlertTriangle = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

function EnvironmentalTimeline() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/timeline/events?hours=24`);
        if (!res.ok) throw new Error("timeline request failed");
        const { data } = await res.json();
        if (active) {
          setHistory(data || []);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6 transition-colors hover:border-teal-400/20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
          <IconHistory className="w-3.5 h-3.5 text-teal-400" />
          Environmental Timeline
        </h2>
        <span className="text-[10px] font-mono text-slate-500">Bengaluru</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-4">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          Couldn't reach the timeline service. Retrying shortly.
        </div>
      )}

      {(history.length === 0 && !error) && (
        loading ? (
          <div className="space-y-3 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 bg-slate-800/60 rounded-xl" />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-2">
            No significant AQI movement in the last 24 hours — the feed will populate as
            conditions change.
          </p>
        )
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          {history.map((entry, i) => (
            <div
              key={`${entry.time}-${i}`}
              className="flex items-center gap-3 bg-slate-950/40 border border-white/5 p-4 rounded-xl"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${toneDot[entry.tone]}`} />
              <p className="text-sm text-slate-200">
                <span className="font-mono text-slate-500 mr-2">{entry.time}</span>
                {entry.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EnvironmentalTimeline;
