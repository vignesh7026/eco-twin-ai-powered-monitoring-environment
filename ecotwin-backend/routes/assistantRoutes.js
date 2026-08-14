const express = require("express");
const rateLimit = require("express-rate-limit");
const { chatWithAssistant } = require("../controllers/assistantController");

const router = express.Router();

const assistantLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests to the assistant. Please wait a moment and try again.",
    },
});

console.log("chatWithAssistant:", typeof chatWithAssistant);
console.log("assistantLimiter:", typeof assistantLimiter);

router.post("/chat", assistantLimiter, chatWithAssistant);

module.exports = router;