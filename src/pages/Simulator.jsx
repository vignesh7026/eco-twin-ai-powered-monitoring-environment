import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Simulator() {
  const [trees, setTrees] = useState(1000);
  const [vehicles, setVehicles] = useState(5000);
  const [industry, setIndustry] = useState(50);

  const predictedAQI =
    120 - trees * 0.002 + vehicles * 0.001 + industry * 2;

  const risk =
    predictedAQI > 120
      ? "High"
      : predictedAQI > 80
      ? "Medium"
      : "Low";

  const carbonIndex = (predictedAQI * 0.6).toFixed(0);

  const ecoScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        predictedAQI / 2
    )
  );

  return (
    <div className="bg-[#0B1120] min-h-screen">

      <Sidebar />

      <div className="ml-72">

        <Navbar />

        <div className="p-8">

          {/* Header */}
          <div className="mb-10">

            <h1 className="text-5xl font-bold text-white mb-3">
              Climate Impact Simulator
            </h1>

            <p className="text-cyan-300 text-lg">
              Simulate environmental changes and predict future city conditions
            </p>

          </div>

          {/* Controls */}

          <div className="grid lg:grid-cols-3 gap-6">

            {/* Trees */}
            <div className="bg-slate-900/70 border border-green-500/20 rounded-3xl p-6 backdrop-blur-xl">

              <div className="flex justify-between mb-4">
                <h3 className="text-white text-xl">
                  🌳 Trees Planted
                </h3>

                <span className="text-green-400 font-bold">
                  {trees}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="10000"
                value={trees}
                onChange={(e) =>
                  setTrees(Number(e.target.value))
                }
                className="w-full accent-green-500"
              />

            </div>

            {/* Vehicles */}
            <div className="bg-slate-900/70 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl">

              <div className="flex justify-between mb-4">
                <h3 className="text-white text-xl">
                  🚗 Vehicles
                </h3>

                <span className="text-yellow-400 font-bold">
                  {vehicles}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="10000"
                value={vehicles}
                onChange={(e) =>
                  setVehicles(Number(e.target.value))
                }
                className="w-full accent-yellow-500"
              />

            </div>

            {/* Industry */}
            <div className="bg-slate-900/70 border border-red-500/20 rounded-3xl p-6 backdrop-blur-xl">

              <div className="flex justify-between mb-4">
                <h3 className="text-white text-xl">
                  🏭 Industry Activity
                </h3>

                <span className="text-red-400 font-bold">
                  {industry}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={industry}
                onChange={(e) =>
                  setIndustry(Number(e.target.value))
                }
                className="w-full accent-red-500"
              />

            </div>

          </div>

          {/* Results */}

          <div className="grid lg:grid-cols-4 gap-6 mt-10">

            <div className="bg-slate-900 rounded-3xl p-6 border border-cyan-500/20">

              <h3 className="text-slate-400 mb-3">
                Predicted AQI
              </h3>

              <p className="text-5xl font-bold text-cyan-400">
                {predictedAQI.toFixed(0)}
              </p>

            </div>

            <div className="bg-slate-900 rounded-3xl p-6 border border-green-500/20">

              <h3 className="text-slate-400 mb-3">
                Carbon Index
              </h3>

              <p className="text-5xl font-bold text-green-400">
                {carbonIndex}
              </p>

            </div>

            <div className="bg-slate-900 rounded-3xl p-6 border border-yellow-500/20">

              <h3 className="text-slate-400 mb-3">
                Risk Level
              </h3>

              <p className="text-5xl font-bold text-yellow-400">
                {risk}
              </p>

            </div>

            <div className="bg-slate-900 rounded-3xl p-6 border border-purple-500/20">

              <h3 className="text-slate-400 mb-3">
                Eco Score
              </h3>

              <p className="text-5xl font-bold text-purple-400">
                {ecoScore.toFixed(0)}
              </p>

            </div>

          </div>

          {/* AI Analysis */}

          <div className="mt-10 bg-slate-900 rounded-3xl p-8 border border-cyan-500/20">

            <h2 className="text-3xl text-white font-bold mb-8">
              🤖 AI Environmental Analysis
            </h2>

            <div className="space-y-5">

              <div>
                <div className="flex justify-between text-white mb-2">
                  <span>AQI Impact</span>
                  <span>{predictedAQI.toFixed(0)}</span>
                </div>

                <div className="w-full bg-slate-700 rounded-full h-4">
                  <div
                    className="bg-cyan-500 h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        predictedAQI / 2,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-white mb-2">
                  <span>Environmental Health</span>
                  <span>{ecoScore.toFixed(0)}%</span>
                </div>

                <div className="w-full bg-slate-700 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${ecoScore}%`,
                    }}
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Recommendations */}

          <div className="mt-8 bg-slate-900 rounded-3xl p-8 border border-cyan-500/20">

            <h2 className="text-3xl text-white font-bold mb-6">
              🌍 AI Recommendations
            </h2>

            <ul className="space-y-4 text-lg">

              <li className="text-green-400">
                ✓ Increase tree plantation by 20%
              </li>

              <li className="text-yellow-400">
                ✓ Reduce traffic congestion
              </li>

              <li className="text-cyan-400">
                ✓ Adopt smart renewable energy systems
              </li>

              <li className="text-red-400">
                ✓ Reduce industrial emissions
              </li>

            </ul>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Simulator;