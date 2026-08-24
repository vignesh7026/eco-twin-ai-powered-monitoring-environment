process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const https = require("https");

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const geminiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;
let isGeminiDisabled = false;

if (geminiKey && typeof geminiKey === "string" && geminiKey.trim()) {
    try {
        genAI = new GoogleGenerativeAI(geminiKey.trim());
        model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    } catch (e) {
        console.warn("Failed to initialize GoogleGenerativeAI SDK:", e.message);
        isGeminiDisabled = true;
    }
} else {
    isGeminiDisabled = true;
}

const OWM_KEY = process.env.OPENWEATHER_API_KEY;

/* Helper for resilient fetching using Axios with TLS bypass */
async function fetchJson(url, timeoutMs = 8000) {
    try {
        const res = await axios.get(url, {
            timeout: timeoutMs,
            httpsAgent: httpsAgent,
        });
        return res.data;
    } catch (err) {
        console.warn("fetchJson notice for", url, ":", err.message);
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
/* 2. City Extractor — supports ANY city requested by user            */
/* e.g. "weather of salem", "climate in Madurai", "Tokyo temperature"  */
/* ------------------------------------------------------------------ */
function extractCityFallback(message, defaultCity = "Bengaluru") {
    if (!message || typeof message !== "string") return null;

    const cleaned = message.trim();

    // 1. Explicit preposition match: "in/for/at/near/of/about <City>"
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

    // 2. Keyword-stripping extraction for weather queries (e.g. "salem weather", "tokyo climate")
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
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`
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
            pressure: data.main.pressure,
            sunrise_local: data.sys?.sunrise ? toLocalTime(data.sys.sunrise) : "N/A",
            sunset_local: data.sys?.sunset ? toLocalTime(data.sys.sunset) : "N/A",
            current_local_time: toLocalTime(Math.floor(Date.now() / 1000)),
            coords: { lat: data.coord.lat, lon: data.coord.lon },
            timezone_offset_sec: tzOffsetSec,
        };
    } catch {
        return null;
    }
}

async function fetchCityForecast(city, tzOffsetSec) {
    if (!OWM_KEY || !city) return null;

    try {
        const data = await fetchJson(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`
        );
        if (!data || String(data.cod) !== "200") return null;

        return data.list.slice(0, 8).map((slot) => {
            const localMs = (slot.dt + tzOffsetSec) * 1000;
            const localDate = new Date(localMs);
            return {
                local_time: localDate.toUTCString().match(/\d{2}:\d{2}/)[0],
                local_date: localDate.toUTCString().split(" ").slice(0, 4).join(" "),
                temp: slot.main.temp,
                condition: slot.weather[0].main,
                description: slot.weather[0].description,
                rain_probability_pct: Math.round((slot.pop || 0) * 100),
                rain_volume_mm: slot.rain?.["3h"] || 0,
            };
        });
    } catch {
        return null;
    }
}

async function fetchCityAQI(lat, lon) {
    if (!OWM_KEY || lat == null || lon == null) return null;

    try {
        const data = await fetchJson(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`
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
/* 4. Interactive System Prompt                                        */
/* ------------------------------------------------------------------ */
function buildSystemPrompt({ message, history, city, liveWeather, forecast, liveAqi, floodRisk, carbon, isBengaluru }) {
    const historyText = Array.isArray(history) && history.length > 0
        ? history.map(h => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n")
        : "None";

    return `You are EcoTwin AI, a super-intelligent, friendly, highly interactive AI assistant and chatbot.

YOUR PERSONALITY & CAPABILITIES:
1. Environmental & Weather Priority: Whenever the user asks about the weather, temperature, AQI, climate, or rain for ANY city (e.g. Salem, Bengaluru, Chennai, Mumbai, Delhi, Madurai, Coimbatore, Tokyo, London, Paris, New York, etc.), use the live weather data below to provide a complete, clear, and accurate environmental report for that requested city.
2. Interactive Chatbot: Answer ANY other question asked by the user — food recommendations, cooking recipes, daily life advice, sports, technology, science, movies, general knowledge, or trivia!
3. Multilingual Master: Detect the language used by the user (Tamil, Hindi, Malayalam, English, Tanglish, Hinglish, etc.) and respond fluently in that exact language and script.
4. Begin reply with a language tag on line 1: [LANG:xx-XX] (e.g. [LANG:ta-IN], [LANG:hi-IN], [LANG:ml-IN], [LANG:en-IN]).

RECENT CONVERSATION HISTORY:
${historyText}

LIVE SENSOR / WEATHER CONTEXT FOR REQUESTED CITY:
- Requested City: ${city || "None requested"}
- Live Weather: ${liveWeather ? JSON.stringify(liveWeather) : "N/A"}
- Forecast: ${forecast ? JSON.stringify(forecast) : "N/A"}
- Air Quality: ${liveAqi ? JSON.stringify(liveAqi) : "N/A"}
- Flood Risk: ${isBengaluru && floodRisk ? JSON.stringify(floodRisk) : "N/A"}
- Carbon Risk: ${isBengaluru && carbon ? JSON.stringify(carbon) : "N/A"}

User message: "${message}"`;
}

/* ------------------------------------------------------------------ */
/* 5. Smart Interactive Fallback Engine                                */
/* ------------------------------------------------------------------ */
function generateSmartFallbackReply({ message, city, liveWeather, forecast, liveAqi }) {
    const q = message.toLowerCase().trim();

    // Priority 1: If live weather data was fetched for ANY city requested by user
    if (liveWeather) {
        const displayCity = liveWeather.city || city || "Requested Location";
        const temp = liveWeather.temp !== undefined ? `${liveWeather.temp}°C` : "N/A";
        const cond = liveWeather.description || liveWeather.condition || "Clear";
        const hum = liveWeather.humidity !== undefined ? `${liveWeather.humidity}%` : "N/A";
        const wind = liveWeather.wind_speed !== undefined ? `${liveWeather.wind_speed} m/s` : "N/A";
        const aqiText = liveAqi ? ` Air Quality: ${liveAqi.aqi_label} (AQI ${liveAqi.aqi_index}).` : "";

        return {
            reply: `Here is the current live environmental report for **${displayCity}**:\n\n• **Temperature:** ${temp} (Feels like ${liveWeather.feels_like ?? temp}°C)\n• **Condition:** ${cond}\n• **Humidity:** ${hum}\n• **Wind Speed:** ${wind}\n• **Sunrise / Sunset:** ${liveWeather.sunrise_local || "N/A"} / ${liveWeather.sunset_local || "N/A"}.${aqiText}\n\nFeel free to ask about any other city's environmental conditions or any question!`,
            detectedLang: "en-IN"
        };
    }

    // Priority 2: Food & Eating Advice
    if (q.includes("eat") || q.includes("food") || q.includes("hungry") || q.includes("snack") || q.includes("crav")) {
        return {
            reply: "Depending on your mood, great choices include hot snacks (samosas, pakoras, chai/coffee) or a nutritious meal like rice/roti with curry. What are you craving?",
            detectedLang: "en-IN"
        };
    }

    // Priority 3: Greetings
    const isTamil = /\b(vanakkam|vanakam|வணக்கம்|nandri|நன்றி)\b/i.test(q);
    if (isTamil) {
        return { reply: `வணக்கம்! நான் EcoTwin AI. உங்களுக்கு எவ்வாறு உதவ வேண்டும்? எந்த நகரத்தின் வானிலையும் என்னை கேட்கலாம்!`, detectedLang: "ta-IN" };
    }

    return {
        reply: `I am EcoTwin AI — your interactive AI assistant! Ask me about environmental conditions or weather in ANY city (e.g. Salem, Chennai, Madurai, Delhi, Tokyo, London), or any general question!`,
        detectedLang: "en-IN"
    };
}

/* ------------------------------------------------------------------ */
/* 6. Language Tag Parser                                              */
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
    if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN";      // Tamil
    if (/[\u0D00-\u0D7F]/.test(text)) return "ml-IN";      // Malayalam
    if (/[\u0900-\u097F]/.test(text)) return "hi-IN";      // Hindi
    if (/[\u0C80-\u0CFF]/.test(text)) return "kn-IN";      // Kannada
    if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN";      // Telugu
    if (/[\u0980-\u09FF]/.test(text)) return "bn-IN";      // Bengali
    return "en-IN";
}

/* ------------------------------------------------------------------ */
/* 7. Retry Wrapper                                                    */
/* ------------------------------------------------------------------ */
async function generateWithRetry(prompt, retries = 2, baseDelayMs = 600) {
    if (!model) {
        throw new Error("Gemini AI model is not initialized.");
    }

    let lastErr;
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await model.generateContent(prompt);
        } catch (err) {
            lastErr = err;
            const isOverloaded = err?.status === 503 || err?.status === 429;
            const isLastAttempt = attempt === retries - 1;

            if (!isOverloaded || isLastAttempt) {
                throw err;
            }

            const delay = baseDelayMs * Math.pow(2, attempt);
            console.warn(`Gemini API busy (${err.status}). Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastErr;
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
        const { floodRisk, carbon } = context || {};

        const isGreeting = GREETINGS_REGEX.test(trimmedMessage.toLowerCase());

        let city = null;
        let liveWeather = null;
        let forecast = null;
        let liveAqi = null;

        if (!isGreeting) {
            city = extractCityFallback(trimmedMessage, context?.defaultCity || "Bengaluru");
            if (city) {
                liveWeather = await fetchCityWeather(city);
            }
        }

        const isBengaluru = city
            ? city.toLowerCase().includes("bengaluru") || city.toLowerCase().includes("bangalore")
            : false;

        if (liveWeather) {
            const [forecastRes, aqiRes] = await Promise.allSettled([
                fetchCityForecast(city, liveWeather.timezone_offset_sec),
                fetchCityAQI(liveWeather.coords.lat, liveWeather.coords.lon),
            ]);
            forecast = forecastRes.status === "fulfilled" ? forecastRes.value : null;
            liveAqi = aqiRes.status === "fulfilled" ? aqiRes.value : null;
        }

        if (model && !isGeminiDisabled) {
            try {
                const prompt = buildSystemPrompt({
                    message: trimmedMessage,
                    history,
                    city,
                    liveWeather,
                    forecast,
                    liveAqi,
                    floodRisk,
                    carbon,
                    isBengaluru,
                });

                const result = await generateWithRetry(prompt);
                const rawText = result.response.text().trim();

                if (rawText) {
                    const { reply, detectedLang } = parseLangTag(rawText);
                    return res.json({ reply, detectedLang, resolvedCity: city, source: "gemini" });
                }
            } catch (aiErr) {
                console.warn("Gemini AI error (using smart fallback):", aiErr.message);
            }
        }

        const { reply: fallbackReply, detectedLang: fallbackLang } = generateSmartFallbackReply({
            message: trimmedMessage,
            city,
            liveWeather,
            forecast,
            liveAqi,
        });

        return res.json({
            reply: fallbackReply,
            detectedLang: fallbackLang,
            resolvedCity: city,
            source: "smart-chatbot-fallback",
        });
    } catch (err) {
        console.error("Assistant chat exception:", err.message);
        return res.status(500).json({ error: "Failed to process assistant request" });
    }
};