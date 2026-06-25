import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function TrendChart() {
  const data = [
    { time: "12PM", aqi: 95 },
    { time: "2PM", aqi: 110 },
    { time: "4PM", aqi: 128 },
    { time: "6PM", aqi: 120 },
    { time: "8PM", aqi: 115 },
    { time: "10PM", aqi: 105 },
    { time: "12AM", aqi: 98 },
  ];

  return (
    <div className="bg-slate-800 rounded-3xl p-6 h-[420px] text-white">
      <h2 className="text-2xl font-bold mb-6">
        Environmental Trends
      </h2>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <XAxis dataKey="time" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="aqi"
            stroke="#22C55E"
            fill="#22C55E"
            fillOpacity={0.25}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendChart;