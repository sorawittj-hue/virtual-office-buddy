import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Circle,
  Loader2,
  Radio,
  Send,
  Sparkles,
  XCircle,
  Trophy,
  Clock,
} from "lucide-react";
import type { HermesState, HermesStatus, TaskLogEntry, TaskStep } from "@/lib/hermes-types";

interface StatusPanelProps {
  state: HermesState;
}

const statusMeta: Record<HermesStatus, { label: string; color: string; icon: React.ReactNode }> = {
  idle: {
    label: "ว่าง",
    color: "bg-status-idle",
    icon: <Activity className="w-3.5 h-3.5" />,
  },
  working: {
    label: "กำลังทำงาน",
    color: "bg-status-working",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  success: {
    label: "สำเร็จ",
    color: "bg-status-success",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  error: {
    label: "ข้อผิดพลาด",
    color: "bg-destructive",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "เมื่อกี้";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} นาทีที่แล้ว`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ชม.ที่แล้ว`;
  return `${Math.floor(diff / 86_400_000)} วันที่แล้ว`;
}

function StepRow({ step }: { step: TaskStep }) {
  const icon =
    step.status === "done" ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
    ) : step.status === "running" ? (
      <Loader2 className="w-3.5 h-3.5 text-status-working animate-spin" />
    ) : step.status === "error" ? (
      <XCircle className="w-3.5 h-3.5 text-destructive" />
    ) : (
      <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />
    );

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex items-start gap-2 text-[11px]"
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="flex-1">
        <span
          className={
            step.status === "done"
              ? "text-card-foreground"
              : step.status === "running"
                ? "text-card-foreground font-semibold"
                : step.status === "error"
                  ? "text-destructive font-semibold"
                  : "text-muted-foreground"
          }
        >
          {step.label}
        </span>
        {step.detail && <span className="block text-muted-foreground italic">{step.detail}</span>}
        {step.startedAt && step.completedAt && (
          <span className="block text-muted-foreground/60">
            {formatDuration(step.completedAt - step.startedAt)}
          </span>
        )}
      </span>
    </motion.li>
  );
}

function ActiveTaskCard({ task }: { task: TaskLogEntry }) {
  const total = task.steps.length;
  const done = task.steps.filter((s) => s.status === "done").length;
  const isComplete = task.status === "success";
  const isError = task.status === "error";
  const progress = total === 0 ? 0 : (done / total) * 100;
  const duration = task.completedAt ? formatDuration(task.completedAt - task.startedAt) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-3 ${
        isComplete
          ? "border-status-success/40 bg-status-success/5"
          : isError
            ? "border-destructive/40 bg-destructive/5"
            : "border-status-working/40 bg-status-working/5"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-boss">
        <Send className="w-3 h-3" />
        {task.command}
        <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground font-medium">
          {isComplete ? (
            <>
              <Sparkles className="w-3 h-3 text-status-success" />
              {duration ?? "เสร็จแล้ว"}
            </>
          ) : isError ? (
            <>
              <XCircle className="w-3 h-3 text-destructive" />
              Error
            </>
          ) : (
            <>
              {done}/{total}
            </>
          )}
        </span>
      </div>

      {/* Progress bar */}
      {!isError && (
        <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={isComplete ? "h-full bg-status-success" : "h-full bg-status-working"}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 24 }}
          />
        </div>
      )}

      {/* Steps */}
      <ul className="mt-2.5 flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {task.steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </AnimatePresence>
      </ul>

      {(isComplete || isError) && task.result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-2 flex items-start gap-1.5 text-[11px] border-t border-border/60 pt-2 ${
            isError ? "text-destructive" : "text-card-foreground"
          }`}
        >
          {isError ? (
            <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3 h-3 mt-0.5 text-status-success shrink-0" />
          )}
          <span>{task.result}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function StatusPanel({ state }: StatusPanelProps) {
  const meta = statusMeta[state.status];
  const history = state.activeTask
    ? state.log.filter((entry) => entry.id !== state.activeTask?.id)
    : state.log;

  return (
    <aside className="w-full lg:w-80 shrink-0 rounded-3xl bg-card border border-border shadow-pop p-5 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-card-foreground">เอเจนต์เฮอร์มีส</h2>
          <p className="text-xs text-muted-foreground">แดชบอร์ดสถานะแบบเรียลไทม์</p>
        </div>
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-status-success/40 animate-ping" />
          <span className="relative block w-3 h-3 rounded-full bg-status-success" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-card-foreground">
            <Radio className="w-3.5 h-3.5 text-primary" />
            การเชื่อมต่อ
          </div>
          <span className="text-xs font-semibold text-status-success">
            ออนไลน์ · {state.channel}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-card-foreground">
            <Activity className="w-3.5 h-3.5 text-primary" />
            สถานะปัจจุบัน
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold text-card px-2 py-0.5 rounded-full ${meta.color}`}
          >
            {meta.icon}
            {meta.label}
          </span>
        </div>

        {state.totalCompleted > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between rounded-xl bg-status-success/10 border border-status-success/20 px-3 py-2"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-card-foreground">
              <Trophy className="w-3.5 h-3.5 text-status-success" />
              งานสำเร็จทั้งหมด
            </div>
            <span className="text-xs font-bold text-status-success">
              {state.totalCompleted} งาน
            </span>
          </motion.div>
        )}
      </div>

      {/* Active task */}
      <AnimatePresence>
        {state.activeTask && (
          <motion.div
            key={state.activeTask.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-working animate-pulse" />
              งานที่กำลังทำ
            </h3>
            <ActiveTaskCard task={state.activeTask} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          งานล่าสุด
        </h3>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {history.length === 0 && !state.activeTask && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground italic px-3 py-4 rounded-xl border border-dashed border-border text-center"
              >
                ยังไม่มีงาน — ลองใช้เครื่องมือทดสอบด้านล่างได้เลย
              </motion.div>
            )}
            {history.map((entry) => {
              const duration = entry.completedAt
                ? formatDuration(entry.completedAt - entry.startedAt)
                : null;
              const isError = entry.status === "error";
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className={`rounded-xl border bg-background/60 p-2.5 ${
                    isError ? "border-destructive/30" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-boss">
                    {isError ? (
                      <XCircle className="w-3 h-3 text-destructive" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    {entry.command}
                    <span className="ml-auto flex items-center gap-1 text-muted-foreground font-medium">
                      {duration && (
                        <>
                          <Clock className="w-2.5 h-2.5" />
                          {duration}
                        </>
                      )}
                    </span>
                  </div>
                  <div
                    className={`mt-1 flex items-start gap-1.5 text-[11px] ${
                      isError ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {isError ? (
                      <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mt-0.5 text-status-success shrink-0" />
                    )}
                    <span>{entry.result}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground/60">
                    {formatTimeAgo(entry.timestamp)}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
