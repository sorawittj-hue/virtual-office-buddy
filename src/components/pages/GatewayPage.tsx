import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Globe,
  Plug,
  Activity,
  Terminal,
  ChevronDown,
  ChevronUp,
  ScanSearch,
  Server,
} from "lucide-react";
import { useHermesService } from "@/lib/hermes-context";
import { PRISM_PROXY_BASE_URL } from "@/lib/connection-mode";
import { toast } from "sonner";

const HERMES_PROBE_PORTS = [9119, 8642, 3000, 8080, 8000];

async function probeHermes(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2_000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function detectHermesUrl(): Promise<string | null> {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const candidates = HERMES_PROBE_PORTS.map((p) => `http://${hostname}:${p}`);
  if (hostname !== "localhost")
    candidates.push(...HERMES_PROBE_PORTS.map((p) => `http://localhost:${p}`));
  for (const url of candidates) {
    if (await probeHermes(url)) return url;
  }
  return null;
}

const DEFAULT_API_URL = "http://localhost:9119";
const DEFAULT_WS_URL = "ws://localhost:18789";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("คัดลอกแล้ว");
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-status-success" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function StatusBadge({ status, error }: { status?: string; error?: string }) {
  if (status === "connected") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success text-sm font-medium">
        <CheckCircle2 className="w-5 h-5" />
        เชื่อมต่อแล้ว
      </div>
    );
  }
  if (status === "connecting") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin" />
        กำลังเชื่อมต่อ…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
        <XCircle className="w-5 h-5" />
        {error ?? "เชื่อมต่อไม่ได้"}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/60 border border-border text-muted-foreground text-sm font-medium">
      <WifiOff className="w-5 h-5" />
      ยังไม่ได้เชื่อมต่อ
    </div>
  );
}

export function GatewayPage() {
  const { wsState, connectionMode, setConnectionMode, connectApi, connectWs, disconnect } =
    useHermesService();

  const savedTab =
    typeof window !== "undefined" ? (localStorage.getItem("hermes-mode") ?? "api") : "api";
  const [tab, setTab] = useState<"proxy" | "api" | "ws">(
    connectionMode === "standalone" ? "proxy" : (savedTab as "api" | "ws"),
  );

  const [apiUrl, setApiUrl] = useState(
    () => localStorage.getItem("hermes-api-url") || DEFAULT_API_URL,
  );
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("hermes-api-key") || "");
  const [wsUrl, setWsUrl] = useState(() => localStorage.getItem("hermes-ws-url") || DEFAULT_WS_URL);
  const [wsToken, setWsToken] = useState(() => localStorage.getItem("hermes-ws-token") || "");
  const [showSecret, setShowSecret] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const handleDetect = async () => {
    setDetecting(true);
    const found = await detectHermesUrl();
    setDetecting(false);
    if (found) {
      setApiUrl(found);
      setTab("api");
      toast.success(`พบ Hermes Agent ที่ ${found}`);
    } else {
      toast.error(`ไม่พบ Hermes Agent บน ports ${HERMES_PROBE_PORTS.join(", ")}`);
    }
  };

  const isConnected = wsState?.status === "connected";
  const isConnecting = wsState?.status === "connecting";

  const handleConnect = () => {
    if (tab === "proxy") {
      setConnectionMode("standalone");
      toast.success(`ใช้ Proxy mode — ${PRISM_PROXY_BASE_URL}`);
    } else if (tab === "api") {
      if (!apiUrl.trim()) return;
      setConnectionMode("hermes");
      connectApi(apiUrl.trim(), apiKey.trim() || undefined);
    } else {
      if (!wsUrl.trim()) return;
      setConnectionMode("hermes");
      connectWs(wsUrl.trim(), wsToken.trim() || undefined);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("ยกเลิกการเชื่อมต่อแล้ว");
  };

  const proxySetupSteps = [
    "# 1. ตั้งค่า .env (ใส่ OpenRouter key)",
    "cp .env.example .env",
    "# แก้ OPENROUTER_API_KEY=sk-or-...",
    "",
    "# 2. รัน Proxy Server (port 3001)",
    "npm run proxy",
    `# → Proxy พร้อมที่ ${PRISM_PROXY_BASE_URL}`,
  ];

  const apiSetupSteps = [
    "# 1. รัน Hermes Agent (port 9119)",
    "hermes dashboard --tui --host 0.0.0.0 --port 9119 --insecure --no-open",
    "",
    "# 2. ตรวจสอบ API",
    `curl http://localhost:9119/health`,
  ];

  const wsSetupSteps = [
    "# 1. ใช้ telegram-bridge.js ที่มีในโปรเจค",
    "cp .env.example .env  # แก้ WS_SECRET, OPENROUTER_API_KEY",
    "",
    "# 2. รัน bridge",
    "npm run telegram",
    "# → WS server พร้อมที่ ws://localhost:18789",
  ];

  const setupSteps =
    tab === "proxy" ? proxySetupSteps : tab === "api" ? apiSetupSteps : wsSetupSteps;

  const proxyProtocols = [
    {
      dir: "POST",
      path: "/api/chat",
      desc: "Chat streaming → OpenRouter",
      color: "text-green-500",
    },
    { dir: "GET", path: "/api/hermes/status", desc: "Hermes Agent status", color: "text-blue-500" },
    { dir: "GET", path: "/api/hermes/sessions", desc: "Chat sessions", color: "text-blue-500" },
    { dir: "GET", path: "/api/hermes/memory", desc: "Memory entries", color: "text-blue-500" },
    { dir: "GET", path: "/api/hermes/crons", desc: "Scheduled jobs", color: "text-yellow-500" },
    {
      dir: "GET",
      path: "/api/hermes/pty-token",
      desc: "PTY WebSocket token",
      color: "text-purple-500",
    },
  ];

  const apiProtocols = [
    {
      dir: "POST",
      path: "/v1/chat/completions",
      desc: "Chat + SSE streaming",
      color: "text-green-500",
    },
    { dir: "GET", path: "/v1/models", desc: "รายการ models ที่ใช้งาน", color: "text-blue-500" },
    { dir: "GET", path: "/health/detailed", desc: "สถานะและ uptime", color: "text-blue-500" },
    { dir: "GET/POST", path: "/api/jobs", desc: "Cron jobs CRUD", color: "text-yellow-500" },
    { dir: "POST", path: "/api/jobs/:id/run", desc: "รัน job ทันที", color: "text-yellow-500" },
  ];

  const wsProtocols = [
    { dir: "← รับ", path: "status", desc: "อัพเดทสถานะ Hermes", color: "text-blue-500" },
    {
      dir: "← รับ",
      path: "task-start/step/complete",
      desc: "lifecycle ของงาน",
      color: "text-blue-500",
    },
    { dir: "← รับ", path: "chat-stream", desc: "per-token streaming", color: "text-blue-500" },
    { dir: "→ ส่ง", path: "chat-message", desc: "ส่งข้อความ chat", color: "text-green-500" },
    { dir: "→ ส่ง", path: "command", desc: "สั่งให้ Hermes ทำงาน", color: "text-green-500" },
    {
      dir: "↔",
      path: "ping/pong",
      desc: "keep-alive ทุก 30 วินาที",
      color: "text-muted-foreground",
    },
  ];

  const protocols = tab === "proxy" ? proxyProtocols : tab === "api" ? apiProtocols : wsProtocols;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <Network className="w-6 h-6 text-primary" />
          Gateway
        </h1>
        <p className="text-sm text-muted-foreground mt-1">เชื่อมต่อ Dashboard กับ Hermes Agent</p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl bg-muted/50 border border-border p-1 gap-1">
        <button
          onClick={() => setTab("proxy")}
          disabled={isConnected || isConnecting}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "proxy"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          } disabled:opacity-50`}
        >
          <Server className="w-3.5 h-3.5" />
          Proxy
          <span className="text-[9px] opacity-70 font-normal hidden sm:inline">
            ไม่ต้องมี Hermes
          </span>
        </button>
        <button
          onClick={() => setTab("api")}
          disabled={isConnected || isConnecting}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "api"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          } disabled:opacity-50`}
        >
          <Globe className="w-3.5 h-3.5" />
          Hermes API
          <span className="text-[9px] opacity-70 font-normal hidden sm:inline">แนะนำ</span>
        </button>
        <button
          onClick={() => setTab("ws")}
          disabled={isConnected || isConnecting}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === "ws"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          } disabled:opacity-50`}
        >
          <Plug className="w-3.5 h-3.5" />
          WS Bridge
        </button>
      </div>

      {/* Connection card */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          {tab === "proxy" ? (
            <Server className="w-4 h-4 text-primary" />
          ) : tab === "api" ? (
            <Globe className="w-4 h-4 text-primary" />
          ) : (
            <Plug className="w-4 h-4 text-primary" />
          )}
          <h2 className="font-bold text-card-foreground text-sm">
            {tab === "proxy"
              ? "Proxy / Standalone"
              : tab === "api"
                ? "Hermes Agent REST API"
                : "WebSocket Bridge"}
          </h2>
          {tab === "proxy" && (
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              {PRISM_PROXY_BASE_URL}
            </span>
          )}
        </div>

        <StatusBadge status={wsState?.status} error={wsState?.error} />

        {tab === "proxy" ? (
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <p>
              Chat ส่งผ่าน{" "}
              <code className="font-mono text-foreground px-1 rounded bg-muted">
                proxy-server.js
              </code>{" "}
              → OpenRouter — ไม่ต้องมี Hermes Agent
            </p>
            <p>
              ตั้ง URL ใน .env:{" "}
              <code className="font-mono text-foreground px-1 rounded bg-muted">
                VITE_PRISM_PROXY_URL=http://localhost:3001
              </code>
            </p>
          </div>
        ) : tab === "api" ? (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Base URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isConnected && handleConnect()}
                placeholder="http://localhost:9119"
                disabled={isConnected || isConnecting}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                API Key
                <span className="text-muted-foreground/60 font-normal normal-case">
                  — ถ้าตั้ง API_SERVER_KEY ใน .env
                </span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="ว่างได้ถ้าใช้ local"
                  disabled={isConnected || isConnecting}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                WebSocket URL
              </label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isConnected && handleConnect()}
                placeholder="ws://localhost:18789"
                disabled={isConnected || isConnecting}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Secret Key (WS_SECRET)
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={wsToken}
                  onChange={(e) => setWsToken(e.target.value)}
                  placeholder="ว่างได้ถ้าไม่ได้ตั้ง WS_SECRET"
                  disabled={isConnected || isConnecting}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2">
          {isConnected || isConnecting ? (
            <button
              onClick={handleDisconnect}
              className="flex-1 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors"
            >
              ยกเลิกการเชื่อมต่อ
            </button>
          ) : (
            <>
              {tab === "api" && (
                <button
                  onClick={handleDetect}
                  disabled={detecting}
                  title={`สแกน ports ${HERMES_PROBE_PORTS.join(", ")}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-muted/60 text-muted-foreground text-sm font-semibold hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {detecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ScanSearch className="w-4 h-4" />
                  )}
                  {detecting ? "กำลังสแกน…" : "Detect"}
                </button>
              )}
              <button
                onClick={handleConnect}
                disabled={tab === "api" ? !apiUrl.trim() : tab === "ws" ? !wsUrl.trim() : false}
                className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {tab === "proxy" ? "ใช้ Proxy Mode" : "เชื่อมต่อ"}
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Quick setup */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl bg-primary/5 border border-primary/20 p-5 space-y-3"
      >
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-sm font-bold text-foreground"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            วิธีเริ่มต้น{" "}
            {tab === "proxy" ? "Proxy Server" : tab === "api" ? "Hermes Agent" : "WS Bridge"}
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
                  <span className="text-xs font-mono text-muted-foreground">terminal</span>
                  <CopyButton text={setupSteps.filter((l) => !l.startsWith("#")).join("\n")} />
                </div>
                <pre className="p-4 text-xs font-mono text-foreground/80 bg-background leading-relaxed overflow-x-auto">
                  {setupSteps.map((line, i) => (
                    <div key={i} className={line.startsWith("#") ? "text-primary/60" : ""}>
                      {line || " "}
                    </div>
                  ))}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Protocol reference */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card border border-border p-5 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Activity className="w-4 h-4 text-primary" />
          {tab === "proxy"
            ? "Proxy Endpoints"
            : tab === "api"
              ? "API Endpoints"
              : "WebSocket Protocol"}
        </div>
        <div className="space-y-1.5">
          {protocols.map((item) => (
            <div
              key={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40"
            >
              <span className={`text-xs font-bold shrink-0 w-20 ${item.color}`}>{item.dir}</span>
              <code className="text-xs font-mono text-foreground shrink-0">{item.path}</code>
              <span className="text-xs text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
        {tab === "api" && (
          <p className="text-xs text-muted-foreground/70">
            ใช้ header <code className="px-1 rounded bg-muted font-mono">X-Hermes-Session-Id</code>{" "}
            เพื่อรักษา conversation context ข้ามคำถาม
          </p>
        )}
      </motion.div>
    </div>
  );
}
