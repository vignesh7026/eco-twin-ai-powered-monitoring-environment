function RecentAlerts() {
  return (
    <div className="bg-slate-800 rounded-3xl p-6 text-white">
      <h2 className="text-xl font-bold mb-4">
        Recent Environmental Alerts
      </h2>

      <div className="space-y-3">
        <div className="bg-red-500/20 p-3 rounded-lg">
          ⚠ Flood Risk Increasing in Bengaluru North
        </div>

        <div className="bg-yellow-500/20 p-3 rounded-lg">
          🌡 Heatwave Warning Issued
        </div>

        <div className="bg-blue-500/20 p-3 rounded-lg">
          🌧 Heavy Rain Expected Tomorrow
        </div>
      </div>
    </div>
  );
}

export default RecentAlerts;