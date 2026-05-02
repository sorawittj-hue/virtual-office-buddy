import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  ChevronDown,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useHermes } from "@/hooks/use-hermes";
import type { TaskLogEntry } from "@/lib/hermes-types";

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SessionCard({ entry }: { entry: TaskLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isError = entry.status === "error";
  const isWorking = entry.status === "working";
  const duration = entry.completedAt ? formatDuration(entry.completedAt - entry.startedAt) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border bg-card transition-colors ${
        isError ? "border-destructive/30" : isWorking ? "border-primary/40" : "border-border"
      }`}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        {isWorking ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
        ) : isError ? (
          <XCircle className="w-4 h-4 text-destructive shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Send className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate">{entry.command}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span>{formatTime(entry.timestamp)}</span>
            {duration && <span>⏱ {duration}</span>}
            <span>
              {entry.steps.filter((s) => s.status === "done").length}/{entry.steps.length} ขั้นตอน
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3 space-y-2">
              <ul className="space-y-1.5">
                {entry.steps.map((step) => (
                  <li key={step.id} className="flex items-start gap-2 text-xs">
                    {step.status === "done" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-success mt-0.5 shrink-0" />
                    ) : step.status === "running" ? (
                      <Loader2 className="w-3.5 h-3.5 text-primary animate-spin mt-0.5 shrink-0" />
                    ) : step.status === "error" ? (
                      <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={step.status === "error" ? "text-destructive" : "text-foreground"}
                    >
                      {step.label}
                      {step.detail && (
                        <span className="ml-1 text-muted-foreground italic">— {step.detail}</span>
                      )}
                      {step.completedAt && step.startedAt && (
                        <span className="ml-1 text-muted-foreground/60">
                          ({formatDuration(step.completedAt - step.startedAt)})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {entry.result && (
                <div
                  className={`text-xs px-3 py-2 rounded-lg border ${
                    isError
                      ? "bg-destructive/5 border-destructive/20 text-destructive"
                      : "bg-status-success/5 border-status-success/20 text-status-success"
                  }`}
                >
                  {entry.result}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SessionsPage() {
  const { log, activeTask } = useHermes();
  const [search, setSearch] = useState("");

  const all = useMemo(
    () => (activeTask ? [activeTask, ...log.filter((e) => e.id !== activeTask.id)] : log),
    [activeTask, log],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (e) =>
        e.command.toLowerCase().includes(q) ||
        e.result?.toLowerCase().includes(q) ||
        e.steps.some((s) => s.label.toLowerCase().includes(q)),
    );
  }, [all, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, TaskLogEntry[]>();
    for (const entry of filtered) {
      const key = formatDate(entry.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-primary" />
            Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ประวัติงานทั้งหมดที่ Hermes ดำเนินการ ({all.length} รายการ)
          </p>
        </div>
        {all.length > 0 && (
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา session…"
              className="pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-52"
            />
          </div>
        )}
      </div>

      {all.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            ยังไม่มี session — ลองส่งคำสั่งผ่านหน้า Chat หรือ Office
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">ไม่พบ session ที่ตรงกับ "{search}"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, entries]) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {date}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{entries.length} รายการ</span>
              </div>
              <AnimatePresence initial={false}>
                {entries.map((entry) => (
                  <SessionCard key={entry.id} entry={entry} />
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
