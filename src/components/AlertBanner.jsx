function AlertBanner() {
  return (
    <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-2xl mb-6">
      <h2 className="font-bold text-xl">
        ⚡ Flood Risk Detected
      </h2>

      <p>Location: Bengaluru North</p>
      <p>Risk Level: High</p>
      <p>Predicted Impact: Moderate</p>
    </div>
  );
}

export default AlertBanner;