import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Network,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Terminal,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react";
import { useHermesService } from "@/lib/hermes-context";

const DEFAULT_WS_URL = "ws://localhost:18789";

const protocolSnippet = `// ตัวอย่าง Node.js backend (ws library)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 18789 });

wss.on('connection', (ws) => {
  // รับคำสั่งจาก web app
  ws.on('message', (data) => {
    const msg = JSON.parse(data);

    if (msg.type === 'command') {
      // เริ่มงาน → ส่ง task-start
      ws.send(JSON.stringify({
        type: 'task-start',
        task: {
          id: crypto.randomUUID(),
          command: msg.command,
          status: 'working',
          timestamp: Date.now(),
          startedAt: Date.now(),
          steps: [
            { id: crypto.randomUUID(), label: 'กำลังดำเนินการ', status: 'pending' }
          ]
        }
      }));

      // อัพเดท step → ส่ง task-step
      // เสร็จแล้ว → ส่ง task-complete
      ws.send(JSON.stringify({
        type: 'task-complete',
        taskId: '<task-id>',
        result: 'เสร็จเรียบร้อย!'
      }));
    }
  });

  // แจ้งสถานะ Hermes
  ws.send(JSON.stringify({
    type: 'status',
    status: 'idle',
    message: 'พร้อมรับงานครับ ☕'
  }));
});`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "คัดลอกแล้ว" : "คัดลอก"}
    </button>
  );
}

export function GatewayPage() {
  const { wsState, connectWs, disconnectWs } = useHermesService();
  const [url, setUrl] = useState(() => localStorage.getItem("hermes-ws-url") || DEFAULT_WS_URL);
  const [token, setToken] = useState(() => localStorage.getItem("hermes-ws-token") || "");
  const [showToken, setShowToken] = useState(false);

  const isConnected = wsState?.status === "connected";
  const isConnecting = wsState?.status === "connecting";
  const isInsecure = url.startsWith("ws://") && !url.startsWith("ws://localhost");

  useEffect(() => {
    const savedUrl = localStorage.getItem("hermes-ws-url");
    const savedToken = localStorage.getItem("hermes-ws-token");
    if (savedUrl) setUrl(savedUrl);
    if (savedToken) setToken(savedToken);
  }, []);

  const handleConnect = () => connectWs(url, token || undefined);

  const statusIcon = isConnected ? (
    <CheckCircle2 className="w-5 h-5 text-status-success" />
  ) : isConnecting ? (
    <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
  ) : wsState?.status === "error" ? (
    <XCircle className="w-5 h-5 text-destructive" />
  ) : (
    <WifiOff className="w-5 h-5 text-muted-foreground" />
  );

  const statusText = isConnected
    ? "เชื่อมต่อแล้ว"
    : isConnecting
      ? "กำลังเชื่อมต่อ…"
      : wsState?.status === "error"
        ? `Error: ${wsState.error}`
        : "ไม่ได้เชื่อมต่อ (Mock Mode)";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <Network className="w-6 h-6 text-primary" />
          Gateway
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          เชื่อมต่อ Web App นี้กับ Hermes Agent ของคุณผ่าน WebSocket
        </p>
      </div>

      {/* Connection card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-card-foreground">WebSocket Connection</h2>
        </div>

        {/* Status */}
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
            isConnected
              ? "bg-status-success/10 border border-status-success/30 text-status-success"
              : wsState?.status === "error"
                ? "bg-destructive/10 border border-destructive/30 text-destructive"
                : "bg-muted/60 border border-border text-muted-foreground"
          }`}
        >
          {statusIcon}
          {statusText}
          {isConnected && (
            <span className="ml-auto text-xs font-normal opacity-70">{wsState?.url?.split("?")[0]}</span>
          )}
        </div>

        {/* Insecure URL warning */}
        {isInsecure && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>URL ไม่ได้เข้ารหัส (ws://) — ใช้ wss:// สำหรับ production เพื่อความปลอดภัย</span>
          </div>
        )}

        {/* URL input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            WebSocket URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isConnected && handleConnect()}
            placeholder="ws://localhost:18789"
            disabled={isConnected || isConnecting}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>

        {/* Secret key input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secret Key (WS_SECRET)
            <span className="text-muted-foreground/60 font-normal normal-case">— ถ้าตั้งค่าใน .env</span>
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isConnected && handleConnect()}
              placeholder="ว่างได้ถ้าไม่ได้ตั้ง WS_SECRET"
              disabled={isConnected || isConnecting}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {isConnected || isConnecting ? (
            <button
              onClick={disconnectWs}
              className="flex-1 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors"
            >
              ยกเลิกการเชื่อมต่อ
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={!url.trim()}
              className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              เชื่อมต่อ
            </button>
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
        <div className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm">เริ่มใช้งาน Hermes Bridge</h3>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
          {[
            "# 1. clone แล้ว install",
            "git clone <repo> && npm install",
            "",
            "# 2. ตั้งค่า .env",
            "cp .env.example .env",
            "# แก้ TELEGRAM_BOT_TOKEN, WS_SECRET, ALLOWED_CHAT_IDS",
            "",
            "# 3. รัน bridge",
            "npm run telegram",
          ].map((line, i) => (
            <div key={i} className={line.startsWith("#") ? "text-primary/70" : ""}>
              {line || <br />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Protocol documentation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card border border-border p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-card-foreground">WebSocket Protocol</h2>
        </div>

        <div className="space-y-2">
          {[
            { dir: "← รับ", type: "status", desc: "อัพเดทสถานะ Hermes (idle/working/success/error)", color: "text-blue-500" },
            { dir: "← รับ", type: "task-start", desc: "เริ่มงานใหม่พร้อม steps ทั้งหมด", color: "text-blue-500" },
            { dir: "← รับ", type: "task-step", desc: "อัพเดท step แต่ละขั้น (running/done/error)", color: "text-blue-500" },
            { dir: "← รับ", type: "task-complete", desc: "งานเสร็จ พร้อม result", color: "text-blue-500" },
            { dir: "← รับ", type: "task-error", desc: "งานผิดพลาด พร้อม error message", color: "text-blue-500" },
            { dir: "→ ส่ง", type: "command", desc: "ส่งคำสั่งไปให้ Hermes execute", color: "text-green-500" },
            { dir: "→ ส่ง", type: "chat-message", desc: "ส่งข้อความ chat", color: "text-green-500" },
            { dir: "↔ ping", type: "ping/pong", desc: "keep-alive ทุก 30 วินาที", color: "text-muted-foreground" },
          ].map((item) => (
            <div key={item.type} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-muted/40">
              <span className={`text-xs font-bold shrink-0 mt-0.5 ${item.color}`}>{item.dir}</span>
              <code className="text-xs font-mono text-foreground shrink-0">{item.type}</code>
              <span className="text-xs text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>

        {/* Code snippet */}
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
            <span className="text-xs font-mono text-muted-foreground">server.js</span>
            <CopyButton text={protocolSnippet} />
          </div>
          <pre className="p-4 text-xs font-mono text-foreground/80 overflow-x-auto bg-background leading-relaxed">
            {protocolSnippet}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}
