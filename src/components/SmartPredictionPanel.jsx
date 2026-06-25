function SmartPredictionPanel() {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        🔮 AI Future Forecast
      </h2>

      <div className="space-y-4 text-white">

        <div className="bg-slate-700 p-4 rounded-xl">
          2 PM → Rainfall Expected
        </div>

        <div className="bg-slate-700 p-4 rounded-xl">
          4 PM → AQI Increase Likely
        </div>

        <div className="bg-slate-700 p-4 rounded-xl">
          6 PM → Flood Risk 72%
        </div>

        <div className="bg-slate-700 p-4 rounded-xl">
          10 PM → Stable Conditions
        </div>

      </div>
    </div>
  );
}

export default SmartPredictionPanel;