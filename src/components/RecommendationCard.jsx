function RecommendationCard() {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl text-white">
      <h2 className="text-xl font-bold mb-4">
        AI Recommendations
      </h2>

      <ul className="space-y-3">
        <li>🌳 Plant 500 more trees in North Bengaluru</li>
        <li>🚍 Increase public transport usage by 15%</li>
        <li>⚡ Reduce industrial emissions by 10%</li>
        <li>💧 Improve drainage in flood-prone zones</li>
      </ul>
    </div>
  );
}

export default RecommendationCard;