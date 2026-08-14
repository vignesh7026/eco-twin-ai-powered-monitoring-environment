const mongoose = require("mongoose");

const connectDB = async () => {
    // Debug line — confirms whether Render actually injected the variable.
    // Remove this once the connection is confirmed working; it's safe to
    // leave temporarily since it only logs true/false, never the actual URI.
    console.log("MONGODB_URI present:", !!process.env.MONGODB_URI);

    if (!process.env.MONGODB_URI) {
        console.error(
            "❌ MONGODB_URI is undefined. This means the environment variable " +
            "was not injected by the host (Render/local .env). Check that it's " +
            "set in Render's Environment tab and that 'Save Changes' was clicked."
        );
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:");
        console.error(error.message);
        process.exit(1);
    }
};

module.exports = connectDB;