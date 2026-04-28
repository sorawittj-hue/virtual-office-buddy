import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, Loader2, Radio, Send } from "lucide-react";
import type { HermesState, HermesStatus } from "@/lib/hermes-types";

interface StatusPanelProps {
  state: HermesState;
}

const statusMeta: Record<HermesStatus, { label: string; color: string; icon: React.ReactNode }> = {
  idle: {
    label: "Idle",
    color: "bg-status-idle",
    icon: <Activity className="w-3.5 h-3.5" />,
  },
  working: {
    label: "Working",
    color: "bg-status-working",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  success: {
    label: "Success",
    color: "bg-status-success",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

export function StatusPanel({ state }: StatusPanelProps) {
  const meta = statusMeta[state.status];

  return (
    <aside className="w-full lg:w-80 shrink-0 rounded-3xl bg-card border border-border shadow-pop p-5 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-card-foreground">Hermes Agent</h2>
          <p className="text-xs text-muted-foreground">Live status dashboard</p>
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
            Connection
          </div>
          <span className="text-xs font-semibold text-status-success">
            Online · {state.channel}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-card-foreground">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Current status
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold text-card px-2 py-0.5 rounded-full ${meta.color}`}
          >
            {meta.icon}
            {meta.label}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Recent tasks
        </h3>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {state.log.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground italic px-3 py-4 rounded-xl border border-dashed border-border text-center"
              >
                No tasks yet — try the testing tools below.
              </motion.div>
            )}
            {state.log.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className="rounded-xl border border-border bg-background/60 p-2.5"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-boss">
                  <Send className="w-3 h-3" />
                  {entry.command}
                </div>
                <div className="mt-1 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 text-status-success shrink-0" />
                  <span>{entry.result}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
