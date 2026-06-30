import Sidebar from "../components/Sidebar";
import { useState, useRef, useEffect } from "react";

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

  const scrollRef = useRef(null);

  // auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const sendText = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { type: "user", text: trimmed, time: new Date() }]);
    setMessage("");
    setIsTyping(true);

    // TODO: replace with real backend call
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "AI response will come from backend API.", time: new Date() },
      ]);
    }, 1100);
  };

  const handleSend = () => sendText(message);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-[#0B1120] min-h-screen relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px]" />

      <Sidebar />

      <div className="ml-64 p-8 relative">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            EcoTwin AI Assistant
          </h1>
          <p className="mt-1 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
            </span>
            Live · Bengaluru sensor mesh synced
          </p>
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
              <input
                type="text"
                placeholder="Ask EcoTwin AI..."
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
