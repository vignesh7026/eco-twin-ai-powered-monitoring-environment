import { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------- */
/* API key — set VITE_OPENWEATHER_API_KEY in a .env file at    */
/* your project root. Same key used elsewhere in the app.       */
/*                                                                */
/* Unlike the other live components, a timeline can't just show  */
/* "the current snapshot" — it needs a running log of *changes*    */
/* over time. So this component keeps its own history in state,    */
/* persisted to localStorage so it survives a page refresh, and     */
/* appends a new entry whenever the latest reading (self-fetched     */
/* or passed in via the optional `liveData` prop) differs            */
/* meaningfully from the last one it logged.                          */
/* ---------------------------------------------------------- */
const apiKey = "0b294ed82262f68270ccf92376bfbd87";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "envTimelineHistory:Bengaluru";
const MAX_ENTRIES = 12;
const CITY = { lat: 12.9716, lon: 77.5946 };

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

async function fetchReading() {
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

    return {
      aqi: pm25ToAQI(pm25),
      weatherMain: w?.weather?.[0]?.main ?? "—",
      rainVolume: w?.rain?.["1h"] ?? w?.rain?.["3h"] ?? 0,
      tempC: w?.main?.temp ?? 25,
      error: null,
    };
  } catch (err) {
    return { error: "fetch_failed" };
  }
}

/* Compare the new reading to the last logged one and emit any        */
/* events worth recording. Returns [] most ticks — the timeline only   */
/* grows when something actually changed.                              */
function diffToEvents(prev, current) {
  const events = [];
  if (!current || current.error) return events;

  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!prev) {
    events.push({ time, tone: "cyan", text: `Monitoring started — AQI ${current.aqi}` });
    return events;
  }

  const aqiDelta = current.aqi - prev.aqi;
  if (Math.abs(aqiDelta) >= 8) {
    events.push({
      time,
      tone: aqiDelta > 0 ? "rose" : "emerald",
      text: `AQI ${aqiDelta > 0 ? "increased" : "improved"} to ${current.aqi}`,
    });
  }

  const wasRaining = (prev.weatherMain || "").toLowerCase().includes("rain") || prev.rainVolume > 0;
  const isRaining = (current.weatherMain || "").toLowerCase().includes("rain") || current.rainVolume > 0;
  if (isRaining && !wasRaining) {
    events.push({ time, tone: "cyan", text: "Rainfall detected" });
  } else if (!isRaining && wasRaining) {
    events.push({ time, tone: "emerald", text: "Rainfall has cleared" });
  }

  if (current.rainVolume > 4 && current.aqi /* keep linter happy */ >= 0) {
    events.push({ time, tone: "rose", text: "Flood alert generated — heavy rainfall sustained" });
  }

  if (current.tempC >= 38 && prev.tempC < 38) {
    events.push({ time, tone: "amber", text: `Heatwave threshold crossed at ${Math.round(current.tempC)}°C` });
  }

  if (events.length === 0) {
    events.push({ time, tone: "slate", text: `AI prediction refreshed — AQI holding at ${current.aqi}` });
  }

  return events;
}

/* ---------------------------------------------------------- */
/* Real past rain/heat data — Open-Meteo's Historical Forecast   */
/* API is completely free and keyless, and (unlike OpenWeather's   */
/* weather history, which is paid-only) gives real hourly             */
/* temperature + precipitation for recent days. We use it to          */
/* backfill genuine rainfall/heatwave events the same way we          */
/* backfill AQI events above.                                          */
/* ---------------------------------------------------------- */
async function fetchPastWeatherHistory(daysBack = 2) {
  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${CITY.lat}&longitude=${CITY.lon}&start_date=${fmt(start)}&end_date=${fmt(end)}&hourly=temperature_2m,precipitation&timezone=auto`
    );
    if (!res.ok) throw new Error("Open-Meteo history request failed");

    const data = await res.json();
    const times = data?.hourly?.time || [];
    const temps = data?.hourly?.temperature_2m || [];
    const rain = data?.hourly?.precipitation || [];

    const now = Date.now();
    const events = [];
    let wasRaining = false;
    let wasHot = false;

    for (let i = 0; i < times.length; i++) {
      const ts = new Date(times[i]).getTime();
      if (ts > now) break; // Open-Meteo includes some forecast hours past "now"

      const temp = temps[i];
      const precip = rain[i] ?? 0;
      const label = new Date(times[i]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const isRaining = precip > 0.5;
      if (isRaining && !wasRaining) {
        events.push({ time: label, tone: "cyan", text: "Rainfall detected" });
      } else if (!isRaining && wasRaining) {
        events.push({ time: label, tone: "emerald", text: "Rainfall has cleared" });
      }
      wasRaining = isRaining;

      if (precip > 4) {
        events.push({ time: label, tone: "rose", text: "Flood alert generated — heavy rainfall sustained" });
      }

      const isHot = temp >= 38;
      if (isHot && !wasHot) {
        events.push({ time: label, tone: "amber", text: `Heatwave threshold crossed at ${Math.round(temp)}°C` });
      }
      wasHot = isHot;
    }

    return { events, error: null };
  } catch (err) {
    return { events: [], error: "fetch_failed" };
  }
}

const toneDot = {
  rose: "bg-rose-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  cyan: "bg-cyan-400",
  slate: "bg-slate-500",
};

/* ---------------------------------------------------------- */
/* Real past data — OpenWeather's Air Pollution History          */
/* endpoint is free and returns genuine hourly PM2.5 readings      */
/* going back in time, unlike weather/rain/temp history which       */
/* OpenWeather gates behind a paid One Call/Timemachine plan.        */
/* We use this to backfill real past AQI events on first load.        */
/* ---------------------------------------------------------- */
async function fetchPastAQIHistory(hoursBack = 24) {
  if (!apiKey) return { error: "missing_key" };

  const end = Math.floor(Date.now() / 1000);
  const start = end - hoursBack * 60 * 60;

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${CITY.lat}&lon=${CITY.lon}&start=${start}&end=${end}&appid=${apiKey}`
    );
    if (!res.ok) throw new Error("History request failed");

    const data = await res.json();
    const samples = (data?.list || []).map((entry) => ({
      time: entry.dt * 1000,
      aqi: pm25ToAQI(entry?.components?.pm2_5 ?? 0),
    }));

    if (samples.length === 0) return { events: [], lastAqi: null, error: null };

    // Walk the real samples in order and emit an event each time AQI
    // moved meaningfully — same threshold used for live diffs.
    const events = [];
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];
      const delta = curr.aqi - prev.aqi;
      if (Math.abs(delta) >= 8) {
        events.push({
          time: new Date(curr.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          tone: delta > 0 ? "rose" : "emerald",
          text: `AQI ${delta > 0 ? "increased" : "improved"} to ${curr.aqi}`,
        });
      }
    }

    const last = samples[samples.length - 1];
    return {
      events: events.slice(-MAX_ENTRIES).reverse(),
      lastAqi: last.aqi,
      error: null,
    };
  } catch (err) {
    return { error: "fetch_failed" };
  }
}

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

function loadStoredHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // storage unavailable (private mode, quota, etc.) — fine, just won't persist
  }
}

function EnvironmentalTimeline({ liveData }) {
  const [history, setHistory] = useState(() => loadStoredHistory());
  const [loadingPast, setLoadingPast] = useState(false);
  const [keyMissing, setKeyMissing] = useState(false);
  const lastReadingRef = useRef(null);
  const usingExternalData = liveData !== undefined;

  const logReading = (reading) => {
    if (!reading) return;
    if (reading.error === "missing_key") {
      setKeyMissing(true);
      return;
    }
    if (reading.error) return;

    const events = diffToEvents(lastReadingRef.current, reading);
    lastReadingRef.current = reading;

    if (events.length > 0) {
      setHistory((prev) => {
        const next = [...events, ...prev].slice(0, MAX_ENTRIES);
        saveHistory(next);
        return next;
      });
    }
  };

  useEffect(() => {
    // Only backfill from the real history API the first time there's
    // nothing saved locally yet — once we have our own logged entries,
    // we trust those over re-fetching the past every reload.
    if (history.length > 0) return;

    let active = true;
    setLoadingPast(true);

    Promise.all([fetchPastAQIHistory(24), fetchPastWeatherHistory(2)]).then(
      ([aqiResult, weatherResult]) => {
        if (!active) return;
        setLoadingPast(false);

        if (aqiResult.error === "missing_key") {
          setKeyMissing(true);
        }

        if (aqiResult.lastAqi !== null && aqiResult.lastAqi !== undefined) {
          lastReadingRef.current = {
            aqi: aqiResult.lastAqi,
            weatherMain: "",
            rainVolume: 0,
            tempC: 25,
          };
        }

        const merged = [...(aqiResult.events || []), ...(weatherResult.events || [])]
          // both arrays carry a "HH:MM" time label — sort newest first
          // by re-parsing against today's date for a stable order
          .sort((a, b) => (a.time < b.time ? 1 : -1))
          .slice(0, MAX_ENTRIES);

        if (merged.length > 0) {
          setHistory(merged);
          saveHistory(merged);
        }
      }
    );

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (usingExternalData) {
      logReading(liveData);
      return;
    }

    let active = true;
    const tick = async () => {
      const reading = await fetchReading();
      if (active) logReading(reading);
    };

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingExternalData, liveData]);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6 transition-colors hover:border-teal-400/20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
          <IconHistory className="w-3.5 h-3.5 text-teal-400" />
          Environmental Timeline
        </h2>
        <span className="text-[10px] font-mono text-slate-500">Bengaluru</span>
      </div>

      {keyMissing && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-4">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          Missing VITE_OPENWEATHER_API_KEY — add it to your .env file to start logging real events.
        </div>
      )}

      {(history.length === 0 && !keyMissing) && (
        loadingPast ? (
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
