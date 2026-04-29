import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, MessageSquare, Wifi } from "lucide-react";
import { useHermesService } from "@/lib/hermes-context";
import { Link } from "@tanstack/react-router";

interface ChatMessage {
  id: string;
  sender: "user" | "hermes";
  content: string;
  timestamp: number;
}

export function ChatPage() {
  const { service, wsState } = useHermesService();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "hermes",
      content: "สวัสดีครับ! ผม Hermes พนักงาน AI ของคุณ พร้อมรับคำสั่งได้เลยครับ 🙂",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isConnected = wsState?.status === "connected";

  useEffect(() => {
    const unsub = service.subscribe((event) => {
      if (event.type === "status" && event.message) {
        setIsTyping(event.status === "working");
        if (event.status !== "working") {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              sender: "hermes",
              content: event.message!,
              timestamp: Date.now(),
            },
          ]);
        }
      }
    });
    return () => unsub();
  }, [service]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender: "user", content: text, timestamp: Date.now() },
    ]);
    setInput("");

    if (service.sendChatMessage) {
      service.sendChatMessage(text);
    } else {
      service.simulateTelegramWebhook(text);
    }
  };

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-hermes/20 border-2 border-hermes flex items-center justify-center text-lg">
            🤖
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm">Hermes</h1>
            <p className="text-xs text-muted-foreground">
              {isConnected ? "เชื่อมต่อแล้ว · ออนไลน์" : "Mock Mode"}
            </p>
          </div>
        </div>
        {!isConnected && (
          <Link
            to="/gateway"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Wifi className="w-3.5 h-3.5" />
            เชื่อมต่อ Hermes จริง
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className={`flex gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-sm ${
                  msg.sender === "hermes"
                    ? "bg-hermes/20 border border-hermes/40"
                    : "bg-primary/20 border border-primary/40"
                }`}
              >
                {msg.sender === "hermes" ? (
                  <Bot className="w-3.5 h-3.5 text-hermes" />
                ) : (
                  <User className="w-3.5 h-3.5 text-primary" />
                )}
              </div>
              <div className={`max-w-[75%] ${msg.sender === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border text-card-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-hermes/20 border border-hermes/40 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-hermes" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-hermes/70"
                      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card/30 shrink-0">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {["ส่งอีเมล", "นัดประชุม", "ค้นหาข้อมูล", "สร้างรายงาน"].map((cmd) => (
              <button
                key={cmd}
                onClick={() => setInput(cmd)}
                className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border"
              >
                {cmd}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="พิมพ์คำสั่งหรือข้อความ..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
