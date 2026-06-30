exports.getDashboardData = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                activeSensors: 24,
                activeAlerts: 3,
                avgTemperature: 28.4,
                airQualityIndex: 1,
                riskLevel: "Low"
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};