function HealthGauge() {
  return (
    <div className="bg-slate-800 rounded-3xl p-6 text-white">

      <h2 className="text-2xl font-bold mb-6">
        🌍 Environmental Health Score
      </h2>

      <div className="flex justify-center items-center">

        <div className="w-52 h-52 rounded-full border-[14px] border-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">

          <div className="text-center">
            <h3 className="text-6xl font-bold text-green-400">
              84
            </h3>

            <p className="text-slate-400 mt-2">
              Healthy
            </p>
          </div>

        </div>

      </div>

      <div className="mt-6">

        <div className="flex justify-between mb-2">
          <span>AQI</span>
          <span>128</span>
        </div>

        <div className="w-full bg-slate-700 h-3 rounded-full">
          <div className="bg-yellow-400 h-3 rounded-full w-3/4"></div>
        </div>

      </div>

    </div>
  );
}

export default HealthGauge;
