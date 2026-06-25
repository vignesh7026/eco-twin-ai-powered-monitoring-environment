import Sidebar from "../components/Sidebar";
import { useState } from "react";

function Assistant() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hello! I am EcoTwin AI. Ask me about AQI, weather, flood risk, carbon emissions, or climate trends.",
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages([
      ...messages,
      { type: "user", text: message },
      {
        type: "bot",
        text: "AI response will come from backend API.",
      },
    ]);

    setMessage("");
  };

  return (
    <div className="bg-[#0B1120] min-h-screen">
      <Sidebar />

      <div className="ml-64 p-8">

        <h1 className="text-4xl font-bold text-white mb-6">
          EcoTwin AI Assistant
        </h1>

        <div className="bg-slate-800 rounded-3xl h-[700px] flex flex-col">

          <div className="flex-1 overflow-y-auto p-6 space-y-4">

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[70%] p-4 rounded-2xl text-white ${
                  msg.type === "user"
                    ? "bg-green-600 ml-auto"
                    : "bg-slate-700"
                }`}
              >
                {msg.text}
              </div>
            ))}

          </div>

          <div className="border-t border-slate-700 p-4 flex gap-4">

            <input
              type="text"
              placeholder="Ask EcoTwin AI..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl"
            />

            <button
              onClick={sendMessage}
              className="bg-green-600 px-6 rounded-xl text-white"
            >
              Send
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Assistant;