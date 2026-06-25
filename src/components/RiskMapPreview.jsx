import { useState } from "react";

function RiskMap3D() {
  const [selectedCity, setSelectedCity] = useState({
    city: "Delhi",
    risk: "Critical",
    aqi: 198,
    temp: "38°C",
    flood: "High",
  });

  const cities = [
    {
      city: "Delhi",
      risk: "Critical",
      aqi: 198,
      temp: "38°C",
      flood: "High",
      color: "bg-red-500",
      position: "top-[30%] left-[55%]",
    },
    {
      city: "Mumbai",
      risk: "Warning",
      aqi: 145,
      temp: "34°C",
      flood: "Moderate",
      color: "bg-yellow-400",
      position: "top-[53%] left-[41%]",
    },
    {
      city: "Bengaluru",
      risk: "Low",
      aqi: 72,
      temp: "29°C",
      flood: "Low",
      color: "bg-green-500",
      position: "top-[76%] left-[47%]",
    },
    {
      city: "Chennai",
      risk: "Moderate",
      aqi: 118,
      temp: "32°C",
      flood: "Moderate",
      color: "bg-sky-500",
      position: "top-[73%] left-[60%]",
    },
  ];

  return (
    <div className="bg-slate-900 rounded-[32px] overflow-hidden border border-cyan-500/20">

      {/* Header */}
      <div className="p-8 border-b border-slate-700">

        <h2 className="text-4xl font-bold text-white">
          🌍 EcoTwin Risk Intelligence Map
        </h2>

        <p className="text-cyan-300 mt-3 text-lg">
          Real-Time Environmental Monitoring Network
        </p>

        <div className="flex gap-4 mt-6 flex-wrap">

          <div className="px-5 py-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400">
            24 Cities Online
          </div>

          <div className="px-5 py-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            1,248 Sensors
          </div>

          <div className="px-5 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            12 AI Models
          </div>

        </div>

      </div>

      <div className="grid lg:grid-cols-3 gap-6 p-6">

        {/* MAP */}
        <div className="lg:col-span-2">

          <div className="relative h-[720px] rounded-3xl overflow-hidden bg-black">

            <img
              src="/maps/india map.jpg"
              alt="India"
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

            {/* HOTSPOTS */}
            {cities.map((city) => (
              <button
                key={city.city}
                onClick={() => setSelectedCity(city)}
                className={`absolute ${city.position}`}
              >
                <div
                  className={`absolute -left-6 -top-6 w-16 h-16 rounded-full animate-ping opacity-20 ${city.color}`}
                />

                <div
                  className={`absolute -left-4 -top-4 w-12 h-12 rounded-full animate-pulse opacity-30 ${city.color}`}
                />

                <div
                  className={`relative w-6 h-6 rounded-full ${city.color}`}
                />
              </button>
            ))}

            {/* Labels */}

            <div className="absolute top-[29%] left-[59%] bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl text-white border border-red-500/30">
              Delhi
            </div>

            <div className="absolute top-[52%] left-[45%] bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl text-white border border-yellow-500/30">
              Mumbai
            </div>

            <div className="absolute top-[75%] left-[50%] bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl text-white border border-green-500/30">
              Bengaluru
            </div>

            <div className="absolute top-[72%] left-[64%] bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl text-white border border-sky-500/30">
              Chennai
            </div>

          </div>

        </div>

        {/* CITY INTELLIGENCE PANEL */}
        <div>

          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20 h-full sticky top-6">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />

              <p className="text-green-400 font-semibold uppercase tracking-wider">
                Live Data Stream
              </p>

            </div>

            <h3 className="text-5xl font-bold text-white mb-8">
              {selectedCity.city}
            </h3>

            <div className="space-y-8">

              <div>
                <p className="text-slate-400 text-lg">
                  Risk Level
                </p>

                <h4 className="text-red-400 text-5xl font-bold mt-2">
                  {selectedCity.risk}
                </h4>
              </div>

              <div>
                <p className="text-slate-400 text-lg">
                  AQI
                </p>

                <h4 className="text-yellow-400 text-4xl font-bold mt-2">
                  {selectedCity.aqi}
                </h4>
              </div>

              <div>
                <p className="text-slate-400 text-lg">
                  Temperature
                </p>

                <h4 className="text-sky-400 text-4xl font-bold mt-2">
                  {selectedCity.temp}
                </h4>
              </div>

              <div>
                <p className="text-slate-400 text-lg">
                  Flood Risk
                </p>

                <h4 className="text-cyan-400 text-4xl font-bold mt-2">
                  {selectedCity.flood}
                </h4>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default RiskMap3D;