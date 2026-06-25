import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { time: "6 AM", aqi: 78 },
  { time: "8 AM", aqi: 92 },
  { time: "10 AM", aqi: 110 },
  { time: "12 PM", aqi: 128 },
  { time: "2 PM", aqi: 121 },
  { time: "4 PM", aqi: 115 },
];

function LiveAQIChart() {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        📈 Live AQI Trend
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="time" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="aqi"
            stroke="#22c55e"
            strokeWidth={4}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LiveAQIChart;