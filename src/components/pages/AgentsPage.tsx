import { motion } from "framer-motion";
import { Users, Circle, Loader2, CheckCircle2, XCircle, RefreshCw, Cpu, Globe, Clock } from "lucide-react";
import { useHermes } from "@/hooks/use-hermes";
import { useHermesService } from "@/lib/hermes-context";
import { useState, useEffect, useCallback } from "react";

interface AgentHealth {
  model?: string;
  uptime?: number;
  platformsConnected?: number;
  version?: string;
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

export function AgentsPage() {
  const { status, activeTask, totalCompleted, log } = useHermes();
  const { wsState, service } = useHermesService();
  const isConnected = wsState?.status === "connected";

  const [health, setHealth] = useState<AgentHealth>({});
  const [loading, setLoading] = useState(false);

  const fetchHealth = useCallback(async () => {
    if (!isConnected || !("fetchHealth" in service)) return;
    setLoading(true);
    try {
      const data = await (service as any).fetchHealth();
      setHealth({
        model: data.model ?? data.llm_model ?? undefined,
        uptime: data.uptime ?? undefined,
        platformsConnected: data.platforms
          ? Object.values(data.platforms).filter((p: any) => p.connected).length
          : undefined,
        version: data.version ?? undefined,
      });
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, [isConnected, service]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const statusColor = {
    idle: "text-status-success",
    working: "text-status-working",
    success: "text-status-success",
    error: "text-destructive",
  }[status];

  const statusLabel = {
    idle: "Online · Idle",
    working: "Working…",
    success: "Online · Done",
    error: "Error",
  }[status];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Users className="w-6 h-6 text-primary" />
            Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI agents connected to Prism
          </p>
        </div>
        {isConnected && (
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Main Hermes Agent card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border p-5 space-y-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl border-2 border-hermes/40 bg-hermes/20 flex items-center justify-center text-3xl shrink-0">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground text-lg">Hermes</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Orchestrator</span>
              {health.version && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">v{health.version}</span>
              )}
            </div>
            <div className={`flex items-center gap-1.5 mt-1 text-sm font-medium ${statusColor}`}>
              {status === "working" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : status === "error" ? (
                <XCircle className="w-3.5 h-3.5" />
              ) : status === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Circle className="w-3.5 h-3.5 fill-current" />
              )}
              {isConnected ? statusLabel : "Mock Mode"}
            </div>
          </div>
        </div>

        {/* Live stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/40 px-3 py-2.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cpu className="w-3 h-3" />
              Model
            </div>
            <div className="text-xs font-semibold text-foreground truncate">
              {health.model ?? (isConnected ? "—" : "Not connected")}
            </div>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="w-3 h-3" />
              Platforms
            </div>
            <div className="text-xs font-semibold text-foreground">
              {health.platformsConnected !== undefined ? `${health.platformsConnected} active` : "—"}
            </div>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Uptime
            </div>
            <div className="text-xs font-semibold text-foreground">
              {health.uptime !== undefined ? formatUptime(health.uptime) : "—"}
            </div>
          </div>
        </div>

        {/* Current task */}
        {activeTask && (
          <div className="rounded-xl bg-status-working/10 border border-status-working/20 px-3 py-2 text-xs">
            <span className="font-semibold text-status-working">Active task: </span>
            <span className="text-muted-foreground">{activeTask.command}</span>
          </div>
        )}

        {/* Session stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
          <span>{totalCompleted ?? 0} tasks completed this session</span>
          <span>{log?.length ?? 0} log entries</span>
        </div>
      </motion.div>

      {/* Offline / mock mode notice */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
        >
          Connect to Hermes Agent via{" "}
          <a href="/gateway" className="text-primary hover:underline font-medium">Gateway</a>{" "}
          to see live agent status, model info, uptime, and active platforms.
        </motion.div>
      )}
    </div>
  );
}
