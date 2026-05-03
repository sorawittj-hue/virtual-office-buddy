import { useState, useEffect, useRef } from "react";
import {
  Settings,
  Moon,
  Sun,
  Bell,
  Globe,
  Trash2,
  Check,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Download,
  Upload,
  Network,
} from "lucide-react";
import { motion } from "framer-motion";
import { GUARDRAIL_RULES, loadGuardrailConfig, saveGuardrailConfig } from "@/lib/guardrails";
import { useHermesService } from "@/lib/hermes-context";
import type { ConnectionMode } from "@/lib/connection-mode";
import { toast } from "sonner";

// ─── Keys that are part of the exportable backup ─────────────────────────────
const BACKUP_KEYS = [
  "hermes-models",
  "hermes-skills-enabled",
  "hermes-memories",
  "hermes-guardrails-config",
  "prism-webhooks",
  "prism-connection-mode",
  "hermes-gateway-url",
  "hermes-gateway-apikey",
  "theme",
];

function exportSettings() {
  const data: Record<string, unknown> = { _version: 1, _exportedAt: new Date().toISOString() };
  BACKUP_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) {
      try {
        data[key] = JSON.parse(val);
      } catch {
        data[key] = val;
      }
    }
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prism-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported backup successfully");
}

function importSettings(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      let count = 0;
      BACKUP_KEYS.forEach((key) => {
        if (key in data) {
          localStorage.setItem(key, JSON.stringify(data[key]));
          count++;
        }
      });
      toast.success(`Imported ${count} settings — reload to apply`);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error("Invalid backup file");
    }
  };
  reader.readAsText(file);
}

// ─── Guardrails section ───────────────────────────────────────────────────────
function GuardrailsSection() {
  const [config, setConfig] = useState(loadGuardrailConfig);

  const toggle = (id: string) => {
    setConfig((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveGuardrailConfig(next);
      toast.success(next[id] ? `เปิด ${id} แล้ว` : `ปิด ${id} แล้ว`);
      return next;
    });
  };

  const enabledCount = Object.values(config).filter(Boolean).length;
  const totalCount = GUARDRAIL_RULES.length;

  const categories = ["input", "output", "cost"] as const;
  const catLabel: Record<string, string> = {
    input: "Input Guards",
    output: "Output Guards",
    cost: "Cost Controls",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl bg-card border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-status-success" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Guardrails
          </span>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            enabledCount === totalCount
              ? "bg-status-success/10 text-status-success"
              : enabledCount === 0
                ? "bg-destructive/10 text-destructive"
                : "bg-yellow-500/10 text-yellow-500"
          }`}
        >
          {enabledCount} / {totalCount} active
        </span>
      </div>

      {/* Description */}
      <div className="px-4 py-3 bg-muted/20 border-b border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Guardrails ตรวจสอบข้อความ <strong>ก่อนส่ง</strong> และ <strong>หลังรับ</strong> จาก AI —
          ป้องกัน prompt injection, PII leakage, harmful content และ cost overrun ทุกอย่างทำงานใน
          browser ไม่ส่งข้อมูลไปนอก
        </p>
      </div>

      {/* Rules by category */}
      {categories.map((cat) => {
        const rules = GUARDRAIL_RULES.filter((r) => r.category === cat);
        if (rules.length === 0) return null;
        return (
          <div key={cat}>
            <div className="px-4 py-2 border-b border-border bg-muted/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {catLabel[cat]}
              </span>
            </div>
            <div className="divide-y divide-border">
              {rules.map((rule) => {
                const isEnabled = config[rule.id] ?? rule.defaultEnabled;
                return (
                  <div key={rule.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="shrink-0">
                      {rule.severity === "block" ? (
                        <ShieldAlert
                          className={`w-4 h-4 ${isEnabled ? "text-destructive" : "text-muted-foreground/40"}`}
                        />
                      ) : (
                        <Shield
                          className={`w-4 h-4 ${isEnabled ? "text-yellow-500" : "text-muted-foreground/40"}`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{rule.name}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                            rule.severity === "block"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}
                        >
                          {rule.severity}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{rule.desc}</div>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => toggle(rule.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                        isEnabled ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          isEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { connectionMode, setConnectionMode } = useHermesService();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const selectConnectionMode = (mode: ConnectionMode) => {
    setConnectionMode(mode);
    toast.success(mode === "hermes" ? "Hermes Connected Mode enabled" : "Standalone Mode enabled");
  };

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const save = () => {
    localStorage.setItem("hermes-settings", JSON.stringify({ notifications }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    {
      title: "Connection",
      delay: 0,
      items: [
        {
          icon: Network,
          label: "Connection Mode",
          desc: "Choose direct OpenRouter chat or the local Hermes Agent at port 9119",
          control: (
            <div className="flex rounded-xl bg-muted/50 border border-border p-1 gap-1">
              {[
                ["standalone", "Standalone Mode"],
                ["hermes", "Hermes Connected"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => selectConnectionMode(mode as ConnectionMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    connectionMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ),
        },
      ],
    },
    {
      title: "Appearance",
      delay: 0.05,
      items: [
        {
          icon: dark ? Moon : Sun,
          label: "Dark Mode",
          desc: "สลับธีมระหว่างสว่างและมืด",
          control: (
            <button
              onClick={() => setDark((d) => !d)}
              className="relative w-10 rounded-full transition-colors"
              style={{
                height: "22px",
                background: dark ? "var(--color-primary)" : "var(--color-muted-foreground)" + "40",
              }}
            >
              <span
                className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                style={{ width: "18px", height: "18px", left: dark ? "20px" : "2px" }}
              />
            </button>
          ),
        },
      ],
    },
    {
      title: "Notifications",
      delay: 0.1,
      items: [
        {
          icon: Bell,
          label: "Toast Notifications",
          desc: "Show in-app toast when a task completes or errors",
          control: (
            <button
              onClick={() => setNotifications((n) => !n)}
              className="relative w-10 rounded-full transition-colors"
              style={{
                height: "22px",
                background: notifications
                  ? "var(--color-status-success)"
                  : "var(--color-muted-foreground)" + "40",
              }}
            >
              <span
                className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                style={{ width: "18px", height: "18px", left: notifications ? "20px" : "2px" }}
              />
            </button>
          ),
        },
        {
          icon: Bell,
          label: "Browser Notifications",
          desc: "Get a desktop notification even when the tab is in the background",
          control: (
            <button
              onClick={async () => {
                if (!("Notification" in window)) {
                  toast.error("Browser notifications not supported");
                  return;
                }
                const perm = await Notification.requestPermission();
                if (perm === "granted") {
                  localStorage.setItem("prism-browser-notifs", "1");
                  new Notification("Virtual Office Buddy", {
                    body: "Browser notifications enabled!",
                    icon: "/favicon.ico",
                  });
                  toast.success("Browser notifications enabled");
                } else {
                  localStorage.removeItem("prism-browser-notifs");
                  toast.error("Permission denied — allow in browser settings");
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 font-semibold text-foreground transition-colors"
            >
              {typeof window !== "undefined" && Notification.permission === "granted"
                ? "✓ Enabled"
                : "Enable"}
            </button>
          ),
        },
      ],
    },
    {
      title: "Language",
      delay: 0.15,
      items: [
        {
          icon: Globe,
          label: "ภาษา UI",
          desc: "ภาษาสำหรับ interface และข้อความ",
          control: (
            <select className="text-xs rounded-lg border border-border bg-background px-2 py-1 text-foreground focus:outline-none">
              <option value="th">ภาษาไทย</option>
              <option value="en">English</option>
            </select>
          ),
        },
      ],
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">ตั้งค่า Web App</p>
      </div>

      {sections.map(({ title, delay, items }) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay }}
          className="rounded-2xl bg-card border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
          </div>
          <div className="divide-y divide-border">
            {items.map(({ icon: Icon, label, desc, control }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3.5">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
                {control}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Guardrails section */}
      <GuardrailsSection />

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Settings"}
        </button>
        <button
          onClick={exportSettings}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Backup
        </button>
        <button
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import Backup
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importSettings(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => {
            if (!confirm("Reset ALL settings to default? This cannot be undone.")) return;
            BACKUP_KEYS.forEach((k) => localStorage.removeItem(k));
            toast.success("Settings reset — reloading…");
            setTimeout(() => window.location.reload(), 1200);
          }}
          className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>
    </div>
  );
}
