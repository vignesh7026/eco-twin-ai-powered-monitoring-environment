const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
        title: String,
        description: String,
        severity: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "low"
        },
        location: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Alert", alertSchema);