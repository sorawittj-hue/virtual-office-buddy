import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Wifi, Layers, Triangle } from "lucide-react";
import { Toaster } from "sonner";
import { useHermes } from "@/hooks/use-hermes";
import { useHermesService } from "@/lib/hermes-context";
import { Link } from "@tanstack/react-router";
import { lazy, Suspense, useState, useEffect } from "react";
import { ChatBubble } from "./ChatBubble";
import { StatusPanel } from "./StatusPanel";
import { TestingTools } from "./TestingTools";

const IsometricScene = lazy(() =>
  import("./IsometricScene").then((module) => ({ default: module.IsometricScene })),
);

export function Office() {
  const hermes = useHermes();
  const { wsState, service } = useHermesService();
  const isWorking = hermes.status === "working";
  const isConnected = wsState?.status === "connected";
  const [platformCount, setPlatformCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isConnected || !service.fetchPlatforms) return;
    service
      .fetchPlatforms()
      .then((p: Record<string, { connected: boolean }>) => {
        setPlatformCount(Object.values(p).filter((v) => v.connected).length);
      })
      .catch(() => {});
  }, [isConnected, service]);

  return (
    <>
      <Toaster position="top-right" richColors toastOptions={{ duration: 4000 }} />
      <div className="min-h-screen bg-gradient-sky">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Top bar */}
          <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="brand-mark hidden h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-soft sm:flex">
                <Triangle className="h-[18px] w-[18px] fill-current" />
              </div>
              <div>
                <h1 className="brand-wordmark text-xl leading-tight text-foreground">Office</h1>
                <p className="text-xs font-medium text-muted-foreground">
                  Prism workspace command center
                </p>
              </div>
              <span className="hidden text-xs text-muted-foreground">Virtual Workspace</span>
            </div>
            <div className="flex items-center gap-2">
              {hermes.totalCompleted > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 rounded-full border border-status-success/30 bg-status-success/15 px-3 py-1.5 text-xs font-bold text-status-success shadow-soft"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  {hermes.totalCompleted} completed
                </motion.div>
              )}
              {isConnected ? (
                <div className="glass-panel flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-status-success">
                  <Wifi className="w-3.5 h-3.5" />
                  {wsState?.url?.replace("ws://", "").replace("wss://", "")}
                </div>
              ) : (
                <Link
                  to="/gateway"
                  className="glass-panel flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                  Mock Mode · เชื่อมต่อจริง?
                </Link>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-start">
            {/* 3D Scene */}
            <section className="relative">
              <Suspense
                fallback={
                  <div className="office-scene-backdrop relative h-[min(72vw,470px)] min-h-[330px] overflow-hidden rounded-2xl border border-border shadow-soft" />
                }
              >
                <IsometricScene status={hermes.status} />
              </Suspense>

              {/* Chat bubbles overlay */}
              <div className="absolute top-4 inset-x-0 px-5 sm:px-8 flex justify-between items-start gap-4 z-20 pointer-events-none">
                <ChatBubble
                  side="left"
                  variant="boss"
                  label="เจ้านาย · ผ่าน Telegram"
                  message={hermes.bossMessage}
                />
                <ChatBubble
                  side="right"
                  variant="hermes"
                  label="เฮอร์มีส"
                  message={hermes.hermesMessage}
                  hermesStatus={hermes.status}
                />
              </div>

              {/* Status badge */}
              <AnimatePresence>
                {hermes.status !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-4 left-4 z-20"
                  >
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-card shadow-pop ${
                        hermes.status === "working"
                          ? "bg-status-working"
                          : hermes.status === "success"
                            ? "bg-status-success"
                            : "bg-destructive"
                      }`}
                    >
                      {hermes.status === "working" && (
                        <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                      )}
                      {hermes.status === "working"
                        ? hermes.activeTask
                          ? hermes.activeTask.command.slice(0, 40)
                          : "Working…"
                        : hermes.status === "success"
                          ? "✓ Done"
                          : "✕ Error"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Platform / connection badge */}
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-[color-mix(in_oklab,var(--brand-ink)_84%,transparent)] px-3 py-1.5 text-xs font-bold text-white shadow-soft backdrop-blur-sm">
                {isConnected ? (
                  <>
                    <Layers className="w-3 h-3 text-green-400" />
                    {platformCount !== null ? `${platformCount} platforms` : "Connected"}
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    Mock Mode
                  </>
                )}
              </div>
            </section>

            <StatusPanel state={hermes} />
          </div>

          <div className="mt-5">
            <TestingTools
              onSimulate={hermes.simulate}
              onSimulateError={hermes.simulateError}
              disabled={isWorking}
            />
          </div>
        </div>
      </div>
    </>
  );
}
