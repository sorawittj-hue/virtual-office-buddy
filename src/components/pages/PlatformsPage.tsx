import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, RefreshCw, Cloud, Copy, Check, ExternalLink, ChevronDown, Terminal } from "lucide-react";
import { toast } from "sonner";
import { useHermesService } from "@/lib/hermes-context";
import { PLATFORMS, CATEGORY_LABELS, type PlatformInfo } from "@/lib/platforms";

const TELEGRAM_BRIDGE_CMD = `# 1. Set env vars (copy .env.local.example → .env)
cp .env.local.example .env
# Fill in TELEGRAM_BOT_TOKEN + ALLOWED_CHAT_IDS

# 2. Start the bridge
npm run telegram
# → WebSocket bridge ready at ws://localhost:18789`;

function TelegramBridgeSection({ connected }: { connected: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(TELEGRAM_BRIDGE_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
        connected
          ? "bg-status-success/10 border border-status-success/30 text-status-success"
          : "bg-muted/60 border border-border text-muted-foreground"
      }`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${connected ? "bg-status-success" : "bg-muted-foreground/50"}`} />
        {connected ? "Telegram Bridge — Connected" : "Telegram Bridge — Not running"}
      </div>
      {!connected && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Terminal className="w-3.5 h-3.5" />
              วิธีเริ่ม Bridge
            </div>
            <button onClick={copy} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <pre className="p-3 text-xs font-mono text-foreground/80 bg-background leading-relaxed overflow-x-auto">
            {TELEGRAM_BRIDGE_CMD.split("\n").map((line, i) => (
              <div key={i} className={line.startsWith("#") ? "text-primary/60" : ""}>{line || " "}</div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

function PlatformCard({
  platform,
  connected,
  expanded,
  onToggle,
}: {
  platform: PlatformInfo;
  connected: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyEnv = (key: string) => {
    navigator.clipboard.writeText(`${key}=`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <motion.div
      layout
      className={`rounded-xl border bg-card overflow-hidden transition-all ${
        connected ? "border-status-success/40" : "border-border"
      }`}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: platform.color + "15", border: `1px solid ${platform.color}30` }}
        >
          {platform.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{platform.label}</span>
            {connected && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-status-success/15 text-status-success border border-status-success/30">
                ออนไลน์
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{platform.description}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-muted/20"
          >
            <div className="p-4 space-y-3">
              {platform.id === "telegram" && <TelegramBridgeSection connected={connected} />}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Environment Variables
                </p>
                <div className="space-y-1.5">
                  {platform.envKeys.map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono px-2 py-1.5 rounded-md bg-background border border-border truncate">
                        {key}
                      </code>
                      <button
                        onClick={() => copyEnv(key)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        title="คัดลอก"
                      >
                        {copiedKey === key ? (
                          <Check className="w-3.5 h-3.5 text-status-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {platform.website && (
                <a
                  href={platform.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  เปิด {platform.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PlatformsPage() {
  const { apiService, wsState } = useHermesService();
  const isApiConnected = wsState?.status === "connected" && !!apiService;

  const [livePlatforms, setLivePlatforms] = useState<Record<string, { connected: boolean }>>({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | "all">("all");
  const [search, setSearch] = useState("");

  const fetchPlatforms = async () => {
    if (!apiService) return;
    setLoading(true);
    try {
      const data = await apiService.fetchPlatforms();
      setLivePlatforms(data);
    } catch {
      toast.error("โหลด platforms ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isApiConnected) fetchPlatforms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiConnected]);

  const isConnected = (id: string) => !!livePlatforms[id]?.connected;
  const connectedCount = Object.values(livePlatforms).filter((p) => p.connected).length;

  const filtered = PLATFORMS.filter((p) => {
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (search && !p.label.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const categories: Array<{ id: string | "all"; label: string }> = [
    { id: "all", label: `ทั้งหมด (${PLATFORMS.length})` },
    ...Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label })),
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-primary" />
            Platforms
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            {isApiConnected ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-status-success" />
                <span className="text-status-success font-medium">{connectedCount} platforms ออนไลน์</span>
              </>
            ) : (
              <span>{PLATFORMS.length} platforms ที่ Hermes รองรับ</span>
            )}
          </p>
        </div>
        {isApiConnected && (
          <button
            onClick={fetchPlatforms}
            disabled={loading}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors"
            title="รีเฟรช"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {/* Search + filter */}
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหา platform…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterCategory === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary border border-border"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform grid */}
      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map((p) => (
          <PlatformCard
            key={p.id}
            platform={p}
            connected={isConnected(p.id)}
            expanded={expanded === p.id}
            onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Layers className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">ไม่พบ platforms ที่ตรงกับ "{search}"</p>
        </div>
      )}

      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground text-sm mb-1.5">วิธีเปิด platform</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>คลิกที่ platform → คัดลอก env key</li>
          <li>ใส่ค่าใน <code className="px-1 rounded bg-muted font-mono">.env</code> ของ Hermes</li>
          <li>รัน <code className="px-1 rounded bg-muted font-mono">hermes gateway</code> ใหม่</li>
          <li>กลับมาที่หน้านี้ กดรีเฟรช → เห็น "ออนไลน์"</li>
        </ol>
      </div>
    </div>
  );
}
