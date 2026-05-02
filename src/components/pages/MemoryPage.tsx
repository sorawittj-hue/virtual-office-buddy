import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Clock,
  Tag,
  Trash2,
  Plus,
  Edit2,
  Check,
  X,
  Search,
  Database,
  Cpu,
  Cloud,
  HardDrive,
} from "lucide-react";
import { useHermes } from "@/hooks/use-hermes";
import { useHermesService } from "@/lib/hermes-context";
import { hermesProxyApi, type HermesMemoryEntry } from "@/lib/hermes-proxy-api";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type MemoryCategory = "personal" | "preference" | "context" | "fact" | "instruction";

interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  category: MemoryCategory;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "hermes-memories";

const CATEGORY_META: Record<MemoryCategory, { label: string; color: string; emoji: string }> = {
  personal: { label: "Personal", color: "bg-purple-500/10 text-purple-500", emoji: "👤" },
  preference: { label: "Preference", color: "bg-blue-500/10 text-blue-500", emoji: "⚙️" },
  context: { label: "Context", color: "bg-green-500/10 text-green-500", emoji: "🌐" },
  fact: { label: "Fact", color: "bg-orange-500/10 text-orange-500", emoji: "📌" },
  instruction: { label: "Instruction", color: "bg-red-500/10 text-red-500", emoji: "📋" },
};

const MEMORY_PROVIDERS = [
  {
    id: "local",
    label: "Local (localStorage)",
    icon: HardDrive,
    active: true,
    desc: "เก็บใน browser ของคุณ ไม่มีค่าใช้จ่าย",
  },
  {
    id: "mem0",
    label: "Mem0",
    icon: Cloud,
    active: false,
    desc: "Semantic memory cloud — mem0.ai",
  },
  {
    id: "honcho",
    label: "Honcho",
    icon: Database,
    active: false,
    desc: "User-level personalization layer",
  },
  {
    id: "local-embed",
    label: "Local Embeddings",
    icon: Cpu,
    active: false,
    desc: "Vector search ด้วย embeddings ในเครื่อง",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadMemories(): MemoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MEMORIES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MEMORIES;
  }
}

function saveMemories(entries: MemoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

const DEFAULT_MEMORIES: MemoryEntry[] = [
  {
    id: "m1",
    key: "ภาษาที่ใช้",
    value: "ไทย (th)",
    category: "preference",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "m2",
    key: "ช่องทางรับคำสั่ง",
    value: "Telegram Bot",
    category: "context",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "m3",
    key: "ผู้ใช้งานหลัก",
    value: "เจ้านาย",
    category: "personal",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// ─── Edit row component ───────────────────────────────────────────────────────
function EditRow({
  entry,
  onSave,
  onCancel,
}: {
  entry: Partial<MemoryEntry>;
  onSave: (key: string, value: string, category: MemoryCategory) => void;
  onCancel: () => void;
}) {
  const [key, setKey] = useState(entry.key ?? "");
  const [value, setValue] = useState(entry.value ?? "");
  const [category, setCategory] = useState<MemoryCategory>(entry.category ?? "fact");

  return (
    <div className="px-4 py-3 bg-muted/40 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          autoFocus
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="ชื่อ key เช่น ชื่อผู้ใช้"
          className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as MemoryCategory)}
          className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {(Object.keys(CATEGORY_META) as MemoryCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ค่า เช่น John Doe"
        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-3.5 h-3.5" /> ยกเลิก
        </button>
        <button
          onClick={() => {
            if (key.trim() && value.trim()) onSave(key.trim(), value.trim(), category);
          }}
          disabled={!key.trim() || !value.trim()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> บันทึก
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MemoryPage() {
  const { connectionMode } = useHermesService();
  const { log } = useHermes();
  const [memories, setMemories] = useState<MemoryEntry[]>(loadMemories);
  const [hermesMemories, setHermesMemories] = useState<HermesMemoryEntry[]>([]);
  const [loadingHermesMemory, setLoadingHermesMemory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCat, setFilterCat] = useState<MemoryCategory | "all">("all");
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState("local");

  useEffect(() => {
    saveMemories(memories);
  }, [memories]);

  useEffect(() => {
    if (connectionMode !== "hermes") return;
    let cancelled = false;
    setLoadingHermesMemory(true);
    hermesProxyApi
      .memory()
      .then((items) => {
        if (!cancelled) setHermesMemories(items);
      })
      .catch(() => {
        if (!cancelled) setHermesMemories([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHermesMemory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [connectionMode]);

  const filtered = memories.filter((m) => {
    const matchSearch =
      !searchQuery.trim() ||
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCat === "all" || m.category === filterCat;
    return matchSearch && matchCat;
  });

  const addMemory = (key: string, value: string, category: MemoryCategory) => {
    const entry: MemoryEntry = {
      id: crypto.randomUUID(),
      key,
      value,
      category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setMemories((prev) => [entry, ...prev]);
    setAddingNew(false);
    toast.success("เพิ่ม memory แล้ว");
  };

  const updateMemory = (id: string, key: string, value: string, category: MemoryCategory) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, key, value, category, updatedAt: Date.now() } : m)),
    );
    setEditingId(null);
    toast.success("อัพเดต memory แล้ว");
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    toast.success("ลบ memory แล้ว");
  };

  const clearAll = () => {
    if (confirm("ล้าง memory ทั้งหมดใช่ไหม?")) {
      setMemories([]);
      toast.success("ล้าง memory ทั้งหมดแล้ว");
    }
  };

  if (connectionMode === "standalone") {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Brain className="w-6 h-6 text-primary" />
            Memory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Connect to Hermes Agent to see data</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">Connect to Hermes Agent to see data</p>
        </div>
      </div>
    );
  }

  if (connectionMode === "hermes") {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Brain className="w-6 h-6 text-primary" />
            Memory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real memory from Hermes Agent ({hermesMemories.length} entries)
          </p>
        </div>
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-foreground">Hermes Memory</span>
          </div>
          {loadingHermesMemory ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading Hermes memory...
            </div>
          ) : hermesMemories.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground italic">
              No Hermes memory entries found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {hermesMemories.map((entry, index) => (
                <div key={entry.id ?? index} className="px-4 py-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {entry.key ?? entry.category ?? "Memory"}
                  </div>
                  <div className="text-sm text-foreground mt-0.5">
                    {entry.value ?? entry.content ?? JSON.stringify(entry)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Brain className="w-6 h-6 text-primary" />
            Memory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            บริบทและความทรงจำที่ Hermes ใช้ในการทำงาน — {memories.length} entries
          </p>
        </div>
        <button
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> เพิ่ม Memory
        </button>
      </div>

      {/* Memory Providers */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-foreground">Memory Provider</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3">
          {MEMORY_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProvider(p.id);
                if (!p.active) toast.info(`${p.label} — coming soon`);
              }}
              className={`rounded-xl border p-3 text-left transition-all ${
                activeProvider === p.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              } ${!p.active ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <p.icon
                  className={`w-4 h-4 ${activeProvider === p.id ? "text-primary" : "text-muted-foreground"}`}
                />
                {activeProvider === p.id && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-foreground">{p.label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา memory…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", ...Object.keys(CATEGORY_META)] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat as MemoryCategory | "all")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterCat === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all"
                ? "ทั้งหมด"
                : `${CATEGORY_META[cat as MemoryCategory].emoji} ${CATEGORY_META[cat as MemoryCategory].label}`}
            </button>
          ))}
        </div>
      </div>

      {/* Memory list */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl bg-card border border-border overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-foreground">Stored Memories</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} / {memories.length}
          </span>
        </div>

        {/* Add new form */}
        <AnimatePresence>
          {addingNew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <EditRow entry={{}} onSave={addMemory} onCancel={() => setAddingNew(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground italic">
            {searchQuery
              ? "ไม่พบ memory ที่ค้นหา"
              : "ยังไม่มี memory — กด 'เพิ่ม Memory' เพื่อเริ่ม"}
          </div>
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence>
              {filtered.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {editingId === entry.id ? (
                    <EditRow
                      entry={entry}
                      onSave={(k, v, c) => updateMemory(entry.id, k, v, c)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 transition-colors">
                      <span className="text-base shrink-0">
                        {CATEGORY_META[entry.category].emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                          {entry.key}
                        </div>
                        <div className="text-sm text-foreground mt-0.5 truncate">{entry.value}</div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${CATEGORY_META[entry.category].color}`}
                      >
                        {CATEGORY_META[entry.category].label}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingId(entry.id)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMemory(entry.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Recent commands */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card border border-border overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-foreground">คำสั่งล่าสุด</span>
        </div>
        {log.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground italic">
            ยังไม่มีคำสั่ง
          </div>
        ) : (
          <div className="divide-y divide-border">
            {log.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-foreground truncate flex-1 mr-3">
                  {entry.command}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    entry.status === "success"
                      ? "bg-status-success/10 text-status-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {entry.status === "success" ? "สำเร็จ" : "Error"}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Danger zone */}
      {memories.length > 0 && (
        <button
          onClick={clearAll}
          className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          ล้าง Memory ทั้งหมด
        </button>
      )}
    </div>
  );
}
