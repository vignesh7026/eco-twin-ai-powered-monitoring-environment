import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Weather() {
  const [weather, setWeather] = useState(null);

  const forecast = [
    { day: "Mon", icon: "☀️", temp: "31°C" },
    { day: "Tue", icon: "⛅", temp: "29°C" },
    { day: "Wed", icon: "🌧️", temp: "27°C" },
    { day: "Thu", icon: "⛈️", temp: "26°C" },
    { day: "Fri", icon: "☀️", temp: "30°C" },
    { day: "Sat", icon: "🌦️", temp: "28°C" },
    { day: "Sun", icon: "⛅", temp: "29°C" },
  ];

  const hourly = [
    { time: "Now", icon: "⛅", temp: "29°" },
    { time: "2 PM", icon: "☀️", temp: "30°" },
    { time: "4 PM", icon: "🌦️", temp: "29°" },
    { time: "6 PM", icon: "🌧️", temp: "27°" },
    { time: "8 PM", icon: "⛈️", temp: "26°" },
    { time: "10 PM", icon: "🌙", temp: "24°" },
  ];

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const apiKey =
          import.meta.env.VITE_OPENWEATHER_API_KEY;

        console.log("API KEY:", apiKey);

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Bengaluru&appid=${apiKey}&units=metric`
        );

        const data = await response.json();

        console.log("Weather Data:", data);

        if (data.cod === 200) {
          setWeather(data);
        } else {
          console.error("API Error:", data.message);
        }
      } catch (error) {
        console.error("Weather Error:", error);
      }
    };

    fetchWeather();

    const interval = setInterval(fetchWeather, 600000);

    return () => clearInterval(interval);
  }, []);

  if (!weather) {
    return (
      <div className="bg-[#050B1A] min-h-screen flex items-center justify-center text-white text-3xl">
        Loading Weather Data...
      </div>
    );
  }

  return (
    <div className="bg-[#050B1A] min-h-screen">
      <Sidebar />

      <div className="ml-72">
        <Navbar />

        <div className="p-8 pt-32">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white">
              Weather Intelligence
            </h1>

            <p className="text-cyan-300 mt-2">
              Real-time atmospheric monitoring
            </p>
          </div>

          {/* Status */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-5 mb-8">

            <h3 className="text-green-400 font-bold text-xl">
              🌦 Live Weather Feed Active
            </h3>

            <p className="text-slate-300 mt-2">
              Connected to OpenWeather API
            </p>

          </div>

          {/* Hero */}
          <div className="bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-slate-900 border border-cyan-500/20 rounded-[32px] p-10 backdrop-blur-xl mb-8">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-cyan-300 text-xl mb-2">
                  {weather.name}
                </p>

                <h2 className="text-8xl font-black text-white">
                  {Math.round(weather.main.temp)}°
                </h2>

                <p className="text-3xl text-slate-300 mt-2">
                  {weather.weather[0].main}
                </p>

                <p className="text-slate-400 mt-3">
                  Feels Like {Math.round(weather.main.feels_like)}°C
                </p>

              </div>

              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                alt="weather"
                className="w-40 h-40"
              />

            </div>

          </div>

          {/* Weather Metrics */}
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-8">

            <div className="bg-slate-900/70 border border-cyan-500/20 rounded-3xl p-6">
              <p className="text-slate-400">Humidity</p>

              <h3 className="text-5xl font-bold text-white mt-3">
                {weather.main.humidity}%
              </h3>
            </div>

            <div className="bg-slate-900/70 border border-cyan-500/20 rounded-3xl p-6">
              <p className="text-slate-400">Wind Speed</p>

              <h3 className="text-5xl font-bold text-white mt-3">
                {weather.wind.speed}
              </h3>

              <p className="text-slate-400">m/s</p>
            </div>

            <div className="bg-slate-900/70 border border-cyan-500/20 rounded-3xl p-6">
              <p className="text-slate-400">Visibility</p>

              <h3 className="text-5xl font-bold text-white mt-3">
                {(weather.visibility / 1000).toFixed(1)}
              </h3>

              <p className="text-slate-400">km</p>
            </div>

            <div className="bg-slate-900/70 border border-cyan-500/20 rounded-3xl p-6">
              <p className="text-slate-400">Pressure</p>

              <h3 className="text-5xl font-bold text-white mt-3">
                {weather.main.pressure}
              </h3>

              <p className="text-slate-400">hPa</p>
            </div>

          </div>

          {/* Forecast */}
          <div className="bg-slate-900/70 border border-cyan-500/20 rounded-[32px] p-8 mb-8">

            <h2 className="text-3xl font-bold text-white mb-8">
              7-Day Forecast
            </h2>

            <div className="grid grid-cols-7 gap-4">

              {forecast.map((item) => (
                <div
                  key={item.day}
                  className="bg-slate-800/80 rounded-2xl p-5 text-center"
                >
                  <p className="text-slate-300">{item.day}</p>

                  <div className="text-5xl my-3">
                    {item.icon}
                  </div>

                  <p className="text-white font-semibold">
                    {item.temp}
                  </p>
                </div>
              ))}

            </div>

          </div>

          {/* Hourly */}
          <div className="bg-slate-900/70 border border-cyan-500/20 rounded-[32px] p-8">

            <h2 className="text-3xl font-bold text-white mb-8">
              Hourly Forecast
            </h2>

            <div className="grid grid-cols-6 gap-5">

              {hourly.map((item) => (
                <div
                  key={item.time}
                  className="bg-slate-800/80 rounded-2xl p-5 text-center"
                >
                  <p className="text-slate-400">
                    {item.time}
                  </p>

                  <div className="text-4xl my-3">
                    {item.icon}
                  </div>

                  <p className="text-white font-bold text-xl">
                    {item.temp}
                  </p>
                </div>
              ))}

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default Weather;