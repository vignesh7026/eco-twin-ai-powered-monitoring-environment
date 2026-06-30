import Sidebar from "../components/Sidebar";
import { useMemo, useState } from "react";

/* ---------------------------------------------------------- */
/* Inline icon set — matches Assistant.jsx convention          */
/* ---------------------------------------------------------- */
const IconLeaf = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21c8 0 14-6 14-15-9 0-15 6-15 14 0 .3 0 .7.1 1z" />
    <path d="M5 21c2-5 5-8 9-10" />
  </svg>
);

const IconCar = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13l1.5-4.5A2 2 0 016.4 7h11.2a2 2 0 011.9 1.5L21 13" />
    <rect x="3" y="13" width="18" height="5" rx="2" />
    <circle cx="7.5" cy="18.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="18.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

const IconFactory = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21V11l5 3v-3l5 3V8l6 4v9z" />
    <path d="M8 21v-4M13 21v-4" />
  </svg>
);

const IconGauge = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 14l3-4" />
    <path d="M4 14a8 8 0 1116 0" />
    <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const IconBolt = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
  </svg>
);

/* ---------------------------------------------------------- */
/* Simulation logic                                            */
/* ---------------------------------------------------------- */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function useSimulation(trees, vehicles, industry) {
  return useMemo(() => {
    const predictedAQI = clamp(
      120 - trees * 0.008 + vehicles * 0.012 + industry * 0.9,
      10,
      200
    );

    const risk =
      predictedAQI > 130
        ? "Severe"
        : predictedAQI > 90
        ? "High"
        : predictedAQI > 55
        ? "Moderate"
        : "Low";

    const riskColor = {
      Severe: "#fb7185",
      High: "#fbbf24",
      Moderate: "#2dd4bf",
      Low: "#34d399",
    }[risk];

    const carbonIndex = Math.round(predictedAQI * 0.6 + industry * 0.4);
    const ecoScore = clamp(100 - predictedAQI / 2.2 + trees / 400, 0, 100);
    const dialAngle = -120 + (predictedAQI / 200) * 240;

    return { predictedAQI, risk, riskColor, carbonIndex, ecoScore, dialAngle };
  }, [trees, vehicles, industry]);
}

function buildRecommendations({ trees, vehicles, industry, ecoScore, risk }) {
  const recs = [];

  recs.push(
    trees < 4000
      ? { icon: IconLeaf, text: `Plant ${4000 - trees} more trees to pull AQI down meaningfully.` }
      : { icon: IconLeaf, text: "Tree coverage is strong — maintain it through protected zoning." }
  );

  recs.push(
    vehicles > 4000
      ? { icon: IconCar, text: "Vehicle load is the dominant pressure — expand transit to cut it." }
      : { icon: IconCar, text: "Traffic levels are manageable — keep incentivizing carpooling." }
  );

  recs.push(
    industry > 60
      ? { icon: IconFactory, text: "Industrial output is the largest single risk factor right now." }
      : industry > 30
      ? { icon: IconFactory, text: "Industrial emissions are moderate — filtration upgrades help." }
      : { icon: IconFactory, text: "Industrial footprint is low — a good baseline to build from." }
  );

  recs.push({
    icon: IconBolt,
    text:
      ecoScore > 70
        ? "Eco score is healthy — renewables can lock in these gains."
        : risk === "Severe" || risk === "High"
        ? "Eco score is under strain — prioritize renewable conversion now."
        : "Eco score is average — renewable adoption offers the fastest lift.",
  });

  return recs;
}

/* ---------------------------------------------------------- */
/* Sub-components                                               */
/* ---------------------------------------------------------- */
function Slider({ label, Icon, value, onChange, min, max, suffix, track }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6 transition-colors hover:border-teal-400/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80">
          <Icon className="w-3.5 h-3.5 text-teal-400" />
          {label}
        </h3>
        <span className="font-bold tabular-nums text-white text-lg">
          {value.toLocaleString()}
          {suffix || ""}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="dial-range w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #2dd4bf ${pct}%, rgba(148,163,184,0.15) ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
        <span>{track[0]}</span>
        <span>{track[1]}</span>
      </div>
    </div>
  );
}

function AtmosphereDial({ aqi, riskColor, risk, dialAngle }) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg viewBox="0 0 240 160" className="w-full max-w-[260px]">
        <path
          d="M 30 140 A 90 90 0 0 1 210 140"
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="45%" stopColor="#2dd4bf" />
            <stop offset="70%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
        <path
          d="M 30 140 A 90 90 0 0 1 210 140"
          fill="none"
          stroke="url(#dialGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.85"
        />
        <g
          style={{
            transform: `rotate(${dialAngle}deg)`,
            transformOrigin: "120px 140px",
            transition: "transform 0.5s cubic-bezier(0.34,1.2,0.64,1)",
          }}
        >
          <line x1="120" y1="140" x2="120" y2="58" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
          <circle cx="120" cy="140" r="7" fill="#f8fafc" />
        </g>
      </svg>

      <div className="absolute bottom-0 flex flex-col items-center" style={{ transform: "translateY(10%)" }}>
        <span
          className="text-4xl font-bold tabular-nums transition-colors duration-500"
          style={{ color: riskColor }}
        >
          {aqi.toFixed(0)}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">
          AQI · {risk}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-6">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">
        {label}
      </h3>
      <p className="text-4xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Main component                                               */
/* ---------------------------------------------------------- */
function Simulator() {
  const [trees, setTrees] = useState(1000);
  const [vehicles, setVehicles] = useState(5000);
  const [industry, setIndustry] = useState(50);

  const { predictedAQI, risk, riskColor, carbonIndex, ecoScore, dialAngle } =
    useSimulation(trees, vehicles, industry);

  const recommendations = buildRecommendations({ trees, vehicles, industry, ecoScore, risk });

  return (
    <div className="bg-[#0B1120] min-h-screen relative overflow-hidden">
      {/* ambient glow — matches Assistant.jsx */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px]" />

      <Sidebar />

      <div className="ml-64 p-8 relative">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Climate Impact Simulator
          </h1>
          <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
            </span>
            Live · Forecast model recalculating
          </p>
        </div>

        {/* Dial + Controls */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 shadow-[0_0_60px_-15px_rgba(45,212,191,0.25)] rounded-3xl flex items-center justify-center p-6">
            <AtmosphereDial aqi={predictedAQI} riskColor={riskColor} risk={risk} dialAngle={dialAngle} />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Slider
              label="Trees Planted"
              Icon={IconLeaf}
              value={trees}
              onChange={setTrees}
              min={0}
              max={10000}
              track={["0", "10,000"]}
            />
            <Slider
              label="Vehicles"
              Icon={IconCar}
              value={vehicles}
              onChange={setVehicles}
              min={0}
              max={10000}
              track={["0", "10,000"]}
            />
            <Slider
              label="Industry Activity"
              Icon={IconFactory}
              value={industry}
              onChange={setIndustry}
              min={0}
              max={100}
              suffix="%"
              track={["0%", "100%"]}
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <MetricCard label="Carbon Index" value={carbonIndex} color="#2dd4bf" />
          <MetricCard label="Eco Score" value={ecoScore.toFixed(0)} color="#a78bfa" />
          <MetricCard label="Risk Level" value={risk} color={riskColor} />
        </div>

        {/* Analysis */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-8 mb-6">
          <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80 mb-8">
            <IconGauge className="w-4 h-4 text-teal-400" />
            Environmental Analysis
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-white mb-2 text-sm">
                <span>AQI Impact</span>
                <span className="tabular-nums font-mono">{predictedAQI.toFixed(0)} / 200</span>
              </div>
              <div className="w-full bg-slate-950/60 border border-white/5 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(predictedAQI / 200) * 100}%`, background: riskColor }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-white mb-2 text-sm">
                <span>Environmental Health</span>
                <span className="tabular-nums font-mono">{ecoScore.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-950/60 border border-white/5 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-teal-400 to-cyan-600"
                  style={{ width: `${ecoScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 rounded-3xl p-8">
          <h2 className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-teal-400/80 mb-6">
            <IconBolt className="w-4 h-4 text-teal-400" />
            Adaptive Recommendations
          </h2>

          <ul className="space-y-4">
            {recommendations.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-400/20 to-cyan-600/20 border border-teal-400/30 text-teal-300">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="pt-1 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        .dial-range::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2dd4bf;
          box-shadow: 0 0 10px rgba(45,212,191,0.7);
          cursor: pointer;
        }
        .dial-range::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2dd4bf;
          border: none;
          box-shadow: 0 0 10px rgba(45,212,191,0.7);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default Simulator;
