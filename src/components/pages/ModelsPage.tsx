import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Plus, Trash2, Check, Star, Save, X, RefreshCw, Cloud } from "lucide-react";
import { toast } from "sonner";
import { useHermesService } from "@/lib/hermes-context";

interface ModelConfig {
  id: string;
  name: string;
  provider: "openrouter" | "openai" | "anthropic" | "ollama" | "custom";
  modelId: string;
  baseUrl: string;
  apiKey: string;
  isDefault: boolean;
}

const PROVIDERS = [
  {
    id: "openrouter",
    label: "OpenRouter",
    url: "https://openrouter.ai/api/v1",
    placeholder: "nousresearch/hermes-3-llama-3.1-405b:free",
    color: "#7c3aed",
  },
  { id: "openai", label: "OpenAI", url: "https://api.openai.com/v1", placeholder: "gpt-4o", color: "#10a37f" },
  {
    id: "anthropic",
    label: "Anthropic",
    url: "https://api.anthropic.com",
    placeholder: "claude-sonnet-4-6",
    color: "#d97706",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    url: "http://localhost:11434/v1",
    placeholder: "nous-hermes2",
    color: "#0369a1",
  },
  { id: "custom", label: "Custom", url: "", placeholder: "your-model-id", color: "#6b7280" },
] as const;

const STORAGE_KEY = "hermes-models";

const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: "default-hermes",
    name: "Hermes 3 405B (Free)",
    provider: "openrouter",
    modelId: "nousresearch/hermes-3-llama-3.1-405b:free",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "",
    isDefault: true,
  },
  {
    id: "default-hermes-70b",
    name: "Hermes 3 70B (Free)",
    provider: "openrouter",
    modelId: "nousresearch/hermes-3-llama-3.1-70b:free",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "",
    isDefault: false,
  },
  {
    id: "default-claude",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    modelId: "claude-sonnet-4-6",
    baseUrl: "https://api.anthropic.com",
    apiKey: "",
    isDefault: false,
  },
];

function loadModels(): ModelConfig[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : DEFAULT_MODELS;
  } catch {
    return DEFAULT_MODELS;
  }
}

function saveModels(models: ModelConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

const emptyForm: Omit<ModelConfig, "id" | "isDefault"> = {
  name: "",
  provider: "openrouter",
  modelId: "",
  baseUrl: "https://openrouter.ai/api/v1",
  apiKey: "",
};

function providerInfo(id: string) {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[4];
}

function ProviderBadge({ provider }: { provider: string }) {
  const p = providerInfo(provider);
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
      style={{ background: p.color + "55", border: `1px solid ${p.color}88`, color: p.color }}
    >
      {p.label}
    </span>
  );
}

export function ModelsPage() {
  const { apiService, wsState } = useHermesService();
  const isApiConnected = wsState?.status === "connected" && !!apiService;

  const [models, setModels] = useState<ModelConfig[]>(loadModels);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [liveModels, setLiveModels] = useState<{ id: string; owned_by?: string }[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);

  useEffect(() => {
    saveModels(models);
  }, [models]);

  const fetchLiveModels = async () => {
    if (!apiService) return;
    setLoadingLive(true);
    try {
      const data = await apiService.fetchModels();
      setLiveModels(data);
    } catch {
      toast.error("โหลด models จาก Hermes ไม่ได้");
    } finally {
      setLoadingLive(false);
    }
  };

  useEffect(() => {
    if (isApiConnected) fetchLiveModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiConnected]);

  const selectedProvider = providerInfo(form.provider);

  const addModel = () => {
    if (!form.name.trim() || !form.modelId.trim()) {
      toast.error("กรุณากรอกชื่อและ Model ID");
      return;
    }
    const newModel: ModelConfig = {
      ...form,
      id: crypto.randomUUID(),
      isDefault: models.length === 0,
    };
    setModels((prev) => [...prev, newModel]);
    setForm({ ...emptyForm });
    setShowForm(false);
    toast.success(`เพิ่ม ${newModel.name} แล้ว`);
  };

  const deleteModel = (id: string) => {
    setModels((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (prev.find((m) => m.id === id)?.isDefault && next.length > 0) {
        next[0].isDefault = true;
      }
      return next;
    });
    toast.success("ลบ model แล้ว");
  };

  const setDefault = (id: string) => {
    setModels((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
    const name = models.find((m) => m.id === id)?.name;
    toast.success(`ตั้ง ${name} เป็น default แล้ว`);
  };

  const handleProviderChange = (pId: string) => {
    const p = providerInfo(pId);
    setForm((f) => ({
      ...f,
      provider: pId as ModelConfig["provider"],
      baseUrl: p.url,
      modelId: p.placeholder,
    }));
  };

  const defaultModel = models.find((m) => m.isDefault);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-primary" />
            Models
          </h1>
          <p className="text-sm text-muted-foreground mt-1">จัดการโมเดล AI ที่ Hermes ใช้งาน</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่ม Model
        </button>
      </div>

      {/* Live models from Hermes API */}
      {isApiConnected && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Cloud className="w-4 h-4 text-primary" />
              Models จาก Hermes Agent
            </div>
            <button onClick={fetchLiveModels} disabled={loadingLive} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? "animate-spin" : ""}`} />
            </button>
          </div>
          {liveModels.length === 0 ? (
            <p className="text-xs text-muted-foreground">{loadingLive ? "กำลังโหลด…" : "ไม่มี models"}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {liveModels.map((m) => (
                <span key={m.id} className="px-2.5 py-1 rounded-lg bg-muted text-xs font-mono text-foreground border border-border">
                  {m.id}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Active model */}
      {defaultModel && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3"
        >
          <Star className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-foreground">{defaultModel.name}</div>
            <div className="text-xs text-muted-foreground font-mono truncate">{defaultModel.modelId}</div>
          </div>
          <span className="text-xs text-primary font-semibold">Active</span>
        </motion.div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-card border border-primary/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground text-sm">เพิ่ม Model ใหม่</h2>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Provider selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provider</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.provider === p.id
                          ? "text-white border-transparent"
                          : "bg-background text-muted-foreground border-border hover:border-primary/40"
                      }`}
                      style={form.provider === p.id ? { background: p.color } : {}}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "name", label: "ชื่อ (แสดงใน UI)", placeholder: "Hermes 3 Free" },
                  { key: "modelId", label: "Model ID", placeholder: selectedProvider.placeholder },
                  { key: "baseUrl", label: "Base URL", placeholder: selectedProvider.url },
                  { key: "apiKey", label: "API Key (optional)", placeholder: "sk-or-..." },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {label}
                    </label>
                    <input
                      type={key === "apiKey" ? "password" : "text"}
                      value={(form as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-xs"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={addModel}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                บันทึก Model
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {models.map((model) => (
            <motion.div
              key={model.id}
              layout
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className={`rounded-xl border bg-card p-4 flex items-center gap-3 ${
                model.isDefault ? "border-primary/40" : "border-border"
              }`}
            >
              <button
                onClick={() => setDefault(model.id)}
                className={`shrink-0 transition-colors ${model.isDefault ? "text-primary" : "text-muted-foreground/30 hover:text-primary/60"}`}
                title="ตั้งเป็น default"
              >
                <Star className={`w-5 h-5 ${model.isDefault ? "fill-primary" : ""}`} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{model.name}</span>
                  <ProviderBadge provider={model.provider} />
                  {model.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{model.modelId}</div>
                <div className="text-xs text-muted-foreground/60 truncate">{model.baseUrl}</div>
              </div>
              <button
                onClick={() => deleteModel(model.id)}
                className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="ลบ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {models.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Cpu className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">ยังไม่มี model — กด "เพิ่ม Model" เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-2xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground space-y-1.5">
        <div className="font-semibold text-foreground text-sm mb-2">วิธีใช้งาน</div>
        <div>
          1. ตั้ง <code className="px-1 rounded bg-muted font-mono">OPENROUTER_API_KEY</code> ใน{" "}
          <code className="px-1 rounded bg-muted font-mono">.env</code>
        </div>
        <div>
          2. ตั้ง <code className="px-1 rounded bg-muted font-mono">HERMES_MODEL</code> ให้ตรงกับ Model ID ที่เลือก
        </div>
        <div>3. รัน bridge ใหม่ด้วย npm run telegram</div>
      </div>
    </div>
  );
}
