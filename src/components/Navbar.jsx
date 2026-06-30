import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------- */
/* Inline icon set — matches Simulator.jsx / Assistant.jsx    */
/* ---------------------------------------------------------- */
const IconRobot = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="12" rx="3" />
    <path d="M9 12h.01M15 12h.01" />
    <path d="M9 16h6" />
    <path d="M12 8V5" />
    <circle cx="12" cy="4" r="1" />
  </svg>
);

const IconGlobe = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8" />
    <path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9c2.5-3 4-5.5 4-9s-1.5-6-4-9z" />
  </svg>
);

const IconBell = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9a6 6 0 1112 0v3l2 3H4l2-3V9z" />
    <path d="M10 20a2 2 0 004 0" />
  </svg>
);

/* ---------------------------------------------------------- */
/* Navbar                                                      */
/* ---------------------------------------------------------- */
function Navbar() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY < lastY.current || currentY < 80);
      lastY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className={`sticky top-0 z-40 px-8 py-5 transition-transform duration-300 ease-in-out ${visible ? "translate-y-0" : "-translate-y-full"}`}>
      {/* Ambient glow — matches Simulator.jsx */}
      <div className="pointer-events-none absolute top-0 right-0 w-[400px] h-[200px] bg-teal-500/10 rounded-full blur-[80px]" />

      <div className="bg-slate-900/40 backdrop-blur-2xl border border-teal-400/10 rounded-3xl px-8 py-5 flex justify-between items-center shadow-[0_0_60px_-15px_rgba(45,212,191,0.15)] relative">

        {/* Left — brand */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            EcoTwin Command Center
          </h1>
          <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
            </span>
            AI-Powered Environmental Intelligence
          </p>
        </div>

        {/* Right — controls */}
        <div className="flex items-center gap-4">

          {/* System status */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/60 border border-teal-400/10 px-4 py-2.5 rounded-2xl">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/90">
              System Online
            </span>
          </div>

          {/* Time */}
          <div className="hidden sm:flex flex-col items-end bg-slate-900/60 border border-teal-400/10 px-5 py-2 rounded-2xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {date}
            </span>
            <span className="text-base font-bold tabular-nums text-white leading-tight">
              {time}
            </span>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-teal-400/10" />

          {/* AI Assistant button */}
          <button
            onClick={() => navigate("/assistant")}
            title="AI Assistant"
            className="group relative w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white shadow-[0_0_20px_-4px_rgba(45,212,191,0.6)] hover:shadow-[0_0_28px_-4px_rgba(45,212,191,0.9)] hover:scale-105 transition-all duration-300"
          >
            <IconRobot className="w-4 h-4" />
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono uppercase tracking-widest text-teal-400/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Assistant
            </span>
          </button>

          {/* Risk map button */}
          <button
            onClick={() => navigate("/riskmap")}
            title="Risk Map"
            className="group relative w-11 h-11 rounded-2xl bg-slate-900/60 border border-teal-400/10 flex items-center justify-center text-teal-300 hover:border-teal-400/30 hover:bg-teal-400/10 hover:scale-105 transition-all duration-300"
          >
            <IconGlobe className="w-4 h-4" />
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono uppercase tracking-widest text-teal-400/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Risk Map
            </span>
          </button>

          {/* Notifications button */}
          <button
            onClick={() => alert("No new notifications")}
            title="Notifications"
            className="group relative w-11 h-11 rounded-2xl bg-slate-900/60 border border-teal-400/10 flex items-center justify-center text-slate-300 hover:border-teal-400/30 hover:bg-teal-400/10 hover:scale-105 transition-all duration-300"
          >
            <IconBell className="w-4 h-4" />
            {/* Notification dot */}
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400" />
            </span>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono uppercase tracking-widest text-teal-400/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Alerts
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}

export default Navbar;
