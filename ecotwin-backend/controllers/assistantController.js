const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const OWM_KEY = process.env.OPENWEATHER_API_KEY;

/* ------------------------------------------------------------------ */
/* 1. Extract the city the user is asking about                        */
/* ------------------------------------------------------------------ */
function extractCityFallback(message) {
    const match = message.match(/\b(?:in|for|at|near)\s+([A-Z][a-zA-Z\s]{2,30})/);
    if (match) return match[1].trim().replace(/[?.!,]+$/, "");
    return null;
}

async function extractCity(message, defaultCity = "Bengaluru") {
    try {
        const extractPrompt = `Extract ONLY the city name the user is asking about from this message. Respond with the city name alone, nothing else. If no city is mentioned, respond with exactly: NONE

Message: "${message}"`;

        const result = await model.generateContent(extractPrompt);
        const city = result.response.text().trim();

        if (!city || city.toUpperCase() === "NONE" || city.length > 60) {
            return extractCityFallback(message) || defaultCity;
        }
        return city;
    } catch (err) {
        console.warn("City extraction failed, falling back:", err.message);
        return extractCityFallback(message) || defaultCity;
    }
}

/* ------------------------------------------------------------------ */
/* 2. Current weather — now includes sunrise/sunset + timezone         */
/* ------------------------------------------------------------------ */
async function fetchCityWeather(city) {
    if (!OWM_KEY) return null;

    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`
        );
        const data = await res.json();
        if (data.cod !== 200) return null;

        const tzOffsetSec = data.timezone; // seconds offset from UTC for this city

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
            sunrise_local: toLocalTime(data.sys.sunrise),
            sunset_local: toLocalTime(data.sys.sunset),
            current_local_time: toLocalTime(Math.floor(Date.now() / 1000)),
            coords: { lat: data.coord.lat, lon: data.coord.lon },
            timezone_offset_sec: tzOffsetSec,
        };
    } catch (err) {
        console.warn("Weather fetch failed:", err.message);
        return null;
    }
}

/* ------------------------------------------------------------------ */
/* 3. Hourly/short-term forecast — for "will it rain at 4pm" etc.      */
/* ------------------------------------------------------------------ */
async function fetchCityForecast(city, tzOffsetSec) {
    if (!OWM_KEY) return null;

    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`
        );
        const data = await res.json();
        if (String(data.cod) !== "200") return null;

        // Next 24 hours as 3-hour slots, labeled with local time
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
    } catch (err) {
        console.warn("Forecast fetch failed:", err.message);
        return null;
    }
}

async function fetchCityAQI(lat, lon) {
    if (!OWM_KEY || lat == null || lon == null) return null;

    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`
        );
        const data = await res.json();
        const point = data?.list?.[0];
        if (!point) return null;

        const aqiLabels = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };

        return {
            aqi_index: point.main.aqi,
            aqi_label: aqiLabels[point.main.aqi] || "Unknown",
            components: point.components,
        };
    } catch (err) {
        console.warn("AQI fetch failed:", err.message);
        return null;
    }
}

/* ------------------------------------------------------------------ */
/* 4. Prompt builder — now includes sunrise/sunset + hourly forecast    */
/* ------------------------------------------------------------------ */
function buildSystemPrompt({ message, city, liveWeather, forecast, liveAqi, floodRisk, carbon, isBengaluru }) {
    return `You are EcoTwin AI, a climate and environmental assistant that can answer ANY question about weather, air quality, and climate conditions for any city in the world — including specific-time questions like "will it rain at 4pm", "when is sunset", "what's the temperature tonight", etc.

Answer using ONLY the live data provided below. Be concise (2-4 sentences), cite specific numbers/times with units, and clearly say a detail is unavailable rather than guessing or inventing it. If the user asks about a specific time, find the closest matching slot in the hourly forecast and say so (e.g. "closest forecast slot is 3:00 PM").

Resolved city: ${city}
Current local time in ${city}: ${liveWeather?.current_local_time || "unknown"}

Current conditions:
${liveWeather ? JSON.stringify(liveWeather) : "unavailable"}

Sunrise (local): ${liveWeather?.sunrise_local || "unavailable"}
Sunset (local): ${liveWeather?.sunset_local || "unavailable"}

Hourly forecast (next 24h, 3-hour steps, local times):
${forecast ? JSON.stringify(forecast) : "unavailable"}

Air Quality Index: ${liveAqi ? JSON.stringify(liveAqi) : "unavailable"}

Flood risk sensor data: ${isBengaluru && floodRisk ? JSON.stringify(floodRisk) : "not available — flood sensors are only deployed in Bengaluru"}
Carbon emissions sensor data: ${isBengaluru && carbon ? JSON.stringify(carbon) : "not available — carbon sensors are only deployed in Bengaluru"}

User question: ${message}`;
}

/* ------------------------------------------------------------------ */
/* 5. Retry wrapper (unchanged)                                         */
/* ------------------------------------------------------------------ */
async function generateWithRetry(prompt, retries = 3, baseDelayMs = 1000) {
    let lastErr;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await model.generateContent(prompt);
        } catch (err) {
            lastErr = err;

            const isOverloaded = err?.status === 503;
            const isLastAttempt = attempt === retries - 1;

            if (!isOverloaded || isLastAttempt) {
                throw err;
            }

            const delay = baseDelayMs * Math.pow(2, attempt);
            console.warn(
                `Gemini overloaded (503). Retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastErr;
}

/* ------------------------------------------------------------------ */
/* 6. Main handler                                                      */
/* ------------------------------------------------------------------ */
exports.chatWithAssistant = async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "message is required" });
        }

        const trimmedMessage = message.trim();
        const { floodRisk, carbon } = context || {};

        const city = await extractCity(trimmedMessage, context?.defaultCity || "Bengaluru");
        const isBengaluru = city.toLowerCase().includes("bengaluru") || city.toLowerCase().includes("bangalore");

        const liveWeather = await fetchCityWeather(city);

        if (!liveWeather) {
            return res.json({
                reply: `I couldn't find live data for "${city}". Could you check the spelling or try a nearby major city?`,
            });
        }

        const [forecast, liveAqi] = await Promise.all([
            fetchCityForecast(city, liveWeather.timezone_offset_sec),
            fetchCityAQI(liveWeather.coords.lat, liveWeather.coords.lon),
        ]);

        const prompt = buildSystemPrompt({
            message: trimmedMessage,
            city,
            liveWeather,
            forecast,
            liveAqi,
            floodRisk,
            carbon,
            isBengaluru,
        });

        const result = await generateWithRetry(prompt);
        const reply = result.response.text().trim();

        if (!reply) {
            return res.json({
                reply: "I couldn't generate a response — try rephrasing your question.",
            });
        }

        return res.json({ reply, resolvedCity: city });
    } catch (err) {
        console.error("Assistant chat error:", err.message);
        console.error("Cause:", err.cause);

        if (err?.status === 429) {
            return res.status(429).json({
                error: "Rate limit hit on the AI provider. Please wait a moment and try again.",
            });
        }

        if (err?.status === 503) {
            return res.status(503).json({
                error: "The AI model is temporarily overloaded on Google's side. Please try again in a moment.",
            });
        }

        return res.status(500).json({ error: "Failed to get AI response" });
    }
};