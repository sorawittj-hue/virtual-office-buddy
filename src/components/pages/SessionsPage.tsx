import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, Send, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useHermes } from "@/hooks/use-hermes";
import type { TaskLogEntry } from "@/lib/hermes-types";

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function SessionCard({ entry }: { entry: TaskLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isError = entry.status === "error";
  const duration = entry.completedAt ? formatDuration(entry.completedAt - entry.startedAt) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border bg-card ${isError ? "border-destructive/30" : "border-border"}`}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        {isError ? (
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
            <span>{entry.steps.length} ขั้นตอน</span>
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
                    ) : step.status === "error" ? (
                      <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 mt-0.5 shrink-0" />
                    )}
                    <span className={step.status === "error" ? "text-destructive" : "text-foreground"}>
                      {step.label}
                      {step.detail && (
                        <span className="ml-1 text-muted-foreground italic">— {step.detail}</span>
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
  const all = activeTask ? [activeTask, ...log.filter((e) => e.id !== activeTask.id)] : log;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <Clock className="w-6 h-6 text-primary" />
          Sessions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ประวัติงานทั้งหมดที่ Hermes ดำเนินการ
        </p>
      </div>

      {all.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">ยังไม่มี session — ลองส่งคำสั่งผ่านหน้า Office ได้เลย</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {all.map((entry) => (
              <SessionCard key={entry.id} entry={entry} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
