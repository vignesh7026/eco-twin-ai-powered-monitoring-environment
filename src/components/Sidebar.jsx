import {
  FaHome,
  FaLeaf,
  FaRobot,
  FaMapMarkedAlt,
  FaCloudSun,
} from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <FaHome />,
      path: "/",
    },
    {
      name: "Simulator",
      icon: <FaLeaf />,
      path: "/simulator",
    },
    {
      name: "AI Assistant",
      icon: <FaRobot />,
      path: "/assistant",
    },
    {
      name: "Risk Map",
      icon: <FaMapMarkedAlt />,
      path: "/riskmap",
    },
    {
      name: "Weather",
      icon: <FaCloudSun />,
      path: "/weather",
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-72 bg-[#0B1120] border-r border-cyan-500/20 backdrop-blur-xl flex flex-col z-50">

      {/* Logo */}
      <div className="p-8 border-b border-cyan-500/10">

        <div className="flex items-center gap-4">

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(34,211,238,0.5)]">
            🌍
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white">
              EcoTwin
            </h1>

            <p className="text-cyan-400 text-sm">
              Digital Twin Platform
            </p>
          </div>

        </div>

      </div>

      {/* Navigation */}
      <div className="flex-1 p-5">

        <p className="text-slate-500 text-xs uppercase tracking-widest mb-5">
          Navigation
        </p>

        <div className="space-y-3">

          {menuItems.map((item) => (
            <Link key={item.path} to={item.path}>

              <motion.div
                whileHover={{
                  x: 8,
                  scale: 1.02,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className={`group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300
                ${
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 shadow-[0_0_25px_rgba(34,211,238,0.15)]"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >

                <div
                  className={`text-xl ${
                    location.pathname === item.path
                      ? "text-cyan-400"
                      : "text-slate-400 group-hover:text-cyan-400"
                  }`}
                >
                  {item.icon}
                </div>

                <span
                  className={`font-medium text-lg ${
                    location.pathname === item.path
                      ? "text-white"
                      : "text-slate-300"
                  }`}
                >
                  {item.name}
                </span>

                {location.pathname === item.path && (
                  <div className="ml-auto w-2 h-10 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
                )}

              </motion.div>

            </Link>
          ))}

        </div>

      </div>

    </div>
  );
}

export default Sidebar;