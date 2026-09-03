const { runSimulation, buildRecommendations } = require("../services/simulatorService");

exports.run = async (req, res) => {
  try {
    const trees = Number(req.body.trees);
    const vehicles = Number(req.body.vehicles);
    const industry = Number(req.body.industry);

    if ([trees, vehicles, industry].some((n) => Number.isNaN(n))) {
      return res.status(400).json({
        success: false,
        message: "trees, vehicles and industry must be numbers",
      });
    }

    const result = runSimulation({ trees, vehicles, industry });
    const recommendations = buildRecommendations({
      trees,
      vehicles,
      industry,
      ecoScore: result.ecoScore,
      risk: result.risk,
    });

    res.status(200).json({ success: true, data: { ...result, recommendations } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
