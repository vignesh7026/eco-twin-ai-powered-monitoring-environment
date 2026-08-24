process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const https = require("https");

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const geminiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (geminiKey && typeof geminiKey === "string" && geminiKey.trim()) {
    try {
        genAI = new GoogleGenerativeAI(geminiKey.trim());
    } catch (e) {
        console.warn("Failed to initialize GoogleGenerativeAI SDK:", e.message);
    }
}

const OWM_KEY = process.env.OPENWEATHER_API_KEY;

/* Model Pool for automatic quota failover */
const MODEL_POOL = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.7-flash",
    "gemini-flash-latest"
];

/* Helper for resilient fetching using Axios with TLS bypass */
async function fetchJson(url, timeoutMs = 4000) {
    try {
        const res = await axios.get(url, {
            timeout: timeoutMs,
            httpsAgent: httpsAgent,
        });
        return res.data;
    } catch (err) {
        return null;
    }
}

const GREETINGS_REGEX = /^(vanakkam|vanakam|வணக்கம்|namaste|namaskar|नमस्ते|नमस्कार|namaskaram|നമസ്കാരം|hi|hello|hey|greetings|good morning|good evening|good afternoon|nandri|நன்றி|sukhamano|സുഖമാണോ)$/i;

/* ------------------------------------------------------------------ */
/* 1. Detect if message is asking for weather/AQI info                 */
/* ------------------------------------------------------------------ */
function isWeatherQuery(message) {
    if (!message) return false;
    const q = message.toLowerCase();
    const keywords = [
        "weather", "climate", "temperature", "temp", "aqi", "air quality", "pollution",
        "rain", "raining", "rainy", "flood risk", "humidity", "wind speed", "sunrise", "sunset",
        "hot outside", "cold outside", "degree", "celsius", "pm2.5", "pm10"
    ];
    return keywords.some(kw => q.includes(kw));
}

/* ------------------------------------------------------------------ */
/* 2. City Extractor                                                   */
/* ------------------------------------------------------------------ */
function extractCityFallback(message, defaultCity = "Bengaluru") {
    if (!message || typeof message !== "string") return null;

    const cleaned = message.trim();

    const prepMatch = cleaned.match(/\b(?:in|for|at|near|of|about)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (prepMatch && prepMatch[1]) {
        const candidate = prepMatch[1].trim();
        const lower = candidate.toLowerCase();
        const ignoreList = [
            "today", "tomorrow", "tonight", "now", "currently", "this week", "right now",
            "weather", "climate", "temp", "temperature", "aqi", "air quality", "morning", "evening",
            "outside", "here", "there", "home"
        ];
        if (!ignoreList.includes(lower)) {
            return candidate
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");
        }
    }

    if (isWeatherQuery(cleaned)) {
        const fillerWords = [
            "weather", "climate", "temperature", "temp", "aqi", "air", "quality", "pollution",
            "rain", "flood", "forecast", "outlook", "status", "report", "info", "information",
            "right now", "now", "today", "tonight", "tomorrow", "currently", "this week",
            "how", "is", "the", "what", "whats", "what's", "show", "me", "tell", "give",
            "in", "for", "at", "near", "of", "about", "please", "can", "you", "outside"
        ];

        const regexPattern = new RegExp(
            "\\b(" + fillerWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b",
            "gi"
        );

        let remaining = cleaned
            .replace(/[?.!,;:-]/g, " ")
            .replace(regexPattern, "")
            .replace(/\s+/g, " ")
            .trim();

        if (remaining.length >= 2 && remaining.length <= 50 && !/^\d+$/.test(remaining)) {
            return remaining
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");
        }
        return defaultCity;
    }

    return null;
}

/* ------------------------------------------------------------------ */
/* 3. OpenWeatherMap API Helpers                                       */
/* ------------------------------------------------------------------ */
async function fetchCityWeather(city) {
    if (!OWM_KEY || !city) return null;

    try {
        const data = await fetchJson(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`,
            4000
        );
        if (!data || data.cod !== 200) return null;

        const tzOffsetSec = data.timezone || 0;

        const toLocalTime = (unixSeconds) => {
            const localMs = (unixSeconds + tzOffsetSec) * 1000;
            return new Date(localMs).toUTCString().match(/\d{2}:\d{2}:\d{2}/)[0];
        };

        return {
            city: data.name,
            country: data.sys?.country,
            temp: data.main.temp,
            feels_like: data.main.feels_like,
            humidity: data.main.humidity,
            condition: data.weather[0].main,
            description: data.weather[0].description,
            wind_speed: data.wind.speed,
            sunrise_local: data.sys?.sunrise ? toLocalTime(data.sys.sunrise) : "N/A",
            sunset_local: data.sys?.sunset ? toLocalTime(data.sys.sunset) : "N/A",
            coords: { lat: data.coord.lat, lon: data.coord.lon },
            timezone_offset_sec: tzOffsetSec,
        };
    } catch {
        return null;
    }
}

async function fetchCityAQI(lat, lon) {
    if (!OWM_KEY || lat == null || lon == null) return null;

    try {
        const data = await fetchJson(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`,
            3000
        );
        const point = data?.list?.[0];
        if (!point) return null;

        const aqiLabels = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };

        return {
            aqi_index: point.main.aqi,
            aqi_label: aqiLabels[point.main.aqi] || "Unknown",
            components: point.components,
        };
    } catch {
        return null;
    }
}

/* ------------------------------------------------------------------ */
/* 4. Multi-Model Generative AI Caller with Automatic Failover        */
/* ------------------------------------------------------------------ */
async function generateContentWithFailover(prompt) {
    if (!genAI) {
        throw new Error("Gemini AI SDK is not initialized.");
    }

    let lastError = null;

    for (const modelName of MODEL_POOL) {
        try {
            const m = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                },
            });
            const result = await m.generateContent(prompt);
            const text = result.response.text().trim();
            if (text) {
                return text;
            }
        } catch (err) {
            lastError = err;
            console.warn(`Model ${modelName} notice: ${err.message}. Trying next available model...`);
        }
    }

    throw lastError || new Error("All Gemini models were unavailable.");
}

/* ------------------------------------------------------------------ */
/* 5. System Prompt Builder                                            */
/* ------------------------------------------------------------------ */
function buildSystemPrompt({ message, history, city, liveWeather, liveAqi }) {
    const historyText = Array.isArray(history) && history.length > 0
        ? history.slice(-4).map(h => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n")
        : "None";

    return `You are EcoTwin AI, a helpful, precise, friendly, and ultra-fast AI assistant.

CRITICAL INSTRUCTIONS:
1. Answer the user's question directly, accurately, and thoroughly.
2. DO NOT use markdown header hashtags (#, ##, ###, ####). Use bold text (e.g. **Heading**) for section titles, bullet points (* ), and clean paragraphs.
3. Automatically detect the user's language (Tamil, Hindi, Malayalam, English, etc.) and respond in that language.
4. Begin line 1 with a language tag: [LANG:xx-XX] (e.g. [LANG:en-IN], [LANG:ta-IN]).

CONVERSATION HISTORY:
${historyText}

LIVE ENVIRONMENTAL / WEATHER CONTEXT (Use ONLY if user asks about weather/temp/AQI):
- City: ${city || "None"}
- Weather: ${liveWeather ? JSON.stringify(liveWeather) : "N/A"}
- Air Quality: ${liveAqi ? JSON.stringify(liveAqi) : "N/A"}

USER QUESTION TO ANSWER NOW: "${message}"`;
}

/* ------------------------------------------------------------------ */
/* 6. Smart Fallback Engine                                            */
/* ------------------------------------------------------------------ */
function generateSmartFallbackReply({ message, city, liveWeather, liveAqi }) {
    const q = message.toLowerCase().trim();

    if (liveWeather) {
        const displayCity = liveWeather.city || city || "Requested Location";
        const temp = liveWeather.temp !== undefined ? `${liveWeather.temp}°C` : "N/A";
        const cond = liveWeather.description || liveWeather.condition || "Clear";
        const hum = liveWeather.humidity !== undefined ? `${liveWeather.humidity}%` : "N/A";
        const wind = liveWeather.wind_speed !== undefined ? `${liveWeather.wind_speed} m/s` : "N/A";
        const aqiText = liveAqi ? ` Air Quality: ${liveAqi.aqi_label} (AQI ${liveAqi.aqi_index}).` : "";

        return {
            reply: `Live Environmental Report for **${displayCity}**:\n\n* **Temperature:** ${temp} (Feels like ${liveWeather.feels_like ?? temp}°C)\n* **Condition:** ${cond}\n* **Humidity:** ${hum}\n* **Wind Speed:** ${wind}\n* **Sunrise / Sunset:** ${liveWeather.sunrise_local || "N/A"} / ${liveWeather.sunset_local || "N/A"}.${aqiText}`,
            detectedLang: "en-IN"
        };
    }

    if (q.includes("eat") || q.includes("food") || q.includes("hungry") || q.includes("snack") || q.includes("crav") || q.includes("recipe") || q.includes("bajji")) {
        return {
            reply: "Delicious snack options:\n\n* **Hot Crispy Bajjis / Pakoras:** Made with paneer, chilli, or potato coated in seasoned besan batter.\n* **Hot Drinks:** Masala Chai, Ginger Tea, or Filter Coffee.\n* **Warm Soups:** Tomato or Vegetable Corn Soup.\n\nWould you like a specific step-by-step recipe?",
            detectedLang: "en-IN"
        };
    }

    const isTamil = /\b(vanakkam|vanakam|வணக்கம்|nandri|நன்றி)\b/i.test(q);
    if (isTamil) {
        return { reply: `வணக்கம்! நான் EcoTwin AI. உங்களுக்கு எவ்வாறு உதவ வேண்டும்?`, detectedLang: "ta-IN" };
    }

    return {
        reply: `I am EcoTwin AI — your interactive AI assistant. Ask me any question about food recipes, weather, tech, or daily advice!`,
        detectedLang: "en-IN"
    };
}

/* ------------------------------------------------------------------ */
/* 7. Language Tag Parser                                              */
/* ------------------------------------------------------------------ */
function parseLangTag(rawText) {
    const match = rawText.match(/^\[LANG:([a-z]{2}-[A-Z]{2})\]\s*/);
    if (match) {
        return {
            detectedLang: match[1],
            reply: rawText.slice(match[0].length).trim(),
        };
    }
    return { detectedLang: guessBCP47(rawText), reply: rawText.trim() };
}

function guessBCP47(text) {
    if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN";
    if (/[\u0D00-\u0D7F]/.test(text)) return "ml-IN";
    if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
    if (/[\u0C80-\u0CFF]/.test(text)) return "kn-IN";
    if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN";
    if (/[\u0980-\u09FF]/.test(text)) return "bn-IN";
    return "en-IN";
}

/* ------------------------------------------------------------------ */
/* 8. Main Controller Handler                                          */
/* ------------------------------------------------------------------ */
exports.chatWithAssistant = async (req, res) => {
    try {
        const { message, history, context } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "message is required" });
        }

        const trimmedMessage = message.trim();
        const isGreeting = GREETINGS_REGEX.test(trimmedMessage.toLowerCase());

        let city = null;
        let liveWeather = null;
        let liveAqi = null;

        if (!isGreeting && isWeatherQuery(trimmedMessage)) {
            city = extractCityFallback(trimmedMessage, context?.defaultCity || "Bengaluru");
            if (city) {
                liveWeather = await fetchCityWeather(city);
                if (liveWeather?.coords) {
                    liveAqi = await fetchCityAQI(liveWeather.coords.lat, liveWeather.coords.lon);
                }
            }
        }

        if (genAI) {
            try {
                const prompt = buildSystemPrompt({
                    message: trimmedMessage,
                    history,
                    city,
                    liveWeather,
                    liveAqi,
                });

                const rawText = await generateContentWithFailover(prompt);

                if (rawText) {
                    const { reply, detectedLang } = parseLangTag(rawText);
                    const cleanReply = reply.replace(/^#{1,6}\s+/gm, "");
                    return res.json({ reply: cleanReply, detectedLang, resolvedCity: city, source: "gemini" });
                }
            } catch (aiErr) {
                console.warn("Gemini AI failover exhausted (using smart fallback):", aiErr.message);
            }
        }

        const { reply: fallbackReply, detectedLang: fallbackLang } = generateSmartFallbackReply({
            message: trimmedMessage,
            city,
            liveWeather,
            liveAqi,
        });

        const cleanFallback = fallbackReply.replace(/^#{1,6}\s+/gm, "");
        return res.json({
            reply: cleanFallback,
            detectedLang: fallbackLang,
            resolvedCity: city,
            source: "smart-chatbot-fallback",
        });
    } catch (err) {
        console.error("Assistant chat exception:", err.message);
        return res.status(500).json({ error: "Failed to process assistant request" });
    }
};