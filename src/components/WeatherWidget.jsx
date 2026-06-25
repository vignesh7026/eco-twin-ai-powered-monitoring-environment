function WeatherWidget() {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 text-white">
      <h2 className="text-xl font-bold mb-4">
        Current Weather
      </h2>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-5xl font-bold">29°C</p>
          <p className="text-slate-400">Bengaluru, Karnataka</p>
        </div>

        <div className="text-6xl">
          ⛅
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div>
          <p className="text-slate-400">Humidity</p>
          <p className="font-bold">73%</p>
        </div>

        <div>
          <p className="text-slate-400">Wind</p>
          <p className="font-bold">6 km/h</p>
        </div>

        <div>
          <p className="text-slate-400">AQI</p>
          <p className="font-bold">71</p>
        </div>
      </div>
    </div>
  );
}

export default WeatherWidget;