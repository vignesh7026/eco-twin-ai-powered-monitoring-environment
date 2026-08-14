require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

connectDB();
require("./logHistory"); // starts the 15-min PM2.5/weather logging cron job

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.set("io", io);

io.on("connection", (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`Socket Disconnected: ${socket.id}`);
    });
});

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "EcoTwin Backend Running 🚀"
    });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/weather", require("./routes/weatherRoutes"));
app.use(
    "/api/dashboard",
    require("./routes/dashboardRoutes")
);
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/assistant", require("./routes/assistantRoutes"));
app.use("/api/history", require("./routes/historyRoutes"));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});