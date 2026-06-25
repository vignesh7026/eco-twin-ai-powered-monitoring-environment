function WeatherForecast() {
  const forecast = [
    { day: "Mon", temp: "29°", icon: "☀️" },
    { day: "Tue", temp: "31°", icon: "⛅" },
    { day: "Wed", temp: "28°", icon: "🌧️" },
    { day: "Thu", temp: "30°", icon: "☀️" },
    { day: "Fri", temp: "27°", icon: "🌦️" },
    { day: "Sat", temp: "29°", icon: "⛅" },
    { day: "Sun", temp: "26°", icon: "🌧️" },
  ];

  return (
    <div className="bg-slate-800 rounded-3xl p-6 text-white">
      <h2 className="text-xl font-bold mb-4">
        7-Day Forecast
      </h2>

      <div className="grid grid-cols-7 gap-3">
        {forecast.map((item, index) => (
          <div
            key={index}
            className="bg-slate-700 rounded-xl p-3 text-center"
          >
            <p>{item.day}</p>

            <div className="text-3xl my-2">
              {item.icon}
            </div>

            <p className="font-bold">
              {item.temp}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeatherForecast;