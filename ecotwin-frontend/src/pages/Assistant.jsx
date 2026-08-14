import Sidebar from "../components/Sidebar";
import { useState, useRef, useEffect, useCallback } from "react";

const BENGALURU = { lat: 12.9716, lon: 77.5946 };
const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const rawApiUrl = import.meta.env.VITE_API_URL;
const BACKEND_URL = rawApiUrl ? rawApiUrl.replace(/\/+$/, "") : "http://localhost:5000";

/* ---------------------------------------------------------- */
/* Inline icon set — no external icon library dependency      */
/* ---------------------------------------------------------- */
const IconSend = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconBot = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <line x1="12" y1="2" x2="12" y2="8" />
    <circle cx="12" cy="2" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const IconUser = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </svg>
);

const IconWind = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10a3 3 0 100-6" />
    <path d="M3 14h13a3 3 0 110 6" />
  </svg>
);

const IconDroplet = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.7l5.7 6.6a7 7 0 11-11.4 0z" />
  </svg>
);

const IconLeaf = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21c8 0 14-6 14-15-9 0-15 6-15 14 0 .3 0 .7.1 1z" />
    <path d="M5 21c2-5 5-8 9-10" />
  </svg>
);

const IconCloud = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19a4.5 4.5 0 000-9 6 6 0 10-11.4 2A4 4 0 007 19h10.5z" />
  </svg>
);

const IconMic = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0014 0" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

const IconMicOff = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="2" x2="22" y2="22" />
    <path d="M9 9v2a3 3 0 004.6 2.5" />
    <path d="M15 6.7V4a3 3 0 00-5.9-.7" />
    <path d="M5 11a7 7 0 0010 6.3" />
    <path d="M19 11a7 7 0 01-.7 3" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

const IconVolume = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.5 8.5a5 5 0 010 7" />
    <path d="M18.5 5.5a9 9 0 010 13" />
  </svg>
);

const IconVolumeOff = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

/* ---------------------------------------------------------- */
/* Static data                                                 */
/* ---------------------------------------------------------- */
const SUGGESTIONS = [
  { label: "AQI right now", icon: IconWind },
  { label: "Flood risk today", icon: IconDroplet },
  { label: "Carbon trends", icon: IconLeaf },
  { label: "Weather outlook", icon: IconCloud },
];

const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ---------------------------------------------------------- */
/* Sub-components                                               */
/* ---------------------------------------------------------- */
function Avatar({ isUser }) {
  return (
    <div
      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
        isUser
          ? "bg-slate-700 text-slate-200"
          : "bg-gradient-to-br from-teal-400/20 to-cyan-600/20 border border-teal-400/30 text-teal-300"
      }`}
    >
      {isUser ? <IconUser /> : <IconBot />}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.type === "user";
  return (
    <div
      className={`msg-enter flex items-end gap-3 max-w-[78%] ${
        isUser ? "ml-auto flex-row-reverse" : ""
      }`}
    >
      <Avatar isUser={isUser} />
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-teal-500 to-cyan-700 text-white rounded-br-md"
              : "bg-white/5 border border-white/5 text-slate-100 rounded-bl-md"
          }`}
        >
          {msg.text}
        </div>
        <span className="mt-1 text-[10px] font-mono text-slate-500 px-1">
          {formatTime(msg.time)}
        </span>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="msg-enter flex items-end gap-3 max-w-[78%]">
      <Avatar isUser={false} />
      <div className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl rounded-bl-md bg-white/5 border border-white/5">
        <span className="dot w-1.5 h-1.5 rounded-full bg-teal-400" style={{ animationDelay: "0s" }} />
        <span className="dot w-1.5 h-1.5 rounded-full bg-teal-400" style={{ animationDelay: "0.15s" }} />
        <span className="dot w-1.5 h-1.5 rounded-full bg-teal-400" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Live dashboard context for the AI                           */
/* ---------------------------------------------------------- */
function useDashboardContext() {
  const [context, setContext] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [weatherRes, aqiRes] = await Promise.all([
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${BENGALURU.lat}&lon=${BENGALURU.lon}&units=metric&appid=${OWM_KEY}`
          ),
          fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${BENGALURU.lat}&lon=${BENGALURU.lon}&appid=${OWM_KEY}`
          ),
        ]);
        const weatherJson = await weatherRes.json();
        const aqiJson = await aqiRes.json();

        const weather = {
          tempC: weatherJson?.main?.temp,
          humidity: weatherJson?.main?.humidity,
          condition: weatherJson?.weather?.[0]?.description,
          windSpeed: weatherJson?.wind?.speed,
          rain1h: weatherJson?.rain?.["1h"] ?? 0,
        };

        const pm25 = aqiJson?.list?.[0]?.components?.pm2_5;
        const aqi = {
          pm25,
          category: aqiJson?.list?.[0]?.main?.aqi,
        };

        // TODO: replace with your real flood-risk logic (RiskMap/RiskMap3D)
        const floodRisk = {
          level: weather.rain1h > 10 ? "high" : weather.rain1h > 2 ? "moderate" : "low",
          rain1hMm: weather.rain1h,
        };

        // TODO: replace with your real carbon-emissions source
        const carbon = { note: "carbon data source not yet wired" };

        if (!cancelled) setContext({ weather, aqi, floodRisk, carbon });
      } catch (err) {
        console.error("Failed to load dashboard context:", err);
        if (!cancelled) setContext({});
      }
    }

    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return context;
}

/* ---------------------------------------------------------- */
/* Voice input — Web Speech API (SpeechRecognition)             */
/* ---------------------------------------------------------- */
function useSpeechRecognition({ onResult }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  // Synchronous source of truth — React state updates are async and can lag
  // a frame behind, which is what causes "recognition has already started"
  // (InvalidStateError) on a fast click or React 18 dev double-invoke.
  const activeRef = useRef(false);
  const pendingRestartRef = useRef(false); // if stop() was called before start finished

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      activeRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onResult(transcript, event.results[event.results.length - 1].isFinal);
    };

    recognition.onerror = (event) => {
      // "aborted"/"no-speech" fire routinely on stop() or silence — not real errors
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error);
      }
      activeRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      activeRef.current = false;
      setIsListening(false);
      if (pendingRestartRef.current) {
        pendingRestartRef.current = false;
        try {
          recognition.start();
        } catch (err) {
          console.error("Failed to restart recognition:", err);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      pendingRestartRef.current = false;
      try {
        recognition.stop();
      } catch {
        /* already stopped — safe to ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || activeRef.current) return; // already running — no-op
    try {
      recognitionRef.current.start();
      // onstart will flip activeRef/isListening; setting here too keeps the
      // UI responsive even if onstart fires a tick late.
      activeRef.current = true;
      setIsListening(true);
    } catch (err) {
      // InvalidStateError: engine hadn't reported "ended" yet — ask it to
      // restart itself as soon as the current session actually ends.
      if (err?.name === "InvalidStateError") {
        pendingRestartRef.current = true;
      } else {
        console.error("Failed to start recognition:", err);
      }
    }
  }, []);

  const stop = useCallback(() => {
    pendingRestartRef.current = false;
    if (!recognitionRef.current || !activeRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      /* no-op — already stopping/stopped */
    }
  }, []);

  return { isListening, isSupported, start, stop };
}

/* ---------------------------------------------------------- */
/* Voice output — Web Speech API (SpeechSynthesis)              */
/* ---------------------------------------------------------- */
function useSpeechSynthesis() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback(
    (text) => {
      if (!isSupported || !voiceEnabled || !text) return;
      window.speechSynthesis.cancel(); // stop anything currently speaking
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, voiceEnabled]
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const toggleVoiceEnabled = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) cancel(); // muting mid-speech stops it immediately
      return !prev;
    });
  }, [cancel]);

  return { voiceEnabled, isSpeaking, isSupported, speak, cancel, toggleVoiceEnabled };
}

/* ---------------------------------------------------------- */
/* Main component                                               */
/* ---------------------------------------------------------- */
function Assistant() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hello! I am EcoTwin AI. Ask me about AQI, weather, flood risk, carbon emissions, or climate trends.",
      time: new Date(),
    },
  ]);

  const dashboardContext = useDashboardContext();
  const scrollRef = useRef(null);

  const { voiceEnabled, isSpeaking, isSupported: ttsSupported, speak, cancel: cancelSpeech, toggleVoiceEnabled } =
    useSpeechSynthesis();

  const { isListening, isSupported: sttSupported, start: startListening, stop: stopListening } =
    useSpeechRecognition({
      onResult: (transcript, isFinal) => {
        setMessage(transcript);
        if (isFinal && transcript.trim()) {
          sendText(transcript);
        }
      },
    });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const sendText = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages((prev) => [...prev, { type: "user", text: trimmed, time: new Date() }]);
      setMessage("");
      setIsTyping(true);

      try {
        const endpoint = `${BACKEND_URL}/api/assistant/chat`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, context: dashboardContext }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const replyText = data.reply || "I received your query but no message was returned.";
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: replyText, time: new Date() },
        ]);
        speak(replyText);
      } catch (err) {
        console.error("Assistant connection error calling", `${BACKEND_URL}/api/assistant/chat`, ":", err);
        const fallback = err.message?.includes("HTTP") || err.message?.includes("Failed to fetch")
          ? `Could not connect to the backend (${BACKEND_URL}). Please verify your backend server deployment and VITE_API_URL settings.`
          : `Assistant notice: ${err.message || "Please try again in a moment."}`;

        setMessages((prev) => [
          ...prev,
          { type: "bot", text: fallback, time: new Date() },
        ]);
        speak(fallback);
      } finally {
        setIsTyping(false);
      }
    },
    [dashboardContext, speak]
  );

  const handleSend = () => sendText(message);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      cancelSpeech(); // don't let the bot talk over the mic
      startListening();
    }
  };

  return (
    <div className="bg-[#0B1120] min-h-screen relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px]" />

      <Sidebar />

      <div className="ml-64 p-8 relative">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              EcoTwin AI Assistant
            </h1>
            <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
              </span>
              Live · Bengaluru sensor mesh synced
              {isListening && <span className="text-rose-400">· Listening…</span>}
              {isSpeaking && <span className="text-teal-300">· Speaking…</span>}
            </p>
          </div>

          {/* voice output toggle */}
          {ttsSupported && (
            <button
              onClick={toggleVoiceEnabled}
              title={voiceEnabled ? "Mute voice replies" : "Unmute voice replies"}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono border transition-all duration-200 ${
                voiceEnabled
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-white/5 border-white/10 text-slate-400"
              }`}
            >
              {voiceEnabled ? <IconVolume /> : <IconVolumeOff />}
              {voiceEnabled ? "Voice on" : "Voice off"}
            </button>
          )}
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-400/10 shadow-[0_0_60px_-15px_rgba(45,212,191,0.25)] rounded-3xl h-[700px] flex flex-col overflow-hidden">
          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 scroll-smooth">
            {messages.map((msg, index) => (
              <MessageBubble key={index} msg={msg} />
            ))}
            {isTyping && <TypingBubble />}
          </div>

          {/* suggestion chips */}
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => sendText(label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-teal-200/90 bg-teal-400/5 border border-teal-400/20 hover:bg-teal-400/15 hover:border-teal-400/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                <Icon className="w-3.5 h-3.5 text-teal-400" />
                {label}
              </button>
            ))}
          </div>

          {/* input area */}
          <div className="border-t border-white/5 p-4">
            <div className="flex items-center gap-3 bg-slate-950/60 border border-white/5 focus-within:border-teal-400/40 rounded-2xl px-2 py-2 transition-colors">
              {/* mic button */}
              {sttSupported && (
                <button
                  onClick={handleMicClick}
                  title={isListening ? "Stop listening" : "Speak your question"}
                  className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 active:scale-95 ${
                    isListening
                      ? "bg-rose-500/20 text-rose-400 border border-rose-400/40 shadow-[0_0_20px_-2px_rgba(244,63,94,0.5)]"
                      : "bg-white/5 text-slate-300 border border-white/10 hover:border-teal-400/40 hover:text-teal-300"
                  }`}
                  aria-label="Toggle voice input"
                >
                  {isListening ? (
                    <span className="relative flex items-center justify-center">
                      <span className="absolute inline-flex h-8 w-8 rounded-full bg-rose-400/30 animate-ping" />
                      <IconMic className="relative w-4 h-4" />
                    </span>
                  ) : (
                    <IconMic />
                  )}
                </button>
              )}

              <input
                type="text"
                placeholder={isListening ? "Listening..." : "Ask EcoTwin AI..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-white placeholder-slate-500 px-3 py-2 outline-none text-sm"
              />

              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 text-slate-950 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_-2px_rgba(45,212,191,0.6)] active:scale-95 transition-all duration-200"
                aria-label="Send message"
              >
                <IconSend />
              </button>
            </div>

            {!sttSupported && (
              <p className="mt-2 text-[10px] font-mono text-slate-500 px-1">
                Voice input isn't supported in this browser — try Chrome or Edge.
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-enter { animation: fadeInUp 0.35s ease-out; }

        @keyframes bounceDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .dot { animation: bounceDot 1.2s infinite ease-in-out; }
      `}</style>
    </div>
  );
}

export default Assistant;