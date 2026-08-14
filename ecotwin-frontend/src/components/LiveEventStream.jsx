import { motion } from "framer-motion";

const events = [
  "🌧 Heavy rainfall detected in Bengaluru",
  "🌊 Flood risk increased by 12%",
  "🌳 Green cover improved by 3%",
  "🌡 Heatwave warning issued",
  "🤖 AI prediction model updated",
  "📡 Sensor network synchronized",
  "💨 AQI level increased to 128",
  "⚡ Climate simulation completed",
];

function LiveEventStream() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 overflow-hidden">

      <h2 className="text-white text-2xl font-bold mb-6">
        Live Environmental Feed
      </h2>

      <div className="h-[280px] overflow-hidden relative">

        <motion.div
          animate={{
            y: [-500, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "linear",
          }}
          className="space-y-4"
        >
          {[...events, ...events].map((event, index) => (
            <div
              key={index}
              className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-slate-200"
            >
              {event}
            </div>
          ))}
        </motion.div>

      </div>

    </div>
  );
}

export default LiveEventStream;