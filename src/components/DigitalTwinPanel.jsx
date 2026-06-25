function DigitalTwinPanel() {
  return (
    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl border border-slate-700">

      <h2 className="text-3xl font-bold mb-2">
        🏙 Bengaluru Digital Twin
      </h2>

      <p className="text-slate-400 mb-6">
        Real-time Environmental Replica
      </p>

      <div className="grid grid-cols-4 gap-5">

        <div className="bg-slate-700/50 backdrop-blur-lg p-5 rounded-2xl hover:bg-slate-700 transition">
          <p className="text-slate-400 text-sm">
            Population
          </p>
          <h3 className="text-3xl font-bold mt-2">
            13.6M
          </h3>
        </div>

        <div className="bg-slate-700/50 backdrop-blur-lg p-5 rounded-2xl hover:bg-slate-700 transition">
          <p className="text-slate-400 text-sm">
            Green Cover
          </p>
          <h3 className="text-3xl font-bold mt-2 text-green-400">
            38%
          </h3>
        </div>

        <div className="bg-slate-700/50 backdrop-blur-lg p-5 rounded-2xl hover:bg-slate-700 transition">
          <p className="text-slate-400 text-sm">
            Energy Usage
          </p>
          <h3 className="text-3xl font-bold mt-2 text-yellow-400">
            72%
          </h3>
        </div>

        <div className="bg-slate-700/50 backdrop-blur-lg p-5 rounded-2xl hover:bg-slate-700 transition">
          <p className="text-slate-400 text-sm">
            Water Quality
          </p>
          <h3 className="text-3xl font-bold mt-2 text-cyan-400">
            81%
          </h3>
        </div>

      </div>

      <div className="grid grid-cols-3 gap-5 mt-8">

        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
          <p className="text-green-400">
            City Health
          </p>
          <h3 className="text-4xl font-bold mt-2">
            84%
          </h3>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <p className="text-yellow-400">
            Carbon Footprint
          </p>
          <h3 className="text-4xl font-bold mt-2">
            Medium
          </h3>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <p className="text-red-400">
            Disaster Risk
          </p>
          <h3 className="text-4xl font-bold mt-2">
            High
          </h3>
        </div>

      </div>

    </div>
  );
}

export default DigitalTwinPanel;