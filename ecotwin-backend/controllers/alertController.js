const Alert = require("../models/Alert");

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find().sort({
            createdAt: -1
        });

        res.json(alerts);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

exports.createAlert = async (req, res) => {
    try {
        const alert = await Alert.create(req.body);

        const io = req.app.get("io");
        io.emit("new-alert", alert);

        res.status(201).json(alert);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};