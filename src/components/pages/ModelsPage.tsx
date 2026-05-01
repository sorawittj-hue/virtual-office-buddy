import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Plus, Trash2, Star, Save, X, RefreshCw, Cloud, Zap, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useHermesService } from "@/lib/hermes-context";
import { testProviderConnection } from "@/lib/hermes-api-service";
import { PROVIDERS, MODEL_PRESETS, CATEGORY_INFO, providerInfo, type ProviderId, type ModelCategory } from "@/lib/providers";

interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderId;
  modelId: string;
  baseUrl: string;
  apiKey: string;
  isDefault: boolean;
  category?: ModelCategory;
  lastTested?: { ok: boolean; latency: number; at: number };
}

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
    category: "free",
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
  category: "chat",
};

function ProviderBadge({ provider }: { provider: string }) {
  const p = providerInfo(provider);
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: p.color + "20", border: `1px solid ${p.color}50`, color: p.color }}
    >
      {p.label}
    </span>
  );
}

function CategoryBadge({ category }: { category?: ModelCategory }) {
  if (!category) return null;
  const info = CATEGORY_INFO[category];
  return (
    <span
      className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: info.color + "20", color: info.color }}
    >
      {info.emoji} {info.label}
    </span>
  );
}

export function ModelsPage() {
  const { apiService, wsState } = useHermesService();
  const isApiConnected = wsState?.status === "connected" && !!apiService;

  const [models, setModels] = useState<ModelConfig[]>(loadModels);
  const [showForm, setShowForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [liveModels, setLiveModels] = useState<{ id: string }[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<ModelCategory | "all">("all");

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

  const addFromPreset = (presetIndex: number) => {
    const p = MODEL_PRESETS[presetIndex];
    const newModel: ModelConfig = {
      id: crypto.randomUUID(),
      name: p.name,
      provider: p.provider,
      modelId: p.modelId,
      baseUrl: p.baseUrl,
      apiKey: "",
      isDefault: models.length === 0,
      category: p.category,
    };
    setModels((prev) => [...prev, newModel]);
    toast.success(`เพิ่ม ${p.name} แล้ว — กรอก API key ด้วยนะ`);
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
      provider: pId as ProviderId,
      baseUrl: p.url,
      modelId: p.placeholder,
    }));
  };

  const testModel = async (model: ModelConfig) => {
    setTestingId(model.id);
    try {
      const result = await testProviderConnection(model.baseUrl, model.apiKey || undefined, model.modelId);
      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id ? { ...m, lastTested: { ok: result.ok, latency: result.latency, at: Date.now() } } : m,
        ),
      );
      if (result.ok) {
        toast.success(`✓ ${model.name} — ${result.latency}ms`);
      } else {
        toast.error(`${model.name} — ${result.error ?? "ไม่ตอบสนอง"}`);
      }
    } finally {
      setTestingId(null);
    }
  };

  const updateApiKey = (id: string, apiKey: string) => {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, apiKey } : m)));
  };

  const filtered = filterCategory === "all" ? models : models.filter((m) => m.category === filterCategory);
  const defaultModel = models.find((m) => m.isDefault);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-primary" />
            Models
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            จัดการ AI models — รองรับ {PROVIDERS.length - 1} providers
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPresets((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Quick Presets
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่ม Model
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Quick Presets — กดเพื่อเพิ่มเลย
                </div>
                <button onClick={() => setShowPresets(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {MODEL_PRESETS.map((p, i) => (
                  <button
                    key={p.modelId}
                    onClick={() => addFromPreset(i)}
                    className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors text-left"
                  >
                    <div className="text-2xl shrink-0">{p.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{p.name}</span>
                        <CategoryBadge category={p.category} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                      <code className="text-[10px] font-mono text-muted-foreground/70 truncate block mt-1">{p.modelId}</code>
                    </div>
                    <Plus className="w-4 h-4 text-primary shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Hermes models */}
      {isApiConnected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Cloud className="w-4 h-4 text-primary" />
              Models พร้อมใช้ใน Hermes ({liveModels.length})
            </div>
            <button onClick={fetchLiveModels} disabled={loadingLive} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? "animate-spin" : ""}`} />
            </button>
          </div>
          {liveModels.length === 0 ? (
            <p className="text-xs text-muted-foreground">{loadingLive ? "กำลังโหลด…" : "ไม่มี models"}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {liveModels.slice(0, 30).map((m) => (
                <span key={m.id} className="px-2 py-0.5 rounded-md bg-background border border-border text-[11px] font-mono text-foreground/80">
                  {m.id}
                </span>
              ))}
              {liveModels.length > 30 && (
                <span className="px-2 py-0.5 text-[11px] text-muted-foreground">+{liveModels.length - 30} อื่นๆ</span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Active model */}
      {defaultModel && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-primary/30 p-4 flex items-center gap-3"
        >
          <Star className="w-5 h-5 text-primary fill-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold text-foreground">{defaultModel.name}</div>
              <ProviderBadge provider={defaultModel.provider} />
              <CategoryBadge category={defaultModel.category} />
            </div>
            <div className="text-xs text-muted-foreground font-mono truncate">{defaultModel.modelId}</div>
          </div>
          <span className="text-xs text-primary font-semibold">Active</span>
        </motion.div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filterCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          ทั้งหมด ({models.length})
        </button>
        {(Object.keys(CATEGORY_INFO) as ModelCategory[]).map((cat) => {
          const count = models.filter((m) => m.category === cat).length;
          if (count === 0) return null;
          const info = CATEGORY_INFO[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterCategory === cat ? "text-white" : "bg-muted text-muted-foreground border border-border"
              }`}
              style={filterCategory === cat ? { background: info.color } : {}}
            >
              {info.emoji} {info.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl bg-card border border-primary/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground text-sm">เพิ่ม Model ใหม่</h2>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provider</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.provider === p.id ? "text-white border-transparent" : "bg-background text-muted-foreground border-border hover:border-primary/40"
                      }`}
                      style={form.provider === p.id ? { background: p.color } : {}}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(CATEGORY_INFO) as ModelCategory[]).map((cat) => {
                    const info = CATEGORY_INFO[cat];
                    const active = form.category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setForm((f) => ({ ...f, category: cat }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          active ? "text-white" : "bg-muted text-muted-foreground border border-border"
                        }`}
                        style={active ? { background: info.color } : {}}
                      >
                        {info.emoji} {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "name", label: "ชื่อ (แสดงใน UI)", placeholder: "Hermes 3 Free" },
                  { key: "modelId", label: "Model ID", placeholder: selectedProvider.placeholder },
                  { key: "baseUrl", label: "Base URL", placeholder: selectedProvider.url },
                  { key: "apiKey", label: "API Key", placeholder: selectedProvider.apiKeyPattern || "optional" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
                    <input
                      type={key === "apiKey" ? "password" : "text"}
                      value={(form as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
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
          {filtered.map((model) => {
            const isTesting = testingId === model.id;
            const test = model.lastTested;
            return (
              <motion.div
                key={model.id}
                layout
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className={`rounded-xl border bg-card p-4 ${model.isDefault ? "border-primary/40" : "border-border"}`}
              >
                <div className="flex items-center gap-3">
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
                      <CategoryBadge category={model.category} />
                      {model.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                          Active
                        </span>
                      )}
                      {test && !isTesting && (
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            test.ok ? "bg-status-success/15 text-status-success" : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {test.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {test.ok ? `${test.latency}ms` : "fail"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{model.modelId}</div>
                    <div className="text-xs text-muted-foreground/60 truncate">{model.baseUrl}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => testModel(model)}
                      disabled={isTesting}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                      title="ทดสอบเชื่อมต่อ"
                    >
                      {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteModel(model.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {!model.apiKey && providerInfo(model.provider).needsKey && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <input
                      type="password"
                      placeholder={`API Key (${providerInfo(model.provider).apiKeyPattern || "..."})`}
                      onChange={(e) => updateApiKey(model.id, e.target.value)}
                      className="w-full rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-1.5 text-xs text-foreground placeholder:text-yellow-600/60 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 font-mono"
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Cpu className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">ยังไม่มี model — กด "Quick Presets" หรือ "เพิ่ม Model"</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground space-y-1.5">
        <div className="font-semibold text-foreground text-sm mb-2">วิธีใช้งาน</div>
        <div>1. กด <strong>Quick Presets</strong> หรือ <strong>เพิ่ม Model</strong> เพื่อเลือก provider</div>
        <div>2. กรอก <code className="px-1 rounded bg-muted font-mono">API Key</code> (ถ้าจำเป็น) แล้วกด ⚡ เพื่อทดสอบ</div>
        <div>3. กด ⭐ เพื่อตั้งเป็น default — Hermes จะใช้ตัวนี้</div>
        <div>4. ตั้งค่าใน <code className="px-1 rounded bg-muted font-mono">.env</code> ของ Hermes ตามที่เลือก</div>
      </div>
    </div>
  );
}
