import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, MessageSquare, Wifi, Copy, Check, Trash2, Hash } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useHermesService } from "@/lib/hermes-context";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

const STORAGE_KEY = "hermes-chat-messages";
const MAX_STORED = 100;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  streaming?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
      title="คัดลอก"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-status-success" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-sm dark:prose-invert max-w-none"
      components={{
        code({ className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          if (!match) {
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-muted/60 font-mono text-xs border border-border"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" className="!rounded-xl !text-xs !my-2">
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          );
        },
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 pl-4 list-disc space-y-0.5 text-sm">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal space-y-0.5 text-sm">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 mt-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote className="pl-3 border-l-2 border-primary/50 text-muted-foreground italic mb-2 text-sm">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2 rounded-lg border border-border">
            <table className="text-xs border-collapse w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-3 py-1.5 bg-muted font-semibold text-left border-b border-border text-xs">{children}</th>
        ),
        td: ({ children }) => <td className="px-3 py-1.5 border-b border-border last:border-b-0 text-xs">{children}</td>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        hr: () => <hr className="border-border my-2" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

const SLASH_COMMANDS = [
  { cmd: "/clear", desc: "ล้างข้อความทั้งหมด" },
  { cmd: "/new", desc: "เริ่ม session ใหม่" },
  { cmd: "/help", desc: "แสดงคำสั่งทั้งหมด" },
];

const QUICK_COMMANDS = ["ส่งอีเมล", "นัดประชุม", "ค้นหาข้อมูล", "สรุปข่าว", "สร้างรายงาน"];

function loadMessages(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED)));
  } catch {}
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "สวัสดีครับ! ผม **Hermes** พนักงาน AI ของคุณ พร้อมรับคำสั่งได้เลยครับ 🙂\n\nพิมพ์ `/help` เพื่อดูคำสั่งที่รองรับ หรือส่งคำสั่งงานได้เลย!",
  timestamp: Date.now(),
};

export function ChatPage() {
  const { service, wsState } = useHermesService();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = loadMessages();
    return stored.length > 0 ? stored : [WELCOME];
  });
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const streamingIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isConnected = wsState?.status === "connected";

  // Persist messages
  useEffect(() => {
    saveMessages(messages.filter((m) => !m.streaming));
  }, [messages]);

  // Subscribe to service events
  useEffect(() => {
    const unsub = service.subscribe((event) => {
      if (event.type === "chat-stream") {
        const { id, token, done } = event;
        if (!done && !streamingIdRef.current) {
          streamingIdRef.current = id;
          setIsStreaming(true);
          setMessages((prev) => [
            ...prev,
            { id, role: "assistant", content: token, timestamp: Date.now(), streaming: true },
          ]);
        } else if (!done && streamingIdRef.current === id) {
          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: m.content + token } : m)));
        } else if (done && streamingIdRef.current === id) {
          streamingIdRef.current = null;
          setIsStreaming(false);
          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, streaming: false } : m)));
        }
      } else if (event.type === "task-complete") {
        const result = event.result;
        if (result) {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", content: result, timestamp: Date.now() },
          ]);
        }
      }
    });
    return () => unsub();
  }, [service]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSlashCommand = useCallback((cmd: string): boolean => {
    if (cmd === "/clear") {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success("ล้างข้อความแล้ว");
      return true;
    }
    if (cmd === "/new") {
      setMessages([{ ...WELCOME, id: crypto.randomUUID(), content: "เริ่ม session ใหม่แล้วครับ! มีอะไรให้ช่วยไหม? 🙂", timestamp: Date.now() }]);
      toast.success("เริ่ม session ใหม่");
      return true;
    }
    if (cmd === "/help") {
      const helpText = [
        "**Slash commands:**",
        ...SLASH_COMMANDS.map((c) => `- \`${c.cmd}\` — ${c.desc}`),
        "",
        "**คำสั่งงาน (ส่งตรงๆ ได้เลย):**",
        "ส่งอีเมล · นัดประชุม · ค้นหาข้อมูล · สร้างรายงาน · ตรวจสอบงาน · ตอบลูกค้า · สรุปข่าว · จัดการไฟล์",
        "",
        "หรือพิมพ์อะไรก็ได้ — Hermes จะตอบให้!",
      ].join("\n");
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: helpText, timestamp: Date.now() },
      ]);
      return true;
    }
    return false;
  }, []);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setShowSlashMenu(false);

    if (text.startsWith("/")) {
      const handled = handleSlashCommand(text);
      if (handled) return;
    }

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text, timestamp: Date.now() },
    ]);

    if (service.sendChatMessage) {
      service.sendChatMessage(text);
    } else {
      service.simulateTelegramWebhook(text);
    }
  }, [input, isStreaming, handleSlashCommand, service]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setShowSlashMenu(val.startsWith("/") && val.length > 0);
  };

  const filteredSlash = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(input));

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-hermes/20 border-2 border-hermes flex items-center justify-center text-lg">
              🤖
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                isConnected ? "bg-status-success" : "bg-muted-foreground/50"
              }`}
            />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm">Hermes</h1>
            <p className="text-xs text-muted-foreground">
              {isConnected ? "เชื่อมต่อแล้ว · ออนไลน์" : "Mock Mode · ไม่ได้เชื่อมต่อ"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (messages.length <= 1 || confirm("ล้างข้อความทั้งหมดใช่ไหม?")) {
                setMessages([]);
                localStorage.removeItem(STORAGE_KEY);
              }
            }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="ล้างข้อความ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {!isConnected && (
            <Link
              to="/gateway"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Wifi className="w-3.5 h-3.5" />
              เชื่อมต่อ
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className={`flex gap-3 group ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-1 ${
                  msg.role === "assistant"
                    ? "bg-hermes/20 border border-hermes/40"
                    : "bg-primary/20 border border-primary/40"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-3.5 h-3.5 text-hermes" />
                ) : (
                  <User className="w-3.5 h-3.5 text-primary" />
                )}
              </div>

              <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border text-card-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <span className="leading-relaxed whitespace-pre-wrap">{msg.content}</span>
                  ) : (
                    <div className="min-w-0">
                      <MarkdownContent content={msg.content} />
                      {msg.streaming && (
                        <motion.span
                          className="inline-block w-2 h-4 bg-hermes/70 rounded-sm ml-0.5 align-middle"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  {!msg.streaming && <CopyButton text={msg.content} />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-border bg-card/30 shrink-0">
        {/* Quick commands */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => {
                  setInput(cmd);
                  inputRef.current?.focus();
                }}
                className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border"
              >
                {cmd}
              </button>
            ))}
          </div>
        )}

        {/* Slash command menu */}
        <AnimatePresence>
          {showSlashMenu && filteredSlash.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="mb-2 rounded-xl border border-border bg-card overflow-hidden shadow-lg"
            >
              {filteredSlash.map((c) => (
                <button
                  key={c.cmd}
                  onClick={() => {
                    setInput(c.cmd);
                    setShowSlashMenu(false);
                    inputRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                >
                  <Hash className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm font-mono text-foreground">{c.cmd}</span>
                  <span className="text-xs text-muted-foreground ml-1">{c.desc}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                if (e.key === "Escape") setShowSlashMenu(false);
              }}
              placeholder={isStreaming ? "Hermes กำลังตอบ…" : "พิมพ์คำสั่งหรือ /slash…"}
              disabled={isStreaming}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>
          <button
            onClick={send}
            disabled={!input.trim() || isStreaming}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
