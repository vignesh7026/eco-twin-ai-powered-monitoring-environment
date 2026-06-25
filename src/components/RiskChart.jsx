import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", aqi: 80 },
  { day: "Tue", aqi: 95 },
  { day: "Wed", aqi: 110 },
  { day: "Thu", aqi: 90 },
  { day: "Fri", aqi: 120 },
  { day: "Sat", aqi: 130 },
];

function RiskChart() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">

      <h2 className="text-xl font-bold mb-4">
        AQI Forecast
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="aqi"
            stroke="#22c55e"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}

export default RiskChart;