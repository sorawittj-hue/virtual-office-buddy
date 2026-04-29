import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Wifi } from "lucide-react";
import { Toaster } from "sonner";
import { useHermes } from "@/hooks/use-hermes";
import { useHermesService } from "@/lib/hermes-context";
import { Link } from "@tanstack/react-router";
import { ChatBubble } from "./ChatBubble";
import { StatusPanel } from "./StatusPanel";
import { TestingTools } from "./TestingTools";
import { IsometricScene } from "./IsometricScene";

export function Office() {
  const hermes = useHermes();
  const { wsState } = useHermesService();
  const isWorking = hermes.status === "working";
  const isConnected = wsState?.status === "connected";

  return (
    <>
      <Toaster position="top-right" richColors toastOptions={{ duration: 4000 }} />
      <div className="min-h-screen bg-gradient-sky">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">

          {/* Top bar */}
          <header className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-foreground tracking-tight">Office</h1>
              <span className="text-xs text-muted-foreground">· Virtual Workspace</span>
            </div>
            <div className="flex items-center gap-2">
              {hermes.totalCompleted > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-success/15 border border-status-success/30 text-xs font-bold text-status-success"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  {hermes.totalCompleted} งานสำเร็จ
                </motion.div>
              )}
              {isConnected ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border shadow-soft text-xs font-medium text-status-success">
                  <Wifi className="w-3.5 h-3.5" />
                  {wsState?.url?.replace("ws://", "").replace("wss://", "")}
                </div>
              ) : (
                <Link
                  to="/gateway"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border shadow-soft text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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
              <IsometricScene status={hermes.status} />

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
                      {hermes.status === "working" ? "กำลังทำงาน…"
                        : hermes.status === "success" ? "✓ เสร็จแล้ว"
                        : "✕ Error"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Agent count */}
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-bold backdrop-blur-sm border border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                3 Agents
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
