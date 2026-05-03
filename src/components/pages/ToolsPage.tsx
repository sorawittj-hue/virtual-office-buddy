import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Mail,
  Calendar,
  Search,
  FileText,
  MessageSquare,
  Globe,
  Database,
  GitBranch,
  Zap,
  Plus,
  Trash2,
  Play,
  Check,
  X,
  ChevronDown,
  Edit2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadWebhooks,
  saveWebhooks,
  triggerWebhook,
  DEFAULT_PAYLOAD,
  type WebhookConfig,
  type HttpMethod,
} from "@/lib/webhooks";

// ─── Built-in tools (static) ──────────────────────────────────────────────────
const BUILTIN_TOOLS = [
  {
    icon: Mail,
    name: "SMTP / Email",
    desc: "ส่งและรับอีเมลผ่าน SMTP/IMAP",
    config: "smtp.example.com:587",
    enabled: true,
  },
  {
    icon: Calendar,
    name: "Google Calendar",
    desc: "ดู/สร้าง/แก้ไข event ในปฏิทิน",
    config: "OAuth 2.0 Connected",
    enabled: true,
  },
  {
    icon: Search,
    name: "Web Search",
    desc: "ค้นหาข้อมูลบนอินเทอร์เน็ต",
    config: "Brave Search API",
    enabled: true,
  },
  {
    icon: FileText,
    name: "Google Drive",
    desc: "อ่าน/เขียน/อัปโหลดไฟล์ใน Drive",
    config: "ยังไม่ได้ตั้งค่า",
    enabled: false,
  },
  {
    icon: MessageSquare,
    name: "Telegram Bot",
    desc: "รับคำสั่งและส่งผลลัพธ์กลับ Telegram",
    config: "Bot: @HermesAgentBot",
    enabled: true,
  },
  {
    icon: Globe,
    name: "HTTP Client",
    desc: "เรียก external API ใดก็ได้",
    config: "Unlimited",
    enabled: true,
  },
  {
    icon: Database,
    name: "PostgreSQL",
    desc: "เชื่อมต่อและ query ฐานข้อมูล",
    config: "ยังไม่ได้ตั้งค่า",
    enabled: false,
  },
  {
    icon: GitBranch,
    name: "GitHub",
    desc: "อ่าน repo สร้าง PR และ comment",
    config: "ยังไม่ได้ตั้งค่า",
    enabled: false,
  },
];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-blue-500/10 text-blue-400",
  POST: "bg-green-500/10 text-green-400",
  PUT: "bg-yellow-500/10 text-yellow-400",
  PATCH: "bg-orange-500/10 text-orange-400",
};

// ─── Webhook form (add / edit) ────────────────────────────────────────────────
function WebhookForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<WebhookConfig>;
  onSave: (
    data: Omit<WebhookConfig, "id" | "createdAt" | "lastTriggeredAt" | "lastStatus" | "lastOk">,
  ) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [method, setMethod] = useState<HttpMethod>(initial?.method ?? "POST");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [payload, setPayload] = useState(initial?.payloadTemplate ?? DEFAULT_PAYLOAD);
  const [showPayload, setShowPayload] = useState(false);

  const valid = name.trim() && url.trim();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="text-sm font-bold text-foreground">
          {initial?.name ? "แก้ไข Webhook" : "เพิ่ม Webhook ใหม่"}
        </div>

        {/* Name + Method */}
        <div className="grid grid-cols-3 gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อ เช่น n8n-price-check"
            className="col-span-2 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
          >
            {(["GET", "POST", "PUT", "PATCH"] as HttpMethod[]).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* URL */}
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-n8n.com/webhook/xxx  หรือ  http://localhost:5678/webhook/xxx"
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Description */}
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="คำอธิบาย เช่น ดึงราคา hardware component ล่าสุด"
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Payload template toggle */}
        <button
          onClick={() => setShowPayload(!showPayload)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showPayload ? "rotate-180" : ""}`}
          />
          Payload Template {showPayload ? "ซ่อน" : "ขยาย"}
          <span className="text-muted-foreground/50">
            — ใช้ {"{{prompt}}"} และ {"{{timestamp}}"}
          </span>
        </button>
        <AnimatePresence>
          {showPayload && (
            <motion.textarea
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" /> ยกเลิก
          </button>
          <button
            onClick={() =>
              valid &&
              onSave({
                name: name.trim(),
                url: url.trim(),
                method,
                description: desc.trim(),
                payloadTemplate: payload,
                enabled: true,
              })
            }
            disabled={!valid}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> บันทึก
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Webhook card ─────────────────────────────────────────────────────────────
function WebhookCard({
  webhook,
  onToggle,
  onEdit,
  onDelete,
  onTest,
}: {
  webhook: WebhookConfig;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => Promise<void>;
}) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await onTest();
    setTesting(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`rounded-2xl border bg-card px-4 py-3 transition-all ${
        webhook.enabled ? "border-border" : "border-border/40 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            webhook.enabled ? "bg-primary/10" : "bg-muted"
          }`}
        >
          <Zap
            className={`w-5 h-5 ${webhook.enabled ? "text-primary" : "text-muted-foreground"}`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{webhook.name}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${METHOD_COLORS[webhook.method]}`}
            >
              {webhook.method}
            </span>
            {webhook.lastStatus !== undefined && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  webhook.lastOk
                    ? "bg-status-success/10 text-status-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {webhook.lastStatus === 0 ? "timeout" : `HTTP ${webhook.lastStatus}`}
              </span>
            )}
          </div>
          {webhook.description && (
            <div className="text-xs text-muted-foreground mt-0.5">{webhook.description}</div>
          )}
          <div className="text-[10px] font-mono text-muted-foreground/60 mt-0.5 truncate">
            {webhook.url}
          </div>
          {webhook.lastTriggeredAt && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              triggered {new Date(webhook.lastTriggeredAt).toLocaleString("th-TH")}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleTest}
            disabled={testing || !webhook.enabled}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 transition-colors font-semibold"
            title="ทดสอบ webhook"
          >
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Test
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {/* Toggle */}
          <button
            onClick={onToggle}
            className={`relative w-9 h-5 rounded-full transition-colors ml-1 ${
              webhook.enabled ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                webhook.enabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ToolsPage() {
  const [builtinStates, setBuiltinStates] = useState<Record<string, boolean>>(
    Object.fromEntries(BUILTIN_TOOLS.map((t) => [t.name, t.enabled])),
  );
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(loadWebhooks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    saveWebhooks(webhooks);
  }, [webhooks]);

  const toggleBuiltin = (name: string) => setBuiltinStates((s) => ({ ...s, [name]: !s[name] }));

  const addWebhook = (
    data: Omit<WebhookConfig, "id" | "createdAt" | "lastTriggeredAt" | "lastStatus" | "lastOk">,
  ) => {
    const wh: WebhookConfig = { ...data, id: crypto.randomUUID(), createdAt: Date.now() };
    setWebhooks((prev) => [wh, ...prev]);
    setShowAddForm(false);
    toast.success(`เพิ่ม webhook "${data.name}" แล้ว`);
  };

  const updateWebhook = (
    id: string,
    data: Omit<WebhookConfig, "id" | "createdAt" | "lastTriggeredAt" | "lastStatus" | "lastOk">,
  ) => {
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
    setEditingId(null);
    toast.success("อัพเดต webhook แล้ว");
  };

  const deleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast.success("ลบ webhook แล้ว");
  };

  const toggleWebhook = (id: string) =>
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)));

  const testWebhook = async (wh: WebhookConfig) => {
    toast.info(`กำลังทดสอบ ${wh.name}…`);
    const result = await triggerWebhook(wh, "test from Virtual Office Buddy");
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === wh.id
          ? { ...w, lastTriggeredAt: Date.now(), lastStatus: result.status, lastOk: result.ok }
          : w,
      ),
    );
    if (result.ok) {
      toast.success(`${wh.name}: HTTP ${result.status} (${result.durationMs}ms)`);
    } else {
      toast.error(`${wh.name}: ${result.status === 0 ? result.body : `HTTP ${result.status}`}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-3xl mx-auto">
      {/* Built-in tools */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-primary" />
            Tools
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            เครื่องมือและการเชื่อมต่อที่ Hermes ใช้ทำงาน
          </p>
        </div>

        <div className="space-y-2">
          {BUILTIN_TOOLS.map(({ icon: Icon, name, desc, config }, i) => {
            const on = builtinStates[name];
            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 rounded-2xl bg-card border border-border px-4 py-3"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${on ? "bg-primary/10" : "bg-muted"}`}
                >
                  <Icon className={`w-5 h-5 ${on ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground">{name}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                  <div
                    className={`text-[10px] mt-0.5 font-mono ${on ? "text-status-success" : "text-muted-foreground/50"}`}
                  >
                    {config}
                  </div>
                </div>
                <button
                  onClick={() => toggleBuiltin(name)}
                  className={`relative w-10 rounded-full transition-colors shrink-0`}
                  style={{
                    height: "22px",
                    background: on ? "var(--color-primary)" : "rgba(107,114,128,0.3)",
                  }}
                >
                  <span
                    className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                    style={{ width: "18px", height: "18px", left: on ? "20px" : "2px" }}
                  />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Workflow Automation */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Workflow Automation
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              ผูก Hermes กับ n8n, Zapier, Make หรือ webhook ใดก็ได้ — สั่งผ่าน{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">/trigger &lt;name&gt;</code> ใน
              Chat
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> เพิ่ม Webhook
          </button>
        </div>

        {/* n8n quick-start hint */}
        {webhooks.length === 0 && !showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-dashed border-border p-5 text-center space-y-2"
          >
            <Zap className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <div className="text-sm font-semibold text-muted-foreground">ยังไม่มี Webhook</div>
            <div className="text-xs text-muted-foreground/70 leading-relaxed max-w-sm mx-auto">
              เพิ่ม webhook endpoint ของ n8n, Zapier, หรือ Make แล้วสั่งทริกเกอร์ได้จาก Chat
              ด้วยคำสั่ง <code className="bg-muted px-1 rounded">/trigger ชื่อ</code>
            </div>
            <div className="text-xs text-muted-foreground/50">
              💡 n8n: Trigger node → "Webhook" → copy URL มาวางได้เลย
            </div>
          </motion.div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <WebhookForm onSave={addWebhook} onCancel={() => setShowAddForm(false)} />
          )}
        </AnimatePresence>

        {/* Webhook list */}
        <div className="space-y-2">
          <AnimatePresence>
            {webhooks.map((wh) =>
              editingId === wh.id ? (
                <motion.div
                  key={wh.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <WebhookForm
                    initial={wh}
                    onSave={(data) => updateWebhook(wh.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </motion.div>
              ) : (
                <WebhookCard
                  key={wh.id}
                  webhook={wh}
                  onToggle={() => toggleWebhook(wh.id)}
                  onEdit={() => {
                    setEditingId(wh.id);
                    setShowAddForm(false);
                  }}
                  onDelete={() => deleteWebhook(wh.id)}
                  onTest={() => testWebhook(wh)}
                />
              ),
            )}
          </AnimatePresence>
        </div>

        {/* Usage hint */}
        {webhooks.length > 0 && (
          <div className="rounded-xl bg-muted/30 border border-border px-4 py-3 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-primary" /> วิธีใช้ใน Chat
            </div>
            <div>
              พิมพ์ <code className="bg-muted px-1 rounded">/trigger {webhooks[0]?.name}</code>{" "}
              เพื่อทริกเกอร์ webhook นี้
            </div>
            <div>
              หรือ{" "}
              <code className="bg-muted px-1 rounded">
                /trigger {webhooks[0]?.name} ดึงราคา RTX 4090
              </code>{" "}
              เพื่อส่ง prompt ไปด้วย
            </div>
            <div className="text-muted-foreground/60 pt-0.5">
              ⚠️ Webhook ต้องอนุญาต CORS จาก browser หรือรันบน localhost ถึงจะทำงานได้
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
