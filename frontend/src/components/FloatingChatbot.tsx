import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Zap,
  Sparkles,
  HelpCircle,
  MapPin,
  CreditCard,
  Car,
  Calendar,
  Shield,
} from "lucide-react"

interface Message {
  id: string
  type: "user" | "bot"
  text: string
  timestamp: Date
}

interface FAQ {
  icon: React.ReactNode
  label: string
  question: string
}

// FAQ quick buttons
const faqs: FAQ[] = [
  { icon: <Calendar className="w-3.5 h-3.5" />, label: "Book Slot", question: "How do I book a charging slot?" },
  { icon: <MapPin className="w-3.5 h-3.5" />, label: "Find Stations", question: "How can I find nearby charging stations?" },
  { icon: <CreditCard className="w-3.5 h-3.5" />, label: "Pricing", question: "What are the charging rates?" },
  { icon: <Car className="w-3.5 h-3.5" />, label: "Add Vehicle", question: "How do I add my vehicle?" },
  { icon: <Shield className="w-3.5 h-3.5" />, label: "Cancellation", question: "What is the cancellation policy?" },
  { icon: <HelpCircle className="w-3.5 h-3.5" />, label: "Help", question: "What can you help me with?" },
]

// Static placeholder responses for the chatbot
const getStaticResponse = (input: string): string => {
  const lowerInput = input.toLowerCase()
  
  if (lowerInput.includes("hello") || lowerInput.includes("hi") || lowerInput.includes("hey")) {
    return "Hello! 👋 Welcome to EVORA. I'm your AI assistant. How can I help you with EV charging today?"
  }
  
  if (lowerInput.includes("book") || lowerInput.includes("reserve") || lowerInput.includes("slot")) {
    return "To book a charging slot:\n1. Go to 'Bookings' from the dashboard\n2. Select a nearby station\n3. Choose your preferred time slot\n4. Complete the payment\n\nWould you like me to guide you through any specific step?"
  }
  
  if (lowerInput.includes("station") || lowerInput.includes("near") || lowerInput.includes("find")) {
    return "You can find nearby charging stations by:\n1. Visiting the 'Bookings' page\n2. Allowing location access\n3. Browsing available stations on the map\n\nWe show real-time availability for all stations!"
  }
  
  if (lowerInput.includes("price") || lowerInput.includes("cost") || lowerInput.includes("rate")) {
    return "Charging rates vary by station and charger type:\n• Standard (AC): ₹15-20/kWh\n• Fast (DC): ₹20-30/kWh\n• Ultra-fast: ₹30-40/kWh\n\nExact prices are shown when you select a slot."
  }
  
  if (lowerInput.includes("vehicle") || lowerInput.includes("car") || lowerInput.includes("add")) {
    return "To add or manage your vehicles:\n1. Go to 'My Cars' from the sidebar\n2. Click 'Add Vehicle'\n3. Enter your vehicle details\n\nYou can register multiple vehicles!"
  }
  
  if (lowerInput.includes("wallet") || lowerInput.includes("balance") || lowerInput.includes("pay")) {
    return "Your EVORA wallet makes payments seamless:\n• Add money via UPI or Card\n• Pay for bookings instantly\n• Track all transactions\n\nVisit the 'Wallet' section to top up!"
  }
  
  if (lowerInput.includes("cancel") || lowerInput.includes("refund")) {
    return "For cancellations:\n• Cancel up to 30 mins before slot time\n• Refunds are processed to your wallet\n• Check booking details for cancellation policy\n\nNeed help with a specific booking?"
  }
  
  if (lowerInput.includes("help") || lowerInput.includes("support")) {
    return "I'm here to help! You can ask me about:\n• Booking charging slots\n• Finding nearby stations\n• Managing your vehicles\n• Wallet & payments\n• Cancellation policies\n\nWhat would you like to know?"
  }
  
  if (lowerInput.includes("thank")) {
    return "You're welcome! 😊 Is there anything else I can help you with?"
  }
  
  return "I'm still learning! In the meantime, I can help you with:\n• Booking slots\n• Finding stations\n• Vehicle management\n• Wallet & payments\n\nThis AI assistant is currently in beta. For complex queries, please contact support."
}

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showFAQs, setShowFAQs] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "bot",
      text: "Hi there! 👋 I'm your EVORA AI assistant. How can I help you with EV charging today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSend = (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      text: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)
    setShowFAQs(false)

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse = getStaticResponse(userMessage.text)
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: botResponse,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 800 + Math.random() * 700)
  }

  const handleFAQClick = (question: string) => {
    handleSend(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // EVORA AI Logo component
  const EvoraAILogo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-14 h-14",
    }
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-emerald-500 via-cyan-400 to-emerald-600 p-[2px] shadow-[0_0_20px_rgba(52,211,153,0.4)]`}>
        <div className="w-full h-full rounded-full bg-[#0a1016] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10" />
          <svg viewBox="0 0 24 24" className={size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5"}>
            {/* Lightning bolt */}
            <path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              fill="none"
              stroke="url(#evora-gradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="evora-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 group ${isOpen ? "hidden" : ""}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          <EvoraAILogo size="lg" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#0a1016] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            EVORA AI Assistant
          </div>
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] rounded-3xl border border-white/10 bg-[#0a1016]/95 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.9)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EvoraAILogo size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">EVORA AI</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                        Smart
                      </span>
                    </div>
                    <p className="text-xs text-white/50 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Ready to assist
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2 ${msg.type === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.type === "user"
                        ? "bg-emerald-500/20"
                        : "bg-gradient-to-br from-emerald-500/30 to-cyan-500/30"
                    }`}
                  >
                    {msg.type === "user" ? (
                      <User className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.type === "user"
                        ? "bg-emerald-500/20 border border-emerald-500/30"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <p className="text-sm text-white whitespace-pre-line">{msg.text}</p>
                    <p className="text-[10px] text-white/30 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* FAQ Quick Buttons */}
            {showFAQs && (
              <div className="px-4 pb-2">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Frequently Asked</p>
                <div className="flex flex-wrap gap-2">
                  {faqs.map((faq, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleFAQClick(faq.question)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-300 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {faq.icon}
                      {faq.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-[#080c10]">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                  <Zap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
                    input.trim()
                      ? "bg-gradient-to-br from-emerald-500 to-cyan-500 text-black hover:opacity-90"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-white/30 text-center mt-2 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                Powered by EVORA AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingChatbot
