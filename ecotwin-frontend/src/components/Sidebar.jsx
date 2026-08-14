import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

/* ---------------------------------------------------------- */
/* Inline icon set — matches Simulator.jsx / Navbar.jsx       */
/* ---------------------------------------------------------- */
const IconHome = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 3l9 9" />
    <path d="M9 21V12h6v9" />
    <path d="M3 12v9h18v-9" />
  </svg>
);

const IconLeaf = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21c8 0 14-6 14-15-9 0-15 6-15 14 0 .3 0 .7.1 1z" />
    <path d="M5 21c2-5 5-8 9-10" />
  </svg>
);

const IconRobot = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="12" rx="3" />
    <path d="M9 12h.01M15 12h.01" />
    <path d="M9 16h6" />
    <path d="M12 8V5" />
    <circle cx="12" cy="4" r="1" />
  </svg>
);

const IconMap = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const IconCloud = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9z" />
    <path d="M12 13v4M10 15l2 2 2-2" />
  </svg>
);

const IconGlobe = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8" />
    <path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9c2.5-3 4-5.5 4-9s-1.5-6-4-9z" />
  </svg>
);

/* ---------------------------------------------------------- */
/* Menu config                                                 */
/* ---------------------------------------------------------- */
const menuItems = [
  { name: "Dashboard",    Icon: IconHome,  path: "/" },
  { name: "Simulator",   Icon: IconLeaf,  path: "/simulator" },
  { name: "AI Assistant",Icon: IconRobot, path: "/assistant" },
  { name: "Risk Map",    Icon: IconMap,   path: "/riskmap" },
  { name: "Weather",     Icon: IconCloud, path: "/weather" },
];

/* ---------------------------------------------------------- */
/* Sidebar                                                     */
/* ---------------------------------------------------------- */
function Sidebar() {
  const location = useLocation();
  const [hovered, setHovered] = useState(null);

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#0B1120] border-r border-teal-400/10 flex flex-col z-50 overflow-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2" />

      {/* ── Logo ── */}
      <div className="p-6 border-b border-teal-400/10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-[0_0_20px_-4px_rgba(45,212,191,0.7)] shrink-0">
            <IconGlobe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">
              EcoTwin
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-widest text-teal-400/70 mt-0.5">
              Digital Twin Platform
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mt-4 bg-slate-900/60 border border-teal-400/10 rounded-2xl px-3 py-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400/80">
            Live · Systems nominal
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4 px-2">
          Navigation
        </p>

        <ul className="space-y-1">
          {menuItems.map(({ name, Icon, path }) => {
            const active = location.pathname === path;
            return (
              <li key={path}>
                <Link
                  to={path}
                  onMouseEnter={() => setHovered(path)}
                  onMouseLeave={() => setHovered(null)}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 relative
                    ${active
                      ? "bg-slate-900/60 border-teal-400/20 shadow-[0_0_30px_-10px_rgba(45,212,191,0.4)]"
                      : "border-transparent hover:bg-slate-900/40 hover:border-teal-400/10"
                    }`}
                >
                  {/* Icon */}
                  <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200
                    ${active
                      ? "bg-gradient-to-br from-teal-400/20 to-cyan-600/20 border border-teal-400/30 text-teal-300"
                      : "bg-slate-800/60 border border-slate-700/40 text-slate-400 group-hover:border-teal-400/20 group-hover:text-teal-400"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>

                  {/* Label */}
                  <span className={`text-sm font-medium transition-colors duration-200
                    ${active ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}
                  >
                    {name}
                  </span>

                  {/* Active pill */}
                  {active && (
                    <span className="ml-auto w-1 h-6 rounded-full bg-gradient-to-b from-teal-400 to-cyan-500 shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ── */}
      <div className="p-4 border-t border-teal-400/10">
        <div className="bg-slate-900/40 border border-teal-400/10 rounded-2xl p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
            Environment Status
          </p>
          <div className="space-y-2">
            {[
              { label: "AQI Model",  status: "Online", color: "#34d399" },
              { label: "Forecast",   status: "Active", color: "#2dd4bf" },
              { label: "Risk Index", status: "Live",   color: "#a78bfa" },
            ].map(({ label, status, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">{label}</span>
                <span className="text-[10px] font-mono font-semibold" style={{ color }}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Sidebar;
