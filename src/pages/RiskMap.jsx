import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function RiskMap() {
  const cities = {
    Bengaluru: {
      city: "Bengaluru",
      risk: "Low",
      aqi: 72,
      temperature: "28°C",
      humidity: "68%",
      floodRisk: "Low",
      carbonIndex: 42,
      population: "13.6M",
      status: "Healthy",
      insight: "Green cover increased by 4% this quarter.",
    },

    Chennai: {
      city: "Chennai",
      risk: "Moderate",
      aqi: 118,
      temperature: "33°C",
      humidity: "78%",
      floodRisk: "Moderate",
      carbonIndex: 61,
      population: "11.5M",
      status: "Monitoring",
      insight: "Heavy rainfall expected within 48 hours.",
    },

    Mumbai: {
      city: "Mumbai",
      risk: "Warning",
      aqi: 145,
      temperature: "31°C",
      humidity: "82%",
      floodRisk: "High",
      carbonIndex: 74,
      population: "21.3M",
      status: "Alert",
      insight: "Coastal flood probability increased by 18%.",
    },

    Delhi: {
      city: "Delhi",
      risk: "Critical",
      aqi: 198,
      temperature: "39°C",
      humidity: "48%",
      floodRisk: "Moderate",
      carbonIndex: 91,
      population: "32.9M",
      status: "Critical",
      insight:
        "Air quality deterioration detected. AQI may cross 220.",
    },
  };

  const [selectedCity, setSelectedCity] = useState(
    cities.Delhi
  );

  return (
    <div className="bg-[#050B1A] min-h-screen">
      <Sidebar />

      <div className="ml-72">
        <Navbar />

        <div className="p-8 pt-32">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-5xl font-bold text-white mb-3">
              Environmental Risk Intelligence
            </h1>

            <p className="text-cyan-300 text-lg">
              Real-time climate monitoring and environmental
              threat detection
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">

            {/* MAP */}
            <div className="lg:col-span-4">

              <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-[32px] overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.08)]">

                <MapContainer
                  center={[20.5937, 78.9629]}
                  zoom={5}
                  style={{
                    height: "760px",
                    width: "100%",
                  }}
                >
                  <TileLayer
                    attribution="© OpenStreetMap © CARTO"
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />

                  {/* DELHI */}
                  <Circle
                    center={[28.6139, 77.209]}
                    radius={35000}
                    pathOptions={{
                      color: "#ef4444",
                      fillColor: "#ef4444",
                      fillOpacity: 0.45,
                    }}
                    eventHandlers={{
                      click: () =>
                        setSelectedCity(cities.Delhi),
                    }}
                  />

                  <Marker
                    position={[28.6139, 77.209]}
                    eventHandlers={{
                      click: () =>
                        setSelectedCity(cities.Delhi),
                    }}
                  >
                    <Popup>
                      Delhi
                      <br />
                      AQI: 198
                    </Popup>
                  </Marker>

                  {/* MUMBAI */}
                  <Circle
                    center={[19.076, 72.8777]}
                    radius={30000}
                    pathOptions={{
                      color: "#facc15",
                      fillColor: "#facc15",
                      fillOpacity: 0.4,
                    }}
                    eventHandlers={{
                      click: () =>
                        setSelectedCity(cities.Mumbai),
                    }}
                  />

                  <Marker
                    position={[19.076, 72.8777]}
                    eventHandlers={{
                      click: () =>
                        setSelectedCity(cities.Mumbai),
                    }}
                  >
                    <Popup>
                      Mumbai
                      <br />
                      AQI: 145
                    </Popup>
                  </Marker>

                  {/* BENGALURU */}
                  <Circle
                    center={[12.9716, 77.5946]}
                    radius={25000}
                    pathOptions={{
                      color: "#22c55e",
                      fillColor: "#22c55e",
                      fillOpacity: 0.4,
                    }}
                    eventHandlers={{
                      click: () =>
                        setSelectedCity(cities.Bengaluru),
                    }}
                  />

                  <Marker
                    position={[12.9716, 77.5946]}
                    eventHandlers={{
                      click: () =>
                        setSelectedCity(cities.Bengaluru),
                    }}
                  >
                    <Popup>
                      Bengaluru
                      <br />
                      AQI: 72
                    </Popup>
                  </Marker>

                  {/* CHENNAI */}
                  <Circle
                    center={[13.0827, 80.2707]}
                    radius={28000}
                    pathOptions={{
                      color: "#38bdf8",
                      fillColor: "#38bdf8",
                      fillOpacity: 0.4,
                    }}
                    eventHandlers={{
                      click: () =>
                        setSelectedCity(cities.Chennai),
                    }}
                  />

                  <Marker
                    position={[13.0827, 80.2707]}
                    eventHandlers={{
                      click: () =>
                        setSelectedCity(cities.Chennai),
                    }}
                  >
                    <Popup>
                      Chennai
                      <br />
                      AQI: 118
                    </Popup>
                  </Marker>
                </MapContainer>

              </div>

            </div>

            {/* RIGHT PANEL */}
            <div>

              <div className="sticky top-24 bg-slate-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-[32px] p-8">

                <p className="text-green-400 font-semibold mb-3">
                  ● LIVE DATA STREAM
                </p>

                <h2 className="text-4xl font-bold text-white mb-8">
                  {selectedCity.city}
                </h2>

                <div className="space-y-5">

                  <div>
                    <p className="text-slate-400">
                      Risk Level
                    </p>
                    <h3 className="text-red-400 text-3xl font-bold">
                      {selectedCity.risk}
                    </h3>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      AQI
                    </p>
                    <h3 className="text-yellow-400 text-3xl font-bold">
                      {selectedCity.aqi}
                    </h3>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Temperature
                    </p>
                    <h3 className="text-sky-400 text-3xl font-bold">
                      {selectedCity.temperature}
                    </h3>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Humidity
                    </p>
                    <h3 className="text-cyan-400 text-3xl font-bold">
                      {selectedCity.humidity}
                    </h3>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Flood Risk
                    </p>
                    <h3 className="text-orange-400 text-3xl font-bold">
                      {selectedCity.floodRisk}
                    </h3>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Carbon Index
                    </p>
                    <h3 className="text-green-400 text-3xl font-bold">
                      {selectedCity.carbonIndex}
                    </h3>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Population
                    </p>
                    <h3 className="text-white text-3xl font-bold">
                      {selectedCity.population}
                    </h3>
                  </div>

                </div>

                <div className="mt-8 p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">

                  <p className="text-cyan-300 uppercase text-sm mb-2">
                    AI Insight
                  </p>

                  <p className="text-white">
                    {selectedCity.insight}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default RiskMap;