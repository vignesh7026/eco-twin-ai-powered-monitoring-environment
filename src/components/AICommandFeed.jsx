function AICommandFeed() {
  return (
    <div className="bg-slate-800 rounded-3xl p-6 text-white">

      <h2 className="text-2xl font-bold mb-5">
        🤖 Live AI Analysis
      </h2>

      <div className="space-y-4">

        <div className="bg-slate-700 p-4 rounded-xl border-l-4 border-red-500">
          🌊 Flood probability increased by 12%
        </div>

        <div className="bg-slate-700 p-4 rounded-xl border-l-4 border-green-500">
          🌳 Green cover improved by 3%
        </div>

        <div className="bg-slate-700 p-4 rounded-xl border-l-4 border-yellow-500">
          ☀ Heatwave warning detected
        </div>

        <div className="bg-slate-700 p-4 rounded-xl border-l-4 border-cyan-500">
          🌦 Rainfall expected within next 2 hours
        </div>

      </div>

    </div>
  );
}

export default AICommandFeed;