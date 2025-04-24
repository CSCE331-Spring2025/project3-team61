import { useState, useEffect } from "react";
import { MessageCircle, Send, X } from "lucide-react";

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Add body class to shift main content when chat is open
    useEffect(() => {
        // Apply styles when component mounts
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
      body {
        transition: padding-right 0.3s ease;
      }
      body.chat-open {
        padding-right: 320px; /* Width of chat panel */
      }
      @media (max-width: 768px) {
        body.chat-open {
          padding-right: 0; /* Don't push content on mobile */
        }
      }
    `;
        document.head.appendChild(styleEl);

        // Cleanup function to remove styles when component unmounts
        return () => {
            document.head.removeChild(styleEl);
        };
    }, []);

    // Toggle body class based on chat state
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add("chat-open");
        } else {
            document.body.classList.remove("chat-open");
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove("chat-open");
        };
    }, [isOpen]);

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
            {/* Toggle Button - Positioned at side of screen */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className={`fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg z-50 transition-all duration-300 transform ${
                    isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
                }`}
                aria-label="Toggle chatbot"
            >
                <MessageCircle className="w-6 h-6" />
            </button>

            {/* Chat Panel - Takes up right side of screen */}
            <div
                className={`fixed top-0 right-0 h-full w-96 bg-gradient-to-b from-indigo-50 to-blue-50 border-l border-indigo-100 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="px-6 py-4 border-b border-indigo-100 bg-white/80 backdrop-blur flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="bg-indigo-600 h-10 w-10 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-indigo-900">BubbleBot</h2>
                            <p className="text-sm text-indigo-500">Ask me anything!</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="bg-white p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-indigo-50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col h-[calc(100%-8rem)]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8 text-indigo-400">
                                <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                                <p className="text-lg font-medium">Welcome to BubbleBot!</p>
                                <p className="text-sm mt-2">Ask me anything and I'll do my best to help you.</p>
                            </div>
                        )}
                        
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`transition-all duration-300 animate-fade-in ${
                                    msg.startsWith("🧑") ? "text-right" : "text-left"
                                }`}
                            >
                                <div
                                    className={`inline-block px-4 py-3 rounded-2xl max-w-[85%] shadow-md ${
                                        msg.startsWith("🧑")
                                        ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-br-none"
                                        : "bg-white text-slate-800 rounded-bl-none"
                                    }`}
                                >
                                    {msg.replace("🧑 You: ", "").replace("🤖 Bot: ", "")}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="text-left">
                                <div className="inline-block p-3 rounded-2xl bg-white text-indigo-500 rounded-bl-none shadow-md flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white/90 backdrop-blur border-t border-indigo-100">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex items-center gap-3"
                        >
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your question..."
                                disabled={loading}
                                className="flex-1 border border-indigo-200 focus:border-indigo-400 focus:ring focus:ring-indigo-100 rounded-full px-4 py-3 text-sm shadow-inner outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white p-3 rounded-full shadow transition-colors"
                                aria-label="Send message"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}