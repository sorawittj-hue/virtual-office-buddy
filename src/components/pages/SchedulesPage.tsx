import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Plus, Trash2, Power, Save, X, Play, Info } from "lucide-react";
import { toast } from "sonner";

interface CronJob {
  id: string;
  name: string;
  cron: string;
  command: string;
  enabled: boolean;
  createdAt: number;
  lastRun?: number;
}

const STORAGE_KEY = "hermes-schedules";

const PRESETS = [
  { label: "ทุกวัน 8 โมงเช้า", cron: "0 8 * * *" },
  { label: "ทุกจันทร์ 9 โมง", cron: "0 9 * * 1" },
  { label: "ทุกชั่วโมง", cron: "0 * * * *" },
  { label: "ทุก 30 นาที", cron: "*/30 * * * *" },
  { label: "ทุกวันจันทร์-ศุกร์ 8 โมง", cron: "0 8 * * 1-5" },
  { label: "ทุกวันสิ้นเดือน", cron: "0 9 28-31 * *" },
];

const QUICK_COMMANDS = ["สรุปข่าว", "ตรวจสอบงาน", "สร้างรายงาน", "ค้นหาข้อมูล", "ส่งอีเมล"];

function loadJobs(): CronJob[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: CronJob[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

function parseCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "รูปแบบไม่ถูกต้อง";

  const [min, hour, dom, month, dow] = parts;

  if (expr === "* * * * *") return "ทุกนาที";
  if (min === "0" && hour !== "*" && dom === "*" && month === "*" && dow === "*")
    return `ทุกวัน เวลา ${hour.padStart(2, "0")}:00 น.`;
  if (min.startsWith("*/")) return `ทุก ${min.slice(2)} นาที`;
  if (hour === "*" && min === "0") return "ทุกชั่วโมง";

  return expr;
}

function nextRunEstimate(cron: string): string {
  try {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return "-";
    const [min, hour] = parts;
    const now = new Date();
    const next = new Date();

    if (min !== "*" && !min.startsWith("*/")) next.setMinutes(parseInt(min));
    if (hour !== "*" && !hour.startsWith("*/")) next.setHours(parseInt(hour), parseInt(min === "*" ? "0" : min), 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    return next.toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function SchedulesPage() {
  const [jobs, setJobs] = useState<CronJob[]>(loadJobs);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", cron: "0 8 * * *", command: "" });
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    saveJobs(jobs);
  }, [jobs]);

  const addJob = () => {
    if (!form.name.trim() || !form.cron.trim() || !form.command.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    const job: CronJob = {
      id: crypto.randomUUID(),
      name: form.name,
      cron: form.cron,
      command: form.command,
      enabled: true,
      createdAt: Date.now(),
    };
    setJobs((prev) => [job, ...prev]);
    setForm({ name: "", cron: "0 8 * * *", command: "" });
    setShowForm(false);
    toast.success(`เพิ่ม "${job.name}" แล้ว`);
  };

  const toggleJob = (id: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, enabled: !j.enabled } : j)));
  };

  const deleteJob = (id: string) => {
    const name = jobs.find((j) => j.id === id)?.name;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    toast.success(`ลบ "${name}" แล้ว`);
  };

  const runNow = (job: CronJob) => {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, lastRun: Date.now() } : j)));
    toast.success(`รัน "${job.command}" ทันที`);
  };

  const enabledCount = jobs.filter((j) => j.enabled).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-primary" />
            Schedules
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ตั้งเวลาให้ Hermes รันคำสั่งอัตโนมัติ · {enabledCount}/{jobs.length} งานเปิดอยู่
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มงาน
        </button>
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
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Cron Expression
                  </label>
                  <button
                    onClick={() => setShowPresets((v) => !v)}
                    className="text-xs text-primary hover:underline"
                  >
                    เทมเพลต {showPresets ? "▲" : "▼"}
                  </button>
                </div>
                <AnimatePresence>
                  {showPresets && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {PRESETS.map((p) => (
                          <button
                            key={p.cron}
                            onClick={() => {
                              setForm((f) => ({ ...f, cron: p.cron }));
                              setShowPresets(false);
                            }}
                            className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
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
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.cron && (
                  <p className="text-xs text-primary">→ {parseCron(form.cron)}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">คำสั่ง</label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {QUICK_COMMANDS.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => setForm((f) => ({ ...f, command: cmd }))}
                      className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.command}
                  onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
                  placeholder="สรุปข่าว หรือพิมพ์อะไรก็ได้..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                onClick={addJob}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                บันทึกงาน
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarClock className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">ยังไม่มีงานตั้งเวลา — กด "เพิ่มงาน" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className={`rounded-xl border bg-card p-4 flex items-start gap-3 transition-opacity ${
                  !job.enabled ? "opacity-50" : ""
                } ${job.enabled ? "border-border" : "border-border/50"}`}
              >
                <button
                  onClick={() => toggleJob(job.id)}
                  className={`mt-0.5 shrink-0 w-9 h-5 rounded-full flex items-center transition-colors ${
                    job.enabled ? "bg-primary" : "bg-muted"
                  }`}
                  title={job.enabled ? "ปิด" : "เปิด"}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      job.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{job.name}</span>
                    {job.enabled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30">
                        เปิด
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                    <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{job.cron}</code>
                    <span>→ {parseCron(job.cron)}</span>
                  </div>
                  <div className="mt-1 text-xs text-foreground/70">
                    คำสั่ง: <span className="font-semibold">{job.command}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground/60">
                    วิ่งครั้งถัดไป: {nextRunEstimate(job.cron)}
                    {job.lastRun && (
                      <span className="ml-3">
                        ล่าสุด: {new Date(job.lastRun).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => runNow(job)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="รันทันที"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Note */}
      <div className="rounded-2xl bg-yellow-500/5 border border-yellow-500/20 p-4 flex gap-3 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
        <span>
          Schedules นี้เป็น UI สำหรับจัดการงาน — หากต้องการรันจริง ต้องเพิ่ม cron runner ใน{" "}
          <code className="font-mono px-1 rounded bg-muted">telegram-bridge.js</code> ด้วย
        </span>
      </div>
    </div>
  );
}
