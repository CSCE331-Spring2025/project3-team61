import { useState } from "react";
import { MessageCircle } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = `🧑 You: ${input}`;
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (data.reply) {
        const botMsg = `🤖 Bot: ${data.reply}`;
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [...prev, "🤖 Bot: (no response)"]);
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages((prev) => [
        ...prev,
        "🤖 Bot: Sorry, something went wrong with the server.",
      ]);
    } finally {
      setLoading(false);
    }
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

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-white border shadow-lg rounded-xl p-4 z-40">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Chatbot</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="h-64 overflow-y-auto bg-gray-100 p-2 rounded mb-2">
            {messages.map((msg, idx) => (
              <div key={idx} className="text-sm mb-1 whitespace-pre-wrap">
                {msg}
              </div>
            ))}
            {loading && (
              <div className="text-sm text-gray-500">🤖 Bot: typing...</div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 border p-2 rounded text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
