import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Simulator from "./pages/Simulator";
import Assistant from "./pages/Assistant";
import RiskMap from "./pages/RiskMap";
import Weather from "./pages/Weather";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/simulator" element={<Simulator />} />
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/riskmap" element={<RiskMap />} />
      <Route path="/weather" element={<Weather />} />
    </Routes>
  );
}

export default App;