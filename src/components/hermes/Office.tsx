import { motion } from "framer-motion";
import { useHermes } from "@/hooks/use-hermes";
import { BossCharacter } from "./BossCharacter";
import { HermesCharacter } from "./HermesCharacter";
import { ChatBubble } from "./ChatBubble";
import { StatusPanel } from "./StatusPanel";
import { TestingTools } from "./TestingTools";

export function Office() {
  const hermes = useHermes();
  const isWorking = hermes.status === "working";

  return (
    <div className="min-h-screen bg-gradient-sky">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-pop">
              H
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground tracking-tight">
                Hermes · Virtual Office
              </h1>
              <p className="text-xs text-muted-foreground">
                Your AI employee, hard at work.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-soft text-xs font-medium text-card-foreground">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            Telegram channel live
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
          {/* Office scene */}
          <section className="relative rounded-3xl overflow-hidden border border-border shadow-pop bg-wall">
            {/* Wall */}
            <div className="relative h-[520px] sm:h-[560px]">
              {/* Window */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-40 h-28 rounded-xl bg-window-sky border-4 border-card shadow-soft overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  <div className="border-r-2 border-b-2 border-card" />
                  <div className="border-b-2 border-card" />
                  <div className="border-r-2 border-card" />
                  <div />
                </div>
                {/* Sun */}
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent shadow-[0_0_20px_rgba(255,200,80,0.8)]" />
                {/* Cloud */}
                <motion.div
                  animate={{ x: [0, 20, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-8 left-3 w-10 h-3 bg-card rounded-full opacity-90"
                />
              </div>

              {/* Wall art */}
              <div className="absolute top-10 left-10 w-16 h-12 rounded-md bg-card border-4 border-wood-dark shadow-soft hidden sm:block">
                <div className="m-1 h-full bg-plant/30 rounded-sm" />
              </div>
              <div className="absolute top-12 right-10 w-14 h-14 rounded-md bg-card border-4 border-wood-dark shadow-soft hidden sm:flex items-center justify-center text-2xl">
                📈
              </div>

              {/* Plant */}
              <div className="absolute bottom-32 left-4 sm:left-8 hidden sm:block">
                <div className="w-12 h-8 rounded-b-2xl bg-wood-dark" />
                <div className="-mt-10 mx-auto w-14 h-14 rounded-full bg-plant relative">
                  <div className="absolute -top-2 left-2 w-6 h-8 rounded-full bg-plant rotate-[-20deg]" />
                  <div className="absolute -top-3 right-1 w-5 h-7 rounded-full bg-plant rotate-[15deg]" />
                </div>
              </div>

              {/* Floor */}
              <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-floor border-t-4 border-wood-dark" />

              {/* Chat bubbles row */}
              <div className="absolute top-6 inset-x-0 px-6 sm:px-12 flex justify-between items-start gap-4 z-20">
                <ChatBubble
                  side="left"
                  variant="boss"
                  label="Boss · via Telegram"
                  message={hermes.bossMessage}
                />
                <ChatBubble
                  side="right"
                  variant="hermes"
                  label="Hermes"
                  message={hermes.hermesMessage}
                />
              </div>

              {/* Characters */}
              <div className="absolute bottom-6 inset-x-0 px-4 sm:px-10 flex justify-between items-end gap-4 z-10">
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 22 }}
                >
                  <BossCharacter />
                </motion.div>

                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 220, damping: 22 }}
                >
                  <HermesCharacter status={hermes.status} />
                </motion.div>
              </div>
            </div>
          </section>

          <StatusPanel state={hermes} />
        </div>

        <div className="mt-6">
          <TestingTools onSimulate={hermes.simulate} disabled={isWorking} />
        </div>

        <footer className="mt-6 text-center text-xs text-muted-foreground">
          Mock service in <code className="px-1 rounded bg-muted">src/lib/hermes-service.ts</code>
          {" — "}swap with WebSocket / API for real Hermes backend.
        </footer>
      </div>
    </div>
  );
}
