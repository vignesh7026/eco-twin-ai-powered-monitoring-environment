# 🌍 EcoTwin — AI-Powered Environmental Digital Twin

EcoTwin is a full-stack environmental monitoring platform for Bengaluru that combines live weather/AQI data, an interactive 3D dashboard, risk visualization, a climate-impact simulator, and a Gemini-powered AI assistant. It's built as a **digital twin**: a live, continuously-logged mirror of real-world environmental conditions that can also simulate "what-if" scenarios (tree planting, vehicle emissions, industrial pollution).

The project is a monorepo with a React/Vite frontend and a Node.js/Express + MongoDB backend, deployed independently (frontend on Vercel).

---

## 🚀 Features

### 📊 Dashboard
- Interactive environmental dashboard with live stat cards (active sensors, alerts, avg. temperature, AQI, risk level)
- 3D Earth visualization (`react-three-fiber` / `three.js`)
- Environmental timeline, live event stream, and AI recommendation cards
- Digital Twin panel and health/risk gauges

### 🌦 Weather Intelligence
- Live current weather, 5-day and hourly forecast via the OpenWeather API
- Temperature, humidity, wind speed, pressure, visibility, weather icons

### 🗺 Risk Intelligence Map
- Interactive India risk map (`react-leaflet`) with city-wise environmental monitoring
- Live weather for major cities, flood risk and AQI indicators

### 🌱 Climate Simulator
- Simulates environmental impact of tree plantation, vehicle emissions, and industrial pollution
- AI-assisted risk projection UI

### 🤖 EcoTwin AI Assistant — **live, backend-integrated**
- Real conversational assistant backed by **Google Gemini** (not a placeholder — fully wired end-to-end)
- Detects weather/AQI-related questions and automatically pulls live OpenWeather data into the answer
- Multilingual greeting detection (English, Tamil, Hindi, Malayalam)
- **Automatic model failover pool** — cycles through `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.7-flash`, `gemini-flash-latest` to stay resilient against per-model quota limits
- Rate-limited at the API layer (20 requests/min per client) to protect the Gemini quota

### 📈 Continuous Environmental Data Logging (research pipeline)
- A cron job (`node-cron`) logs live PM2.5, PM10, CO, NO₂, O₃, SO₂, temperature, humidity, wind speed, and rainfall for Bengaluru **every 15 minutes** into MongoDB
- `/api/history` endpoints expose this dataset as JSON or CSV, and track collection progress (`readyForForecasting` once ≥1 week of data exists)
- Includes standalone Python scripts (`ml/forecast_pm25.py`, `ml/validate_against_cpcb.py`) for short-term (1–6hr) PM2.5 forecasting using lag features + time-of-day patterns, comparing a Linear Regression baseline against Random Forest/XGBoost, with time-based (non-random) train/test splits — designed for a research paper / dissertation angle on top of the live app

---

## 🛠 Tech Stack

### Frontend (`ecotwin-frontend/`)
- React 19 + Vite 8
- Tailwind CSS 4
- React Router 7
- Framer Motion, React Icons, `react-countup`
- `react-three-fiber` + `@react-three/drei` + Three.js (3D Earth)
- `react-leaflet` (risk map)
- Recharts (charts)

### Backend (`ecotwin-backend/`)
- Node.js + Express 5
- MongoDB + Mongoose
- Socket.IO (real-time alert broadcasting — `new-alert` event)
- JWT auth + bcrypt (`/api/auth/register`, `/api/auth/login`)
- `express-rate-limit` on the assistant endpoint
- `node-cron` for the 15-minute environmental data logger
- Google Gemini (`@google/generative-ai`, `@google/genai`) for the AI assistant
- `better-sqlite3`, `openai` present as dependencies (available for future use)

### APIs
- OpenWeather (current weather, forecast, air pollution)
- Google Gemini API (assistant)

### ML / Research (`ecotwin-backend/ml/`)
- Python: `pandas`, `scikit-learn`, `xgboost`, `matplotlib`

---

## 📂 Project Structure

```
eco-twin-ai-powered-monitoring-environment/
│
├── ecotwin-frontend/                # React + Vite app
│   ├── src/
│   │   ├── components/              # Earth3D, WeatherWidget, RiskMapPreview,
│   │   │                             # DigitalTwinPanel, AIOrb, LiveAQIChart,
│   │   │                             # LiveEventStream, AlertBanner, etc.
│   │   ├── pages/                   # Dashboard, Weather, RiskMap, Simulator, Assistant
│   │   └── assets/
│   └── vercel.json
│
├── ecotwin-backend/                 # Node.js + Express API
│   ├── config/db.js                 # MongoDB connection
│   ├── controllers/                 # auth, weather, dashboard, alert, assistant
│   ├── routes/                      # /api/auth, /weather, /dashboard, /alerts,
│   │                                 # /assistant, /history (+ stubs below)
│   ├── models/                      # User, Reading, Alert, WeatherHistory,
│   │                                 # AirQuality, ChatHistory, RiskMap,
│   │                                 # SimulatorHistory, Timeline
│   ├── middleware/                  # authMiddleware, errorMiddleware
│   ├── services/                    # aiService, airQualityService,
│   │                                 # openWeatherService, simulatorService
│   ├── ml/                          # forecast_pm25.py, validate_against_cpcb.py
│   ├── logHistory.js                # 15-min cron logger
│   └── server.js
│
├── package.json                     # root build script (builds frontend)
└── vercel.json                      # root Vercel config (frontend deploy)
```

> ⚠️ **Current integration status:** `digitalTwinController.js`, `riskMapController.js`, `simulatorController.js`, and `timelineController.js` exist as empty stub files and are **not yet wired into `server.js`**. The corresponding frontend pages (Digital Twin panel, Risk Map, Simulator, Timeline) are UI-complete but currently run on local/mock data rather than live backend endpoints. Auth, Weather, Dashboard, Alerts, Assistant, and History are fully live and connected.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- MongoDB instance (local or Atlas)
- OpenWeather API key
- Google Gemini API key

### 1. Clone the repository
```bash
git clone https://github.com/vignesh7026/eco-twin-ai-powered-monitoring-environment.git
cd eco-twin-ai-powered-monitoring-environment
```

### 2. Backend setup
```bash
cd ecotwin-backend
npm install
```

Create a `.env` file in `ecotwin-backend/`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENWEATHER_API_KEY=your_openweather_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Run the backend:
```bash
npm run dev      # nodemon, hot-reload
# or
npm start
```
The API runs on `http://localhost:5000`. Health check: `GET /api/health`.

### 3. Frontend setup
```bash
cd ecotwin-frontend
npm install
```

Create a `.env` file in `ecotwin-frontend/`:
```env
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_API_BASE_URL=http://localhost:5000
```

Run the frontend:
```bash
npm run dev
```
Open `http://localhost:5173`.

---

## 📡 API Endpoints (live)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health check |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/weather/current?city=` | Current weather |
| GET | `/api/weather/forecast?city=` | 5-day forecast |
| GET | `/api/weather/air-quality?lat=&lon=` | Air pollution data |
| GET | `/api/dashboard` | Dashboard summary stats |
| GET | `/api/alerts` | List alerts |
| POST | `/api/alerts` | Create alert (broadcasts via Socket.IO) |
| POST | `/api/assistant/chat` | Chat with the Gemini-powered assistant (rate-limited) |
| GET | `/api/history/status` | Data-collection progress |
| GET | `/api/history/all` / `/since` / `/csv` | Retrieve logged environmental readings |
| GET | `/api/history/log-now` | Manually trigger a log cycle (used to keep free-tier hosts awake via external cron) |

---

## 🌐 Deployment Notes

- Frontend deploys to **Vercel** via the root `vercel.json` (`cd ecotwin-frontend && npm install && npm run build`, output `ecotwin-frontend/dist`), with SPA rewrites to `index.html`.
- Backend is designed for a free-tier host like Render, which spins down after ~15 min idle — `GET /api/history/log-now` is meant to be pinged by an external cron service (e.g. cron-job.org) so the 15-minute environmental logging never silently stops.

---

## 🎯 Roadmap

- Wire up Digital Twin, Risk Map, Simulator, and Timeline controllers to replace current mock data
- Real-time AQI push notifications
- Complete the PM2.5 forecasting pipeline into a live in-app prediction (currently a standalone offline research script)
- IoT sensor integration
- Admin dashboard + PDF report generation

---

## 👨‍💻 Author

**Vigneshwaran G**
BCA Student, Full-Stack Developer & UI/UX Designer
CHRIST (Deemed to be University), Bengaluru
GitHub: [github.com/vignesh7026](https://github.com/vignesh7026)

---

## 📜 License

Developed for educational and portfolio purposes.
