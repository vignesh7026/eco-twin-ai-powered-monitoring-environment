import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AlertBanner from "../components/AlertBanner";
import WeatherWidget from "../components/WeatherWidget";
import TrendChart from "../components/TrendChart";
import RecommendationCard from "../components/RecommendationCard";
import StatCard from "../components/StatCard";
import RecentAlerts from "../components/RecentAlerts";
import RiskMapPreview from "../components/RiskMapPreview";
import WeatherForecast from "../components/WeatherForecast";
import RiskRadar from "../components/RiskRadar";
import DigitalTwinPanel from "../components/DigitalTwinPanel";
import ClimateSimulator from "../components/ClimateSimulator";
import HealthGauge from "../components/HealthGauge";
import AICommandFeed from "../components/AICommandFeed";
import EnvironmentalTimeline from "../components/EnvironmentalTimeline";
import Earth3D from "../components/Earth3D";
import LiveAQIChart from "../components/LiveAQIChart";
import SmartPredictionPanel from "../components/SmartPredictionPanel";
import AIOrb from "../components/AIOrb";

function Dashboard() {
  return (
    <div className="bg-[#0B1120] min-h-screen">
      <Sidebar />

      <div className="ml-72">
        <Navbar />

        {/* Earth Hero */}
        <div className="p-8">
          <Earth3D />
        </div>

        {/* Alert Banner */}
        <div className="px-8">
          <AlertBanner />
        </div>

        {/* AQI Analytics + AI Forecast */}
        <div className="grid grid-cols-3 gap-8 px-8 mt-8">
          <div className="col-span-2">
            <LiveAQIChart />
          </div>

          <SmartPredictionPanel />
        </div>

        {/* Digital Twin Overview */}
        <div className="px-8 mt-8">
          <DigitalTwinPanel />
        </div>

        {/* Risk Intelligence Map */}
        <div className="px-8 mt-8">
          <RiskMapPreview />
        </div>

        {/* Environmental Health */}
        <div className="grid grid-cols-2 gap-8 px-8 mt-8">
          <HealthGauge />
          <AICommandFeed />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 px-8 mt-8">
          <StatCard title="AQI" value="128" />
          <StatCard title="Temperature" value="34°C" />
          <StatCard title="Carbon Index" value="72" />
          <StatCard title="Risk Score" value="High" />
        </div>

        {/* Trends + Weather */}
        <div className="grid grid-cols-3 gap-8 px-8 mt-8">
          <div className="col-span-2">
            <TrendChart />
          </div>

          <WeatherWidget />
        </div>

        {/* Forecast + Simulation */}
        <div className="grid grid-cols-2 gap-8 px-8 mt-8">
          <WeatherForecast />
          <ClimateSimulator />
        </div>

        {/* Risk Radar */}
        <div className="px-8 mt-8">
          <RiskRadar />
        </div>

        {/* AI Recommendations */}
        <div className="px-8 mt-8">
          <RecommendationCard />
        </div>

        {/* Alert History */}
        <div className="px-8 mt-8">
          <RecentAlerts />
        </div>

        {/* Environmental Timeline */}
        <div className="px-8 mt-8 mb-12">
          <EnvironmentalTimeline />
        </div>

        {/* Floating AI Assistant */}
        <AIOrb />
      </div>
    </div>
  );
}

export default Dashboard;