import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Plus, Trash2, Save, X, Play, Info, RefreshCw, Cloud, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { useHermesService } from "@/lib/hermes-context";
import type { HermesJobConfig } from "@/lib/hermes-api-service";

interface LocalJob {
  id: string;
  name: string;
  cron: string;
  command: string;
  enabled: boolean;
  createdAt: number;
  lastRun?: number;
}

const LOCAL_KEY = "hermes-schedules";

const PRESETS = [
  { label: "ทุกวัน 8 โมงเช้า", cron: "0 8 * * *" },
  { label: "ทุกจันทร์ 9 โมง", cron: "0 9 * * 1" },
  { label: "ทุกชั่วโมง", cron: "0 * * * *" },
  { label: "ทุก 30 นาที", cron: "*/30 * * * *" },
  { label: "วันจันทร์-ศุกร์ 8 โมง", cron: "0 8 * * 1-5" },
];

const QUICK_COMMANDS = ["สรุปข่าว", "ตรวจสอบงาน", "สร้างรายงาน", "ค้นหาข้อมูล", "ส่งอีเมล"];

function parseCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "รูปแบบไม่ถูกต้อง";
  const [min, hour, , , dow] = parts;
  if (expr === "* * * * *") return "ทุกนาที";
  if (min === "0" && hour !== "*" && dow === "*") return `ทุกวัน เวลา ${hour.padStart(2, "0")}:00 น.`;
  if (min.startsWith("*/")) return `ทุก ${min.slice(2)} นาที`;
  if (hour === "*" && min === "0") return "ทุกชั่วโมง";
  return expr;
}

function loadLocal(): LocalJob[] {
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveLocal(jobs: LocalJob[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(jobs));
}

export function SchedulesPage() {
  const { apiService, wsState } = useHermesService();
  const isApiConnected = wsState?.status === "connected" && !!apiService;

  const [localJobs, setLocalJobs] = useState<LocalJob[]>(loadLocal);
  const [apiJobs, setApiJobs] = useState<HermesJobConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", cron: "0 8 * * *", command: "" });
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    saveLocal(localJobs);
  }, [localJobs]);

  const fetchApiJobs = async () => {
    if (!apiService) return;
    setLoading(true);
    try {
      const jobs = await apiService.fetchJobs();
      setApiJobs(Array.isArray(jobs) ? jobs : []);
    } catch {
      toast.error("โหลด jobs จาก Hermes ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isApiConnected) fetchApiJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiConnected]);

  const addJob = async () => {
    if (!form.name.trim() || !form.cron.trim() || !form.command.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    if (isApiConnected) {
      try {
        const created = await apiService!.createJob({
          name: form.name,
          schedule: form.cron,
          prompt: form.command,
          enabled: true,
        });
        setApiJobs((prev) => [created, ...prev]);
        toast.success(`เพิ่ม "${form.name}" ใน Hermes แล้ว`);
      } catch {
        toast.error("เพิ่ม job ไม่ได้");
        return;
      }
    } else {
      const job: LocalJob = {
        id: crypto.randomUUID(),
        name: form.name,
        cron: form.cron,
        command: form.command,
        enabled: true,
        createdAt: Date.now(),
      };
      setLocalJobs((prev) => [job, ...prev]);
      toast.success(`เพิ่ม "${form.name}" แล้ว`);
    }

    setForm({ name: "", cron: "0 8 * * *", command: "" });
    setShowForm(false);
  };

  const toggleApiJob = async (job: HermesJobConfig) => {
    try {
      const updated = await apiService!.updateJob(job.id!, { enabled: !job.enabled });
      setApiJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
    } catch {
      toast.error("อัพเดท job ไม่ได้");
    }
  };

  const deleteApiJob = async (id: string) => {
    try {
      await apiService!.deleteJob(id);
      setApiJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success("ลบ job แล้ว");
    } catch {
      toast.error("ลบ job ไม่ได้");
    }
  };

  const runApiJob = async (id: string, name: string) => {
    try {
      await apiService!.runJob(id);
      toast.success(`รัน "${name}" ทันที`);
    } catch {
      toast.error("รัน job ไม่ได้");
    }
  };

  const toggleLocalJob = (id: string) => {
    setLocalJobs((prev) => prev.map((j) => (j.id === id ? { ...j, enabled: !j.enabled } : j)));
  };

  const deleteLocalJob = (id: string) => {
    const name = localJobs.find((j) => j.id === id)?.name;
    setLocalJobs((prev) => prev.filter((j) => j.id !== id));
    toast.success(`ลบ "${name}" แล้ว`);
  };

  const runLocalJob = (job: LocalJob) => {
    setLocalJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, lastRun: Date.now() } : j)));
    toast.success(`จำลองรัน "${job.command}"`);
  };

  const enabledCount = isApiConnected
    ? apiJobs.filter((j) => j.enabled).length
    : localJobs.filter((j) => j.enabled).length;
  const totalCount = isApiConnected ? apiJobs.length : localJobs.length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-primary" />
            Schedules
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            {isApiConnected ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-status-success" />
                <span className="text-status-success font-medium">Hermes Live</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5" />
                Local Only
              </>
            )}
            · {enabledCount}/{totalCount} งานเปิดอยู่
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isApiConnected && (
            <button
              onClick={fetchApiJobs}
              disabled={loading}
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors"
              title="รีเฟรช"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มงาน
          </button>
        </div>
      </div>

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
                <h2 className="font-bold text-sm text-foreground">เพิ่มงานตั้งเวลา</h2>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ชื่องาน</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="สรุปข่าวเช้า"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cron Expression</label>
                  <button onClick={() => setShowPresets((v) => !v)} className="text-xs text-primary hover:underline">
                    เทมเพลต {showPresets ? "▲" : "▼"}
                  </button>
                </div>
                <AnimatePresence>
                  {showPresets && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {PRESETS.map((p) => (
                          <button
                            key={p.cron}
                            onClick={() => { setForm((f) => ({ ...f, cron: p.cron })); setShowPresets(false); }}
                            className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground hover:text-foreground border border-border transition-colors"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input
                  type="text"
                  value={form.cron}
                  onChange={(e) => setForm((f) => ({ ...f, cron: e.target.value }))}
                  placeholder="0 8 * * *"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.cron && <p className="text-xs text-primary">→ {parseCron(form.cron)}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isApiConnected ? "Prompt" : "คำสั่ง"}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {QUICK_COMMANDS.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => setForm((f) => ({ ...f, command: cmd }))}
                      className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground hover:text-foreground border border-border transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.command}
                  onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
                  placeholder="สรุปข่าว หรือพิมพ์ prompt..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                onClick={addJob}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                บันทึกงาน {isApiConnected ? "→ Hermes" : "(Local)"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API jobs */}
      {isApiConnected && (
        <div className="space-y-2">
          {apiJobs.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Cloud className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">ไม่มี jobs ใน Hermes — กด "เพิ่มงาน" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {apiJobs.map((job) => (
                <motion.div
                  key={job.id}
                  layout
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className={`rounded-xl border bg-card p-4 flex items-start gap-3 transition-opacity ${!job.enabled ? "opacity-50 border-border/50" : "border-border"}`}
                >
                  <button
                    onClick={() => toggleApiJob(job)}
                    className={`mt-0.5 shrink-0 w-9 h-5 rounded-full flex items-center transition-colors ${job.enabled ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${job.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{job.name}</span>
                      <Cloud className="w-3.5 h-3.5 text-primary/60" />
                      {job.enabled && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30">เปิด</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{job.schedule}</code>
                      <span>→ {parseCron(job.schedule)}</span>
                    </div>
                    <div className="mt-1 text-xs text-foreground/70">
                      prompt: <span className="font-semibold">{job.prompt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => runApiJob(job.id!, job.name)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="รันทันที">
                      <Play className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteApiJob(job.id!)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="ลบ">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Local jobs */}
      {!isApiConnected && (
        <>
          {localJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarClock className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">ยังไม่มีงาน — กด "เพิ่มงาน" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {localJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className={`rounded-xl border bg-card p-4 flex items-start gap-3 ${!job.enabled ? "opacity-50 border-border/50" : "border-border"}`}
                  >
                    <button
                      onClick={() => toggleLocalJob(job.id)}
                      className={`mt-0.5 shrink-0 w-9 h-5 rounded-full flex items-center transition-colors ${job.enabled ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${job.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{job.name}</span>
                        {job.enabled && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30">เปิด</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{job.cron}</code>
                        <span>→ {parseCron(job.cron)}</span>
                      </div>
                      <div className="mt-1 text-xs text-foreground/70">คำสั่ง: <span className="font-semibold">{job.command}</span></div>
                      {job.lastRun && (
                        <div className="mt-0.5 text-xs text-muted-foreground/60">
                          รันล่าสุด: {new Date(job.lastRun).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => runLocalJob(job)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="รันทันที">
                        <Play className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteLocalJob(job.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="ลบ">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <div className="rounded-2xl bg-yellow-500/5 border border-yellow-500/20 p-4 flex gap-3 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
        <span>
          {isApiConnected
            ? "Jobs เหล่านี้รันจริงใน Hermes Agent — เปิด/ปิด/รันได้ทันที"
            : "เชื่อมต่อ Hermes API (Gateway → Hermes Agent API) เพื่อจัดการ jobs จริง — ตอนนี้บันทึกใน browser เท่านั้น"}
        </span>
      </div>
    </div>
  );
}
