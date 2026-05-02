import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  MessageSquare,
  Wifi,
  Copy,
  Check,
  Trash2,
  Hash,
  ChevronDown,
  Search,
  X,
  BarChart2,
  Globe,
  Image,
  Code2,
  Zap,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Shield,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useHermesService } from "@/lib/hermes-context";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  checkInput,
  checkOutput,
  checkCost,
  loadGuardrailConfig,
  type GuardrailViolation,
} from "@/lib/guardrails";
import { loadWebhooks, triggerWebhook } from "@/lib/webhooks";

const STORAGE_KEY = "hermes-chat-messages";
const MAX_STORED = 100;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  streaming?: boolean;
  tokens?: number;
  cost?: number;
  guardrailViolations?: GuardrailViolation[];
}

interface StoredModel {
  id: string;
  name: string;
  isDefault: boolean;
}

// ─── Guardrail banner shown inline ───────────────────────────────────────────
function GuardrailBanner({
  violations,
  onDismiss,
  onProceed,
}: {
  violations: GuardrailViolation[];
  onDismiss: () => void;
  onProceed?: () => void;
}) {
  const hasBlock = violations.some((v) => v.severity === "block");
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className={`rounded-xl border px-4 py-3 text-sm ${
        hasBlock
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
      }`}
    >
      <div className="flex items-start gap-2">
        {hasBlock ? (
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold mb-1">
            {hasBlock ? "Guardrails บล็อกข้อความนี้" : "Guardrails ตรวจพบความเสี่ยง"}
          </div>
          <ul className="space-y-0.5">
            {violations.map((v) => (
              <li key={v.ruleId} className="text-xs opacity-90">
                <span
                  className={`font-semibold mr-1 ${v.severity === "block" ? "text-destructive" : "text-yellow-600 dark:text-yellow-400"}`}
                >
                  [{v.severity === "block" ? "BLOCK" : "WARN"}]
                </span>
                {v.message}
                {v.matched && <span className="font-mono ml-1 opacity-70">({v.matched})</span>}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-black/10 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {!hasBlock && onProceed && (
        <div className="flex gap-2 mt-2 ml-6">
          <button
            onClick={onProceed}
            className="text-xs px-3 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 font-semibold transition-colors"
          >
            ส่งต่อไป (ยืนยัน)
          </button>
          <button
            onClick={onDismiss}
            className="text-xs px-3 py-1 rounded-lg hover:bg-black/10 font-semibold transition-colors opacity-70"
          >
            ยกเลิก
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Violation badge on assistant message ────────────────────────────────────
function ViolationBadge({ violations }: { violations: GuardrailViolation[] }) {
  const [open, setOpen] = useState(false);
  if (violations.length === 0) return null;
  const hasBlock = violations.some((v) => v.severity === "block");
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
          hasBlock
            ? "bg-destructive/10 text-destructive"
            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
        }`}
      >
        <Shield className="w-2.5 h-2.5" />
        {violations.length} guardrail{violations.length > 1 ? "s" : ""}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full mb-1 left-0 w-64 bg-card border border-border rounded-xl shadow-lg p-3 z-10 space-y-1"
          >
            {violations.map((v) => (
              <div key={v.ruleId} className="text-xs">
                <span
                  className={`font-semibold ${v.severity === "block" ? "text-destructive" : "text-yellow-500"}`}
                >
                  {v.ruleName}:
                </span>{" "}
                <span className="text-muted-foreground">{v.message}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Token / Cost estimation ──────────────────────────────────────────────────
function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

const MODEL_PRICE_PER_1M: Record<string, number> = {
  "gpt-4o": 15,
  "gpt-4": 60,
  "gpt-3.5": 1.5,
  "claude-3-5-sonnet": 15,
  "claude-sonnet": 15,
  "claude-3-opus": 75,
  "claude-3-haiku": 1.25,
  "claude-haiku": 1.25,
  "gemini-2.0-flash": 0.3,
  "gemini-1.5-pro": 10.5,
  "gemini-1.5-flash": 0.075,
  "llama-3.3": 0.59,
  "llama-3.1": 0.52,
  "mistral-large": 6,
  "mistral-small": 0.6,
  "deepseek-r1": 2.19,
  "deepseek-v3": 0.27,
  "grok-2": 15,
  "command-r-plus": 2.5,
  qwen: 0.4,
  hermes: 0,
};

function estimateCost(tokens: number, modelId: string): number {
  const key = Object.keys(MODEL_PRICE_PER_1M).find((k) => modelId.toLowerCase().includes(k));
  const pricePerM = key !== undefined ? MODEL_PRICE_PER_1M[key] : 1;
  return (tokens / 1_000_000) * pricePerM;
}

function formatCost(usd: number): string {
  if (usd === 0) return "free";
  if (usd < 0.0001) return "<$0.0001";
  return `$${usd.toFixed(4)}`;
}

// ─── Slash commands ───────────────────────────────────────────────────────────
const SLASH_COMMANDS = [
  { cmd: "/clear", desc: "ล้างข้อความทั้งหมด", icon: Trash2 },
  { cmd: "/new", desc: "เริ่ม session ใหม่", icon: MessageSquare },
  { cmd: "/help", desc: "แสดงคำสั่งทั้งหมด", icon: Hash },
  { cmd: "/web", desc: "ค้นหาเว็บ <query>", icon: Globe },
  { cmd: "/image", desc: "สร้างภาพ <prompt>", icon: Image },
  { cmd: "/code", desc: "เขียนโค้ด <task>", icon: Code2 },
  { cmd: "/usage", desc: "แสดงสถิติ token / cost", icon: BarChart2 },
  { cmd: "/trigger", desc: "ทริกเกอร์ webhook <name> [prompt]", icon: Zap },
];

const QUICK_COMMANDS = ["ส่งอีเมล", "นัดประชุม", "ค้นหาข้อมูล", "สรุปข่าว", "สร้างรายงาน"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  } catch {
    /* ignore */
  }
}

function getActiveModelId(): string {
  try {
    const stored = JSON.parse(localStorage.getItem("hermes-models") || "[]") as StoredModel[];
    return stored.find((m) => m.isDefault)?.id ?? "unknown";
  } catch {
    return "unknown";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
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
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({
            className,
            children,
            ...props
          }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
            const match = /language-(\w+)/.exec(className || "");
            if (!match)
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-muted/60 font-mono text-xs border border-border"
                  {...props}
                >
                  {children}
                </code>
              );
            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="!rounded-xl !text-xs !my-2"
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          },
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-2 pl-4 list-disc space-y-0.5 text-sm">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 pl-4 list-decimal space-y-0.5 text-sm">{children}</ol>
          ),
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
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2 rounded-lg border border-border">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-1.5 bg-muted font-semibold text-left border-b border-border text-xs">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 border-b border-border last:border-b-0 text-xs">
              {children}
            </td>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          hr: () => <hr className="border-border my-2" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ModelPickerInline() {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<StoredModel[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("hermes-models") || "[]") as StoredModel[];
      setModels(stored.map((m) => ({ id: m.id, name: m.name, isDefault: m.isDefault })));
    } catch {
      setModels([]);
    }
  }, [open]);

  const active = models.find((m) => m.isDefault);
  if (models.length === 0) return null;

  const setDefault = (id: string) => {
    try {
      const stored = JSON.parse(localStorage.getItem("hermes-models") || "[]") as StoredModel[];
      const next = stored.map((m) => ({ ...m, isDefault: m.id === id }));
      const selected = next.find((m) => m.id === id);
      localStorage.setItem("hermes-models", JSON.stringify(next));
      setModels(next.map((m) => ({ id: m.id, name: m.name, isDefault: m.isDefault })));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.success(`สลับไป ${next.find((m: any) => m.id === id)?.name}`);
      setOpen(false);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
      >
        <span className="truncate max-w-[140px]">{active?.name ?? "เลือก model"}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-border bg-card shadow-lg z-20 overflow-hidden">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => setDefault(m.id)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${
                m.isDefault ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Token badge shown under assistant messages ───────────────────────────────
function TokenBadge({ tokens, cost }: { tokens: number; cost: number }) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      <Zap className="w-2.5 h-2.5 text-muted-foreground/50" />
      <span className="text-[10px] text-muted-foreground/60">
        ~{tokens.toLocaleString()} tokens · {formatCost(cost)}
      </span>
    </div>
  );
}

// ─── Welcome message ──────────────────────────────────────────────────────────
const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "สวัสดีครับ! ผม **Hermes** พนักงาน AI ของคุณ พร้อมรับคำสั่งได้เลยครับ 🙂\n\nพิมพ์ `/help` เพื่อดูคำสั่งที่รองรับ หรือส่งคำสั่งงานได้เลย!",
  timestamp: Date.now(),
};

// ─── Main component ───────────────────────────────────────────────────────────
export function ChatPage() {
  const { service, wsState, connectionMode } = useHermesService();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = loadMessages();
    return stored.length > 0 ? stored : [WELCOME];
  });
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sessionTokens, setSessionTokens] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  // Guardrails state
  const [guardrailBanner, setGuardrailBanner] = useState<{
    violations: GuardrailViolation[];
    pendingText: string;
  } | null>(null);
  const guardrailConfig = loadGuardrailConfig();
  const streamingIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isConnected = connectionMode === "standalone" || wsState?.status === "connected";

  useEffect(() => {
    saveMessages(messages.filter((m) => !m.streaming));
  }, [messages]);

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
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, content: m.content + token } : m)),
          );
        } else if (done && streamingIdRef.current === id) {
          streamingIdRef.current = null;
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== id) return m;
              const tokens = estimateTokens(m.content);
              const cost = estimateCost(tokens, getActiveModelId());
              setSessionTokens((t) => t + tokens);
              setSessionCost((c) => {
                const next = c + cost;
                // Cost circuit breaker check
                const costResult = checkCost(next, guardrailConfig);
                if (costResult.violations.length > 0) {
                  toast.warning(costResult.violations[0].message, { duration: 6000 });
                }
                return next;
              });
              // Output guardrails
              const outputResult = checkOutput(m.content, guardrailConfig);
              return {
                ...m,
                streaming: false,
                tokens,
                cost,
                guardrailViolations:
                  outputResult.violations.length > 0 ? outputResult.violations : undefined,
              };
            }),
          );
        }
      } else if (event.type === "task-complete") {
        if (event.result) {
          const tokens = estimateTokens(event.result);
          const cost = estimateCost(tokens, getActiveModelId());
          setSessionTokens((t) => t + tokens);
          setSessionCost((c) => c + cost);
          const outputResult = checkOutput(event.result, guardrailConfig);
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: event.result,
              timestamp: Date.now(),
              tokens,
              cost,
              guardrailViolations:
                outputResult.violations.length > 0 ? outputResult.violations : undefined,
            },
          ]);
        }
      }
    });
    return () => unsub();
  }, [guardrailConfig, service]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const handleSlashCommand = useCallback(
    (cmd: string): boolean => {
      const [base, ...rest] = cmd.split(" ");
      const args = rest.join(" ").trim();

      if (base === "/clear") {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
        toast.success("ล้างข้อความแล้ว");
        return true;
      }
      if (base === "/new") {
        setMessages([
          {
            ...WELCOME,
            id: crypto.randomUUID(),
            content: "เริ่ม session ใหม่แล้วครับ! มีอะไรให้ช่วยไหม? 🙂",
            timestamp: Date.now(),
          },
        ]);
        setSessionTokens(0);
        setSessionCost(0);
        toast.success("เริ่ม session ใหม่");
        return true;
      }
      if (base === "/help") {
        const helpText = [
          "**Slash Commands:**",
          ...SLASH_COMMANDS.map((c) => `- \`${c.cmd}\` — ${c.desc}`),
          "",
          "**คำสั่งงานด่วน:**",
          "ส่งอีเมล · นัดประชุม · ค้นหาข้อมูล · สร้างรายงาน · ตรวจสอบงาน · สรุปข่าว · จัดการไฟล์",
          "",
          "พิมพ์อะไรก็ได้ — Hermes ตอบให้เลย!",
        ].join("\n");
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: helpText, timestamp: Date.now() },
        ]);
        return true;
      }
      if (base === "/usage") {
        const modelId = getActiveModelId();
        const msgCount = messages.filter(
          (m) => m.role === "assistant" && m.id !== "welcome",
        ).length;
        const usageText = [
          "**Session Usage Stats** 📊",
          `- **Model:** \`${modelId}\``,
          `- **Messages:** ${msgCount} replies`,
          `- **Total tokens (est.):** ~${sessionTokens.toLocaleString()} tokens`,
          `- **Estimated cost:** ${formatCost(sessionCost)}`,
          "",
          sessionCost === 0
            ? "_This model is free or local — no charges!_ 🎉"
            : "_Estimates based on output tokens only._",
        ].join("\n");
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: usageText, timestamp: Date.now() },
        ]);
        return true;
      }
      if (base === "/web") {
        if (!args) {
          toast.error("ระบุ query: /web <ค้นหาอะไร>");
          return true;
        }
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: cmd, timestamp: Date.now() },
        ]);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        service.sendChatMessage
          ? service.sendChatMessage(`ค้นหาข้อมูลจากเว็บเกี่ยวกับ: ${args}`)
          : service.simulateTelegramWebhook(`ค้นหาข้อมูลจากเว็บเกี่ยวกับ: ${args}`);
        return true;
      }
      if (base === "/image") {
        if (!args) {
          toast.error("ระบุ prompt: /image <คำบรรยายภาพ>");
          return true;
        }
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: cmd, timestamp: Date.now() },
        ]);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        service.sendChatMessage
          ? service.sendChatMessage(`สร้างภาพ: ${args}`)
          : service.simulateTelegramWebhook(`สร้างภาพ: ${args}`);
        return true;
      }
      if (base === "/code") {
        if (!args) {
          toast.error("ระบุ task: /code <งานที่ต้องการ>");
          return true;
        }
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: cmd, timestamp: Date.now() },
        ]);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        service.sendChatMessage
          ? service.sendChatMessage(
              `เขียนโค้ดสำหรับ: ${args} (ตอบเป็น code block พร้อม syntax highlighting)`,
            )
          : service.simulateTelegramWebhook(`เขียนโค้ดสำหรับ: ${args}`);
        return true;
      }
      if (base === "/trigger") {
        const [webhookName, ...promptParts] = rest;
        if (!webhookName) {
          toast.error("ระบุชื่อ webhook: /trigger <name> [prompt]");
          return true;
        }
        const webhooks = loadWebhooks().filter((w) => w.enabled);
        const wh = webhooks.find((w) => w.name.toLowerCase() === webhookName.toLowerCase());
        if (!wh) {
          const names = webhooks.map((w) => w.name).join(", ") || "ไม่มี webhook";
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `ไม่พบ webhook ชื่อ **${webhookName}**\n\nWebhooks ที่ใช้ได้: ${names}\n\nเพิ่ม webhook ได้ที่หน้า **Tools**`,
              timestamp: Date.now(),
            },
          ]);
          return true;
        }
        const triggerPrompt = promptParts.join(" ").trim();
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: cmd, timestamp: Date.now() },
        ]);
        triggerWebhook(wh, triggerPrompt).then((result) => {
          const status = result.ok ? `✅ ${result.status}` : `❌ ${result.status || "Error"}`;
          const content = [
            `**Webhook: ${wh.name}** — ${status} _(${result.durationMs}ms)_`,
            result.body ? `\`\`\`\n${result.body.slice(0, 500)}\n\`\`\`` : "",
          ]
            .filter(Boolean)
            .join("\n\n");
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", content, timestamp: Date.now() },
          ]);
          if (result.ok) toast.success(`Webhook "${wh.name}" triggered`);
          else toast.error(`Webhook failed: ${result.status || result.body.slice(0, 60)}`);
        });
        return true;
      }
      return false;
    },
    [messages, service, sessionTokens, sessionCost],
  );

  // Actually dispatch text to service (after guardrail check passed)
  const dispatch = useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: text, timestamp: Date.now() },
      ]);
      if (service.sendChatMessage) {
        service.sendChatMessage(text);
      } else {
        service.simulateTelegramWebhook(text);
      }
    },
    [service],
  );

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setShowSlashMenu(false);
    setGuardrailBanner(null);

    if (text.startsWith("/")) {
      const handled = handleSlashCommand(text);
      if (handled) return;
    }

    // Run input guardrails
    const result = checkInput(text, guardrailConfig);
    if (!result.safe) {
      // Hard block — show banner, do not send
      setGuardrailBanner({ violations: result.violations, pendingText: text });
      return;
    }
    if (result.violations.length > 0) {
      // Warnings — show banner with confirm option
      setGuardrailBanner({ violations: result.violations, pendingText: text });
      return;
    }

    dispatch(text);
  }, [input, isStreaming, handleSlashCommand, guardrailConfig, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setShowSlashMenu(val.startsWith("/") && val.length > 0);
  };

  const filteredSlash = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(input));

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }

  function highlightMatch(text: string) {
    if (!searchQuery.trim()) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      text.slice(0, idx) +
      `**${text.slice(idx, idx + searchQuery.length)}**` +
      text.slice(idx + searchQuery.length)
    );
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
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${isConnected ? "bg-status-success" : "bg-muted-foreground/50"}`}
            />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm">Hermes</h1>
            <p className="text-xs text-muted-foreground">
              {isConnected ? "เชื่อมต่อแล้ว · ออนไลน์" : "Mock Mode · ไม่ได้เชื่อมต่อ"}
            </p>
          </div>
          <ModelPickerInline />
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1.5">
          {/* Guardrails active badge */}
          <div
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-status-success/10 text-[10px] text-status-success font-semibold"
            title="Guardrails active"
          >
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>Guardrails</span>
          </div>
          {/* Session usage badge */}
          {sessionTokens > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-[10px] text-muted-foreground">
              <Zap className="w-2.5 h-2.5" />
              <span>
                ~{sessionTokens.toLocaleString()} · {formatCost(sessionCost)}
              </span>
            </div>
          )}
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery("");
            }}
            className={`p-1.5 rounded-lg transition-colors ${showSearch ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
            title="ค้นหาข้อความ"
          >
            <Search className="w-4 h-4" />
          </button>
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

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-muted/30"
          >
            <div className="px-4 py-2 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาในประวัติข้อความ…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {searchQuery && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {filteredMessages.length} ผลลัพธ์
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {filteredMessages.map((msg) => (
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

              <div
                className={`max-w-[78%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
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
                      <MarkdownContent
                        content={searchQuery ? highlightMatch(msg.content) : msg.content}
                      />
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
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(msg.timestamp)}
                  </span>
                  {!msg.streaming && <CopyButton text={msg.content} />}
                </div>
                {/* Token / cost badge + guardrail violation badge for assistant messages */}
                {msg.role === "assistant" && !msg.streaming && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {msg.tokens && msg.tokens > 0 && (
                      <TokenBadge tokens={msg.tokens} cost={msg.cost ?? 0} />
                    )}
                    {msg.guardrailViolations && msg.guardrailViolations.length > 0 && (
                      <ViolationBadge violations={msg.guardrailViolations} />
                    )}
                  </div>
                )}
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

        {/* Guardrail banner */}
        <AnimatePresence>
          {guardrailBanner && (
            <div className="mb-2">
              <GuardrailBanner
                violations={guardrailBanner.violations}
                onDismiss={() => setGuardrailBanner(null)}
                onProceed={
                  guardrailBanner.violations.every((v) => v.severity === "warn")
                    ? () => {
                        dispatch(guardrailBanner.pendingText);
                        setGuardrailBanner(null);
                      }
                    : undefined
                }
              />
            </div>
          )}
        </AnimatePresence>

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
                    setInput(
                      c.cmd +
                        (c.cmd === "/clear" ||
                        c.cmd === "/new" ||
                        c.cmd === "/help" ||
                        c.cmd === "/usage"
                          ? ""
                          : " "),
                    );
                    setShowSlashMenu(false);
                    inputRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                >
                  <c.icon className="w-3.5 h-3.5 text-primary shrink-0" />
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
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
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
