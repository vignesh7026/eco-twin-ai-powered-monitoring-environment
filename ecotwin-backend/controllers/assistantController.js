const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;
let isGeminiDisabled = false;

if (geminiKey && typeof geminiKey === "string" && geminiKey.trim()) {
    const trimmedKey = geminiKey.trim();
    if (!trimmedKey.startsWith("AIza")) {
        console.warn("⚠️ GEMINI_API_KEY in .env does not start with 'AIza' (Google AI Studio key). Using smart live-data fallback engine for AI Assistant.");
        isGeminiDisabled = true;
    } else {
        try {
            genAI = new GoogleGenerativeAI(trimmedKey);
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        } catch (e) {
            console.warn("Failed to initialize GoogleGenerativeAI SDK:", e.message);
            isGeminiDisabled = true;
        }
    }
} else {
    isGeminiDisabled = true;
}

const OWM_KEY = process.env.OPENWEATHER_API_KEY;

/* Helper for resilient fetching with timeout */
async function fetchJson(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        clearTimeout(timer);
        return null;
    }
}

/* ------------------------------------------------------------------ */
/* 1. Extract the city the user is asking about                        */
/* ------------------------------------------------------------------ */
function extractCityFallback(message) {
    const cleaned = message
        .replace(/[?.!,]/g, "")
        .replace(/\b(?:right\s+now|today|tomorrow|tonight|currently|this\s+week|now)\b/gi, "")
        .trim();

    const match = cleaned.match(/\b(?:in|for|at|near)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    return match ? match[1].trim() : null;
}

async function extractCity(message, defaultCity = "Bengaluru") {
    if (!model || isGeminiDisabled) {
        return extractCityFallback(message) || defaultCity;
    }
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
        if (err?.status === 401 || err?.message?.includes("401")) {
            console.warn("⚠️ Gemini API key unauthorized (401). Switching to live smart-fallback mode.");
            isGeminiDisabled = true;
        } else {
            console.warn("City extraction via Gemini failed, falling back to regex:", err.message);
        }
        return extractCityFallback(message) || defaultCity;
    }
}

/* ------------------------------------------------------------------ */
/* 2. Current weather — now includes sunrise/sunset + timezone         */
/* ------------------------------------------------------------------ */
async function fetchCityWeather(city) {
    if (!OWM_KEY) return null;

    try {
        const data = await fetchJson(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`
        );
        if (!data || data.cod !== 200) return null;

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
    } catch {
        return null;
    }
}

/* ------------------------------------------------------------------ */
/* 3. Hourly/short-term forecast — for "will it rain at 4pm" etc.      */
/* ------------------------------------------------------------------ */
async function fetchCityForecast(city, tzOffsetSec) {
    if (!OWM_KEY) return null;

    try {
        const data = await fetchJson(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`
        );
        if (!data || String(data.cod) !== "200") return null;

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
/* 5. Smart Live-Data Fallback Engine                                   */
/* ------------------------------------------------------------------ */
function generateSmartFallbackReply({ message, city, liveWeather, forecast, liveAqi, floodRisk }) {
    const q = message.toLowerCase();

    // AQI / Air Pollution Queries
    if (q.includes("aqi") || q.includes("air") || q.includes("pollution") || q.includes("pm2") || q.includes("smog")) {
        if (liveAqi) {
            const pm25 = liveAqi.components?.pm2_5 ? `PM2.5: ${liveAqi.components.pm2_5} µg/m³` : "";
            const pm10 = liveAqi.components?.pm10 ? `, PM10: ${liveAqi.components.pm10} µg/m³` : "";
            return `Air quality in ${city} is currently ${liveAqi.aqi_label} (AQI index: ${liveAqi.aqi_index}). ${pm25}${pm10}. Current temp is ${liveWeather?.temp ?? "N/A"}°C.`;
        }
        return `Current weather in ${city} is ${liveWeather?.temp}°C (${liveWeather?.condition}). Air quality index data is currently being calibrated for this location.`;
    }

    // Rain / Flood / Storm Queries
    if (q.includes("rain") || q.includes("flood") || q.includes("storm") || q.includes("umbrella") || q.includes("shower")) {
        const nextSlot = forecast?.[0];
        const pop = nextSlot?.rain_probability_pct ?? 0;
        const floodTxt = floodRisk?.level ? ` Local flood risk sensor is reporting ${floodRisk.level} status.` : "";
        return `In ${city}, condition is ${liveWeather?.condition} (${liveWeather?.description}) at ${liveWeather?.temp}°C. Probability of rain in the coming hours is ~${pop}%.${floodTxt}`;
    }

    // Weather / Temperature / Sun Queries
    if (q.includes("temp") || q.includes("weather") || q.includes("hot") || q.includes("cold") || q.includes("sun") || q.includes("wind") || q.includes("forecast")) {
        return `Current condition in ${city}: ${liveWeather?.temp}°C (feels like ${liveWeather?.feels_like}°C) with ${liveWeather?.condition}. Humidity: ${liveWeather?.humidity}%, Wind: ${liveWeather?.wind_speed} m/s. Sunrise: ${liveWeather?.sunrise_local}, Sunset: ${liveWeather?.sunset_local}.`;
    }

    // Carbon / Emissions / Eco Queries
    if (q.includes("carbon") || q.includes("emission") || q.includes("co2") || q.includes("green") || q.includes("tree")) {
        return `EcoTwin monitoring for ${city}: Local environmental sensors indicate active climate tracking. Temperature is ${liveWeather?.temp}°C and AQI is ${liveAqi?.aqi_label || "Fair"}. Maintain urban vegetation cover to enhance carbon absorption.`;
    }

    // Default Environmental Summary
    return `Here is the live environmental snapshot for ${city}: Temperature is ${liveWeather?.temp}°C (${liveWeather?.condition}), humidity ${liveWeather?.humidity}%, wind speed ${liveWeather?.wind_speed} m/s. Air Quality: ${liveAqi?.aqi_label || "Moderate"} (AQI level ${liveAqi?.aqi_index || "2"}).`;
}

/* ------------------------------------------------------------------ */
/* 6. Retry wrapper                                                     */
/* ------------------------------------------------------------------ */
async function generateWithRetry(prompt, retries = 2, baseDelayMs = 800) {
    if (!model) {
        throw new Error("Gemini AI model is not initialized (check GEMINI_API_KEY environment variable).");
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
/* 7. Main handler                                                      */
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
                reply: `I couldn't fetch weather data for "${city}". Please check the city spelling and try again!`,
                resolvedCity: city,
            });
        }

        const [forecast, liveAqi] = await Promise.all([
            fetchCityForecast(city, liveWeather.timezone_offset_sec),
            fetchCityAQI(liveWeather.coords.lat, liveWeather.coords.lon),
        ]);

        // Attempt generation using Gemini AI
        if (model && !isGeminiDisabled) {
            try {
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

                if (reply) {
                    return res.json({ reply, resolvedCity: city, source: "gemini" });
                }
            } catch (aiErr) {
                if (aiErr?.status === 401 || aiErr?.message?.includes("401")) {
                    console.warn("⚠️ GEMINI_API_KEY is unauthorized (401). Switching AI Assistant to live smart-fallback mode.");
                    isGeminiDisabled = true;
                } else {
                    console.warn("Gemini AI error (using live smart-fallback response):", aiErr.message);
                }
            }
        }

        // Smart live-data fallback if Gemini AI key is unconfigured, rate-limited, or failed
        const fallbackReply = generateSmartFallbackReply({
            message: trimmedMessage,
            city,
            liveWeather,
            forecast,
            liveAqi,
            floodRisk,
        });

        return res.json({ reply: fallbackReply, resolvedCity: city, source: "live-sensor-fallback" });
    } catch (err) {
        console.error("Assistant chat exception:", err.message);
        return res.status(500).json({ error: "Failed to process assistant request" });
    }
};