import { useState } from "react";

function AIOrb() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-cyan-500 text-3xl shadow-lg"
      >
        🤖
      </button>

      {open && (
        <div className="fixed bottom-28 right-8 z-50 w-80 bg-slate-900 rounded-2xl p-5 border border-cyan-500">
          <h2 className="text-white text-xl font-bold mb-4">
            EcoTwin AI
          </h2>

          <p className="text-slate-300">
            Rain expected in 2 hours.
          </p>
        </div>
      )}
    </>
  );
}

export default AIOrb;