import { useState } from "react";
import { MessageCircle } from "lucide-react";

interface ChatbotProps {
  language?: string;
  t?: (key: string) => string;
}

export default function Chatbot({ t = (s) => s }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = `🧑 ${t("You")}: ${input}`;
    const botMessage = `🤖 ${t("Bot")}: ${generateReply(input)}`;
    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
  };

  const generateReply = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes("hi")) return t("Hello there!");
    if (lower.includes("order")) return t("You can place your order through the menu.");
    return t("I'm not sure how to respond to that.");
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50"
        aria-label="Toggle chatbot"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chatbot Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-white border shadow-lg rounded-xl p-4 z-40">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">{t("Chatbot")}</h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <div className="h-64 overflow-y-auto bg-gray-100 p-2 rounded mb-2">
            {messages.map((msg, idx) => (
              <div key={idx} className="text-sm mb-1">{msg}</div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 border p-2 rounded text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("Type a message...")}
            />
            <button
              onClick={handleSend}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              {t("Send")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
