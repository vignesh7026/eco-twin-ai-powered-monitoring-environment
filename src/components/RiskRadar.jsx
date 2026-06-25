function RiskRadar() {
  const risks = [
    { name: "Flood", value: 85, color: "bg-red-500" },
    { name: "Heatwave", value: 62, color: "bg-orange-500" },
    { name: "Pollution", value: 74, color: "bg-yellow-500" },
    { name: "Cyclone", value: 18, color: "bg-green-500" },
  ];

  return (
    <div className="bg-slate-800 rounded-3xl p-6 text-white">

      <h2 className="text-xl font-bold mb-5">
        Disaster Risk Radar
      </h2>

      {risks.map((risk) => (
        <div key={risk.name} className="mb-4">

          <div className="flex justify-between">
            <span>{risk.name}</span>
            <span>{risk.value}%</span>
          </div>

          <div className="w-full bg-slate-700 h-3 rounded-full mt-2">

            <div
              className={`${risk.color} h-3 rounded-full`}
              style={{ width: `${risk.value}%` }}
            ></div>

          </div>

        </div>
      ))}

    </div>
  );
}

export default RiskRadar;