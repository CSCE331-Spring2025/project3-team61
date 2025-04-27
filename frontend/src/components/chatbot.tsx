import { useState, useEffect, useRef, CSSProperties } from "react";
import { MessageCircle, Send, X } from "lucide-react";

// Language translations for welcome messages
const translations = {
  en: {
    welcomeTitle: "Welcome to BubbleBot!",
    askAnything: "Ask me anything!",
    welcomeMessage: "Ask me anything and I'll do my best to help you."
  },
  es: {
    welcomeTitle: "¡Bienvenido a BubbleBot!",
    askAnything: "¡Pregúntame lo que sea!",
    welcomeMessage: "Pregúntame lo que quieras y haré lo mejor para ayudarte."
  },
  "zh-Hans": {
    welcomeTitle: "欢迎使用 BubbleBot！",
    askAnything: "问我任何问题！",
    welcomeMessage: "问我任何问题，我会尽力帮助你。"
  },
  vi: {
    welcomeTitle: "Chào mừng đến với BubbleBot!",
    askAnything: "Hỏi tôi bất cứ điều gì!",
    welcomeMessage: "Hãy hỏi tôi bất cứ điều gì và tôi sẽ cố gắng hết sức để giúp bạn."
  },
  ko: {
    welcomeTitle: "BubbleBot에 오신 것을 환영합니다!",
    askAnything: "무엇이든 물어보세요!",
    welcomeMessage: "무엇이든 물어보세요, 최선을 다해 도와드리겠습니다."
  },
  fr: {
    welcomeTitle: "Bienvenue sur BubbleBot !",
    askAnything: "Demandez-moi n'importe quoi !",
    welcomeMessage: "Posez-moi n'importe quelle question et je ferai de mon mieux pour vous aider."
  },
  ja: {
    welcomeTitle: "BubbleBotへようこそ！",
    askAnything: "何でも聞いてください！",
    welcomeMessage: "何でも質問してください。できる限りお手伝いします。"
  },
  de: {
    welcomeTitle: "Willkommen bei BubbleBot!",
    askAnything: "Frag mich irgendwas!",
    welcomeMessage: "Stell mir eine Frage und ich werde mein Bestes tun, um dir zu helfen."
  },
  hi: {
    welcomeTitle: "BubbleBot में आपका स्वागत है!",
    askAnything: "मुझसे कुछ भी पूछें!",
    welcomeMessage: "मुझसे कुछ भी पूछें और मैं आपकी मदद करने के लिए अपना सर्वश्रेष्ठ प्रयास करूंगा।"
  },
  ar: {
    welcomeTitle: "مرحبًا بك في BubbleBot!",
    askAnything: "اسألني أي شيء!",
    welcomeMessage: "اسألني أي شيء وسأبذل قصارى جهدي لمساعدتك."
  }
};

export default function Chatbot({ language }: { language: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(language);
    
    // For cycling through languages in welcome message
    const [cycleIndex, setCycleIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const languageKeys = Object.keys(translations);
    
    // For draggable chat icon
    const [iconPosition, setIconPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const iconRef = useRef<HTMLButtonElement>(null);
    
    // For hold-to-drag functionality
    const [isHolding, setIsHolding] = useState(false);
    const [isDraggable, setIsDraggable] = useState(false);
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
    const holdDuration = 2000; // 2 seconds in milliseconds
    
    // Flag to handle initialization
    const initializedRef = useRef(false);

    // Update current language when prop changes
    useEffect(() => {
        setCurrentLanguage(language);
    }, [language]);
    
    // Handle window initialization and resize for proper positioning
    useEffect(() => {
        // Skip in SSR/during first render
        if (typeof window === 'undefined') return;
        
        const handleResize = () => {
            // If we haven't positioned the icon yet or it's at the default position
            if (!initializedRef.current || (iconPosition.x === 0 && iconPosition.y === 0)) {
                setIconPosition({
                    x: window.innerWidth - 80,
                    y: window.innerHeight - 80
                });
                initializedRef.current = true;
            }
        };
        
        // Set initial position
        handleResize();
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cycle through languages in welcome message with fluid transitions
    useEffect(() => {
        if (messages.length === 0 && isOpen) {
            const transitionInterval = setInterval(() => {
                setIsTransitioning(true);
                
                // After fade out, change the language
                setTimeout(() => {
                    setCycleIndex((prevIndex) => (prevIndex + 1) % languageKeys.length);
                    
                    // After language change, fade back in
                    setTimeout(() => {
                        setIsTransitioning(false);
                    }, 100);
                }, 500);
            }, 4000); // Total cycle time: 4 seconds
            
            return () => clearInterval(transitionInterval);
        }
    }, [messages.length, isOpen, languageKeys.length]);

    // Get the language for the welcome message
    const welcomeLanguage = messages.length === 0 ? languageKeys[cycleIndex] : currentLanguage;
    const welcomeText = translations[welcomeLanguage as keyof typeof translations] || translations.en;

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
      
      .fade-transition {
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      
      .fade-out {
        opacity: 0;
        transform: translateY(10px);
      }
      
      .fade-in {
        opacity: 1;
        transform: translateY(0);
      }
      
      .holding-indicator {
        position: absolute;
        bottom: -8px;
        left: 0;
        height: 4px;
        background-color: #4f46e5;
        border-radius: 2px;
        transition: width 2s linear;
      }
      
      @keyframes pulse-glow {
        0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
        100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
      }
      
      .draggable-glow {
        animation: pulse-glow 1.5s infinite;
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

    // Handle mouse down - start the hold timer
    const handleMouseDown = (e: React.MouseEvent) => {
        if (iconRef.current && !isOpen) {
            // Set holding state but don't enable dragging yet
            setIsHolding(true);
            
            // Calculate the drag offset
            const rect = iconRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
            
            // Start the timer for 2 seconds
            holdTimerRef.current = setTimeout(() => {
                setIsDraggable(true); // Mark as draggable after hold time
                setIsDragging(true);  // Enable dragging
            }, holdDuration);
        }
    };

    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && !isOpen) {
            // Calculate new position, keeping icon within viewport bounds
            const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 70));
            const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 70));
            
            setIconPosition({ x: newX, y: newY });
        }
    };

    // Handle mouse up - clear the timer and reset states
    const handleMouseUp = () => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        setIsDragging(false);
        setIsHolding(false);
        
        // Keep draggable state for visual feedback until next interaction
        if (!isDraggable) {
            setIsDraggable(false);
        } else {
            // Reset draggable status after a short delay
            setTimeout(() => {
                setIsDraggable(false);
            }, 500);
        }
    };

    // Handle click - only open/close when not dragging
    const handleClick = () => {
        if (!isDragging) {
            setIsOpen((prev) => !prev);
        }
    };

    // Add and remove event listeners for dragging
    useEffect(() => {
        if (isHolding || isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isHolding, isDragging, dragOffset]);

    // Cleanup the timer when unmounting or changing states
    useEffect(() => {
        return () => {
            if (holdTimerRef.current) {
                clearTimeout(holdTimerRef.current);
            }
        };
    }, []);

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
                body: JSON.stringify({ message: input, language: currentLanguage }),
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

    // Button styling with dynamic background color
    const buttonStyleClasses = `fixed text-white p-4 rounded-full shadow-lg z-50 transition-all duration-300 transform ${
        isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
    } ${isDraggable ? "bg-green-500 hover:bg-green-600 draggable-glow" : isHolding ? "bg-yellow-500 hover:bg-yellow-600" : "bg-indigo-600 hover:bg-indigo-700"}`;

    // Calculate button position styles with proper typing
    const buttonStyle: CSSProperties = {
        position: 'fixed',
        left: `${iconPosition.x}px`,
        top: `${iconPosition.y}px`,
        bottom: 'auto',
        right: 'auto',
        cursor: isDragging ? 'grabbing' : isHolding ? 'progress' : isDraggable ? 'grab' : 'pointer'
    };

    return (
        <>
            {/* Toggle Button - Draggable when not open and after holding for 2 seconds */}
            <div className="relative">
                <button
                    ref={iconRef}
                    onMouseDown={handleMouseDown}
                    onClick={handleClick}
                    className={buttonStyleClasses}
                    style={buttonStyle}
                    aria-label="Toggle chatbot"
                >
                    <MessageCircle className="w-6 h-6" />
                    {isHolding && !isDraggable && (
                        <div className="holding-indicator" style={{ width: isDraggable ? '100%' : '0%' }}></div>
                    )}
                    {isHolding && !isDraggable && (
                        <div 
                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs py-1 px-2 rounded whitespace-nowrap"
                        >
                            Hold to drag...
                        </div>
                    )}
                    {isDraggable && (
                        <div 
                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-700 text-white text-xs py-1 px-2 rounded whitespace-nowrap"
                        >
                            Draggable!
                        </div>
                    )}
                </button>
            </div>

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
                            <p className="text-sm text-indigo-500 h-5 overflow-hidden">
                                <span className={`inline-block fade-transition ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
                                    {welcomeText.askAnything}
                                </span>
                            </p>
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
                                <p className={`text-lg font-medium fade-transition ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
                                    {welcomeText.welcomeTitle}
                                </p>
                                <p className={`text-sm mt-2 fade-transition ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
                                    {welcomeText.welcomeMessage}
                                </p>
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