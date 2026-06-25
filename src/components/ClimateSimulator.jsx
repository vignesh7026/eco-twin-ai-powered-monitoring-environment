import { useState } from "react";

function ClimateSimulator() {
  const [trees, setTrees] = useState(20);

  return (
    <div className="bg-slate-800 rounded-3xl p-6 text-white">
      <h2 className="text-xl font-bold mb-5">
        Climate Impact Simulator
      </h2>

      <div>
        <label>
          Tree Plantation Increase: {trees}%
        </label>

        <input
          type="range"
          min="0"
          max="100"
          value={trees}
          onChange={(e) => setTrees(e.target.value)}
          className="w-full mt-3"
        />
      </div>

      <div className="mt-6 bg-slate-700 p-4 rounded-xl">
        <p>
          Predicted AQI Improvement:
          <span className="text-green-400 ml-2">
            {Math.floor(trees * 0.7)}%
          </span>
        </p>

        <p>
          Carbon Reduction:
          <span className="text-green-400 ml-2">
            {Math.floor(trees * 0.5)}%
          </span>
        </p>
      </div>
    </div>
  );
}

export default ClimateSimulator;