function EnvironmentalTimeline() {
  return (
    <div className="bg-slate-800 rounded-3xl p-6 text-white">
      <h2 className="text-2xl font-bold mb-5">
        📈 Environmental Timeline
      </h2>

      <div className="space-y-4">

        <div className="bg-slate-700 p-4 rounded-xl">
          09:00 AM - AQI Increased to 128
        </div>

        <div className="bg-slate-700 p-4 rounded-xl">
          11:00 AM - Rainfall Detected
        </div>

        <div className="bg-slate-700 p-4 rounded-xl">
          01:00 PM - Flood Alert Generated
        </div>

        <div className="bg-slate-700 p-4 rounded-xl">
          02:00 PM - AI Prediction Updated
        </div>

      </div>
    </div>
  );
}

export default EnvironmentalTimeline;