import {
  FaBell,
  FaRobot,
  FaGlobe,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const now = new Date();

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="sticky top-0 z-40 px-8 py-5">

      <div className="bg-white/5 backdrop-blur-2xl border border-cyan-500/20 rounded-3xl px-8 py-5 flex justify-between items-center shadow-[0_0_30px_rgba(34,211,238,0.08)]">

        {/* Left */}
        <div>

          <h1 className="text-3xl font-bold text-white">
            EcoTwin Command Center
          </h1>

          <p className="text-cyan-300 mt-1">
            AI-Powered Environmental Intelligence Platform
          </p>

        </div>

        {/* Right */}
        <div className="flex items-center gap-5">

          {/* System Status */}
          <div className="hidden lg:flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-2xl">

            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />

            <span className="text-green-400 font-medium">
              System Online
            </span>

          </div>

          {/* Time */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 px-5 py-2 rounded-2xl">

            <p className="text-cyan-300 text-sm">
              Local Time
            </p>

            <h3 className="text-white font-bold">
              {time}
            </h3>

          </div>

          {/* AI Assistant */}
          <button
            onClick={() => navigate("/assistant")}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-110 transition-all duration-300"
          >
            <FaRobot />
          </button>

          {/* Risk Map */}
          <button
            onClick={() => navigate("/riskmap")}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-cyan-500/20 flex items-center justify-center text-cyan-300 hover:bg-cyan-500/10 hover:scale-110 transition-all duration-300"
          >
            <FaGlobe />
          </button>

          {/* Notifications */}
          <button
            onClick={() => alert("No new notifications")}
            className="relative w-12 h-12 rounded-2xl bg-white/5 border border-cyan-500/20 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 transition-all duration-300"
          >
            <FaBell />

            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </button>

         
          

        </div>

      </div>

    </div>
  );
}

export default Navbar;