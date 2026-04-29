import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Trophy, Wifi } from "lucide-react";
import { Toaster } from "sonner";
import { useHermes } from "@/hooks/use-hermes";
import { ChatBubble } from "./ChatBubble";
import { StatusPanel } from "./StatusPanel";
import { TestingTools } from "./TestingTools";
import { IsometricScene } from "./IsometricScene";

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return [dark, setDark] as const;
}

export function Office() {
  const hermes = useHermes();
  const isWorking = hermes.status === "working";
  const [dark, setDark] = useDarkMode();

  return (
    <>
      <Toaster position="top-right" richColors toastOptions={{ duration: 4000 }} />
      <div className="min-h-screen bg-gradient-sky">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

          {/* ── Header ── */}
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-pop">
                H
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground tracking-tight">
                  เฮอร์มีส · ออฟฟิศเสมือน
                </h1>
                <p className="text-xs text-muted-foreground">
                  พนักงาน AI ของคุณ กำลังตั้งใจทำงาน
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hermes.totalCompleted > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-success/15 border border-status-success/30 text-xs font-bold text-status-success"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  {hermes.totalCompleted} งานสำเร็จ
                </motion.div>
              )}

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-soft text-xs font-medium text-card-foreground">
                <Wifi className="w-3.5 h-3.5 text-status-success" />
                <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                Telegram ออนไลน์
              </div>

              <button
                onClick={() => setDark((d) => !d)}
                className="w-9 h-9 rounded-full bg-card border border-border shadow-soft flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={dark ? "เปิดโหมดสว่าง" : "เปิดโหมดมืด"}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* ── Main layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">

            {/* Office scene */}
            <section className="relative">
              {/* 3D Isometric scene */}
              <IsometricScene status={hermes.status} />

              {/* Chat bubble overlay – top corners */}
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

              {/* Status badge overlay – bottom left */}
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
                        ? "กำลังทำงาน…"
                        : hermes.status === "success"
                          ? "✓ เสร็จแล้ว"
                          : "✕ Error"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Agent count badge – bottom right */}
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-bold backdrop-blur-sm border border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                3 Agents
              </div>
            </section>

            <StatusPanel state={hermes} />
          </div>

          {/* ── Testing tools ── */}
          <div className="mt-6">
            <TestingTools
              onSimulate={hermes.simulate}
              onSimulateError={hermes.simulateError}
              disabled={isWorking}
            />
          </div>

          <footer className="mt-6 text-center text-xs text-muted-foreground">
            ระบบจำลองอยู่ใน{" "}
            <code className="px-1 rounded bg-muted">src/lib/hermes-service.ts</code>
            {" — "}เปลี่ยนเป็น WebSocket / API เพื่อเชื่อมต่อ Hermes จริงได้ทันที
          </footer>
        </div>
      </div>
    </>
  );
}
