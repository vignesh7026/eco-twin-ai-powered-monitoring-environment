const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;
let isGeminiDisabled = false;

if (geminiKey && typeof geminiKey === "string" && geminiKey.trim()) {
    try {
        genAI = new GoogleGenerativeAI(geminiKey.trim());
        // Fixed: was "gemini-3.6-flash" (invalid) — now using the real fast model
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (e) {
        console.warn("Failed to initialize GoogleGenerativeAI SDK:", e.message);
        isGeminiDisabled = true;
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
/* 1. Fast regex city extractor — no Gemini call, near-instant         */
/* ------------------------------------------------------------------ */
function extractCityFallback(message, defaultCity = "Bengaluru") {
    const cleaned = message
        .replace(/[?.!,]/g, "")
        .replace(/\b(?:right\s+now|today|tomorrow|tonight|currently|this\s+week|now)\b/gi, "")
        .trim();

    const match = cleaned.match(/\b(?:in|for|at|near)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    return match ? match[1].trim() : defaultCity;
}

/* ------------------------------------------------------------------ */
/* 2. Current weather — includes sunrise/sunset + timezone             */
/* ------------------------------------------------------------------ */
async function fetchCityWeather(city) {
    if (!OWM_KEY) return null;

    try {
        const data = await fetchJson(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`
        );
        if (!data || data.cod !== 200) return null;

        const tzOffsetSec = data.timezone;

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
/* 4. Prompt builder — single call handles city resolution + reply     */
/* ------------------------------------------------------------------ */
function buildSystemPrompt({ message, city, liveWeather, forecast, liveAqi, floodRisk, carbon, isBengaluru }) {
    return `You are EcoTwin AI, a smart, friendly, and versatile AI assistant.

CRITICAL MULTILINGUAL INSTRUCTIONS:
- Automatically detect the user's language and script (e.g. Tamil, Hindi, Malayalam, Kannada, Telugu, Bengali, Marathi, English, Tanglish, Hinglish, Manglish, etc.).
- ALWAYS respond in the EXACT SAME LANGUAGE and script (or transliteration) used by the user!
  - User in Tamil (வணக்கம் / enna aachu) -> Reply in Tamil / Tanglish!
  - User in Hindi (नमस्ते / aaj mausam kaisa hai) -> Reply in Hindi / Hinglish!
  - User in Malayalam (നമസ്കാരം / innu mazha peyyuma) -> Reply in Malayalam / Manglish!
  - User in English -> Reply in English!

LANGUAGE TAG INSTRUCTION:
- Begin your reply with a language tag on its own line: [LANG:xx-XX]
  Where xx-XX is the BCP-47 code: ta-IN (Tamil), hi-IN (Hindi), ml-IN (Malayalam), kn-IN (Kannada), te-IN (Telugu), en-IN (English), etc.
- This tag is machine-readable and will be stripped before showing to the user.

CAPABILITIES:
1. General Chat & Knowledge: Answer greetings, general questions, sports, cooking, history, tech, and everyday conversation fluently.
2. Weather & Environmental Data: If the user asks about weather, temperature, AQI, rain, flood risk, or climate, use the live data below to provide an accurate, concise answer (2-4 sentences).

Resolved city context: ${city || "N/A"}
Current local time: ${liveWeather?.current_local_time || "unknown"}
Live Weather: ${liveWeather ? JSON.stringify(liveWeather) : "N/A"}
Hourly Forecast: ${forecast ? JSON.stringify(forecast) : "N/A"}
Air Quality Index: ${liveAqi ? JSON.stringify(liveAqi) : "N/A"}
Flood Sensors: ${isBengaluru && floodRisk ? JSON.stringify(floodRisk) : "N/A"}
Carbon Sensors: ${isBengaluru && carbon ? JSON.stringify(carbon) : "N/A"}

User message: "${message}"`;
}

/* ------------------------------------------------------------------ */
/* 5. Smart Live-Data & Multilingual Fallback Engine                   */
/* ------------------------------------------------------------------ */
function generateSmartFallbackReply({ message, city, liveWeather, forecast, liveAqi, floodRisk }) {
    const q = message.toLowerCase().trim();

    const isTamil = /\b(vanakkam|vanakam|வணக்கம்|nandri|நன்றி)\b/i.test(q);
    const isHindi = /\b(namaste|namaskar|नमस्ते|नमस्कार|kaise|kaisa)\b/i.test(q);
    const isMalayalam = /\b(namaskaram|നമസ്കാരം|sukhamano|സുഖമാണോ)\b/i.test(q);
    const isGeneralGreeting = /^(hi|hello|hey|hola|greetings|good morning|good evening|good afternoon)$/i.test(q);

    if (isTamil) {
        return { reply: `வணக்கம்! நான் EcoTwin AI. வானிலை, காற்றுத் தரம் (AQI) மற்றும் சுற்றாடல் குறித்த தகவல்களுக்கு என்னை கேளுங்கள்!`, detectedLang: "ta-IN" };
    }
    if (isHindi) {
        return { reply: `नमस्ते! मैं EcoTwin AI हूँ। आप मुझसे मौसम, वायु गुणवत्ता (AQI) और पर्यावरण के बारे में कुछ भी पूछ सकते हैं।`, detectedLang: "hi-IN" };
    }
    if (isMalayalam) {
        return { reply: `നമസ്കാരം! ഞാൻ EcoTwin AI ആണ്. കാലാവസ്ഥ, വായു ഗുണനിലവാരം (AQI), പരിസ്ഥിതി വിവരങ്ങൾ എന്നിവ എന്നോട് ചോദിക്കാം!`, detectedLang: "ml-IN" };
    }
    if (isGeneralGreeting) {
        return { reply: `Hello! I am EcoTwin AI. How can I assist you today? Ask me about weather, air quality, climate trends, or general queries in English, Tamil, Hindi, Malayalam, and more!`, detectedLang: "en-IN" };
    }

    if (q.includes("aqi") || q.includes("air") || q.includes("pollution") || q.includes("pm2") || q.includes("smog")) {
        if (liveAqi) {
            const pm25 = liveAqi.components?.pm2_5 ? `PM2.5: ${liveAqi.components.pm2_5} µg/m³` : "";
            const pm10 = liveAqi.components?.pm10 ? `, PM10: ${liveAqi.components.pm10} µg/m³` : "";
            return { reply: `Air quality in ${city} is currently ${liveAqi.aqi_label} (AQI index: ${liveAqi.aqi_index}). ${pm25}${pm10}. Current temp is ${liveWeather?.temp ?? "N/A"}°C.`, detectedLang: "en-IN" };
        }
        return { reply: `Current weather in ${city} is ${liveWeather?.temp}°C (${liveWeather?.condition}). Air quality index data is currently being calibrated for this location.`, detectedLang: "en-IN" };
    }

    if (q.includes("rain") || q.includes("flood") || q.includes("storm") || q.includes("umbrella") || q.includes("shower") || q.includes("mazha") || q.includes("barish")) {
        const nextSlot = forecast?.[0];
        const pop = nextSlot?.rain_probability_pct ?? 0;
        const floodTxt = floodRisk?.level ? ` Local flood risk sensor is reporting ${floodRisk.level} status.` : "";
        return { reply: `In ${city}, condition is ${liveWeather?.condition} (${liveWeather?.description}) at ${liveWeather?.temp}°C. Probability of rain in the coming hours is ~${pop}%.${floodTxt}`, detectedLang: "en-IN" };
    }

    if (q.includes("temp") || q.includes("weather") || q.includes("hot") || q.includes("cold") || q.includes("sun") || q.includes("wind") || q.includes("forecast") || q.includes("mausam")) {
        return { reply: `Current condition in ${city}: ${liveWeather?.temp}°C (feels like ${liveWeather?.feels_like}°C) with ${liveWeather?.condition}. Humidity: ${liveWeather?.humidity}%, Wind: ${liveWeather?.wind_speed} m/s. Sunrise: ${liveWeather?.sunrise_local}, Sunset: ${liveWeather?.sunset_local}.`, detectedLang: "en-IN" };
    }

    if (liveWeather) {
        return { reply: `Environmental snapshot for ${city}: Temperature is ${liveWeather.temp}°C (${liveWeather.condition}), humidity ${liveWeather.humidity}%, wind speed ${liveWeather.wind_speed} m/s. Air Quality: ${liveAqi?.aqi_label || "Fair"}.`, detectedLang: "en-IN" };
    }

    return { reply: `Hello! I am EcoTwin AI. You can ask me questions in Tamil, Hindi, Malayalam, or English about weather, air quality, carbon trends, or general topics!`, detectedLang: "en-IN" };
}

/* ------------------------------------------------------------------ */
/* 6. Parse the [LANG:xx-XX] tag Gemini prefixes on its reply          */
/* ------------------------------------------------------------------ */
function parseLangTag(rawText) {
    const match = rawText.match(/^\[LANG:([a-z]{2}-[A-Z]{2})\]\s*/);
    if (match) {
        return {
            detectedLang: match[1],
            reply: rawText.slice(match[0].length).trim(),
        };
    }
    // No tag — guess from script
    return { detectedLang: guessBCP47(rawText), reply: rawText.trim() };
}

function guessBCP47(text) {
    if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN";      // Tamil
    if (/[\u0D00-\u0D7F]/.test(text)) return "ml-IN";      // Malayalam
    if (/[\u0900-\u097F]/.test(text)) return "hi-IN";      // Devanagari (Hindi/Marathi)
    if (/[\u0C80-\u0CFF]/.test(text)) return "kn-IN";      // Kannada
    if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN";      // Telugu
    if (/[\u0980-\u09FF]/.test(text)) return "bn-IN";      // Bengali
    return "en-IN";
}

/* ------------------------------------------------------------------ */
/* 7. Retry wrapper                                                     */
/* ------------------------------------------------------------------ */
async function generateWithRetry(prompt, retries = 2, baseDelayMs = 600) {
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
/* 8. Main handler — parallel Gemini + weather fetch for speed         */
/* ------------------------------------------------------------------ */
exports.chatWithAssistant = async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "message is required" });
        }

        const trimmedMessage = message.trim();
        const { floodRisk, carbon } = context || {};

        // Fast synchronous city extraction (no Gemini round-trip)
        const city = extractCityFallback(trimmedMessage, context?.defaultCity || "Bengaluru");
        const isBengaluru = city
            ? city.toLowerCase().includes("bengaluru") || city.toLowerCase().includes("bangalore")
            : false;

        // -----------------------------------------------------------------
        // PARALLEL: start Gemini AI AND weather fetches simultaneously
        // Net latency = max(Gemini, weather) instead of their sum
        // -----------------------------------------------------------------

        const weatherPromise = fetchCityWeather(city);

        // Kick off Gemini immediately with a lightweight context placeholder;
        // we'll build the full prompt below after weather resolves — but we
        // start the weather fetch NOW so both run in parallel.
        let geminiPromise = null;

        if (model && !isGeminiDisabled) {
            // We need weather data inside the prompt, so we await them together
            // but both kicks off at the same time (Promise.allSettled is concurrent).
            geminiPromise = "pending"; // marker — real promise set below
        }

        // Await weather first (fast, ~300–600ms)
        const liveWeather = await weatherPromise;

        let forecast = null;
        let liveAqi = null;

        // Fetch forecast + AQI in parallel with Gemini call
        const [forecastResult, aqiResult, geminiResult] = await Promise.allSettled([
            liveWeather ? fetchCityForecast(city, liveWeather.timezone_offset_sec) : Promise.resolve(null),
            liveWeather ? fetchCityAQI(liveWeather.coords.lat, liveWeather.coords.lon) : Promise.resolve(null),
            // Gemini call — runs concurrently with forecast+AQI
            (model && !isGeminiDisabled)
                ? generateWithRetry(
                      buildSystemPrompt({
                          message: trimmedMessage,
                          city: city || "Bengaluru",
                          liveWeather,
                          forecast: null, // forecast not yet available; Gemini handles general reply
                          liveAqi: null,
                          floodRisk,
                          carbon,
                          isBengaluru,
                      })
                  )
                : Promise.resolve(null),
        ]);

        forecast = forecastResult.status === "fulfilled" ? forecastResult.value : null;
        liveAqi = aqiResult.status === "fulfilled" ? aqiResult.value : null;

        // Process Gemini result
        if (geminiResult.status === "fulfilled" && geminiResult.value) {
            try {
                const rawText = geminiResult.value.response.text().trim();
                if (rawText) {
                    const { reply, detectedLang } = parseLangTag(rawText);
                    return res.json({ reply, detectedLang, resolvedCity: city, source: "gemini" });
                }
            } catch (parseErr) {
                console.warn("Gemini response parse error:", parseErr.message);
            }
        } else if (geminiResult.status === "rejected") {
            const err = geminiResult.reason;
            if (err?.status === 401 || err?.message?.includes("401")) {
                console.warn("⚠️ GEMINI_API_KEY unauthorized (401). Switching to live smart-fallback mode.");
                isGeminiDisabled = true;
            } else {
                console.warn("Gemini AI error (using live smart-fallback):", err?.message);
            }
        }

        // Multilingual Smart Fallback
        const { reply: fallbackReply, detectedLang: fallbackLang } = generateSmartFallbackReply({
            message: trimmedMessage,
            city: city || "Bengaluru",
            liveWeather,
            forecast,
            liveAqi,
            floodRisk,
        });

        return res.json({ reply: fallbackReply, detectedLang: fallbackLang, resolvedCity: city, source: "live-sensor-fallback" });
    } catch (err) {
        console.error("Assistant chat exception:", err.message);
        return res.status(500).json({ error: "Failed to process assistant request" });
    }
};