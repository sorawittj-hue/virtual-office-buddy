import { motion, AnimatePresence } from "framer-motion";
import { Check, Code2, AlertTriangle } from "lucide-react";
import type { HermesStatus } from "@/lib/hermes-types";

interface HermesCharacterProps {
  status: HermesStatus;
}

import type { Variants } from "framer-motion";

const bodyVariants: Variants = {
  idle: {
    y: [0, -4, 0],
    rotate: 0,
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  },
  working: {
    y: [0, -1, 0, 1, 0],
    rotate: [0, -1.5, 0, 1.5, 0],
    transition: { duration: 0.18, repeat: Infinity, ease: "linear" },
  },
  success: {
    y: [0, -28, 0],
    rotate: [0, -6, 6, 0],
    transition: { duration: 0.7, ease: "easeOut" },
  },
  error: {
    x: [0, -6, 6, -4, 4, 0],
    rotate: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function HermesCharacter({ status }: HermesCharacterProps) {
  const monitorClass =
    status === "working"
      ? "monitor-pulse border-status-working"
      : status === "success"
        ? "monitor-success border-status-success"
        : status === "error"
          ? "monitor-error border-destructive"
          : "border-border";

  const screenContent =
    status === "working" ? (
      <div className="flex flex-col items-start justify-center h-full px-2 gap-1 text-status-working">
        <Code2 className="w-4 h-4" />
        <div className="h-1 w-10 bg-status-working/70 rounded animate-pulse" />
        <div className="h-1 w-14 bg-status-working/50 rounded animate-pulse" />
        <div className="h-1 w-8 bg-status-working/70 rounded animate-pulse" />
      </div>
    ) : status === "success" ? (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: [0, 1.4, 1], rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 14 }}
          className="w-10 h-10 rounded-full bg-status-success flex items-center justify-center text-card shadow-pop"
        >
          <Check className="w-6 h-6" strokeWidth={3} />
        </motion.div>
      </div>
    ) : status === "error" ? (
      <div className="flex flex-col items-center justify-center h-full gap-1">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ type: "spring", stiffness: 400, damping: 14 }}
          className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center"
        >
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </motion.div>
        <div className="h-1 w-10 bg-destructive/50 rounded" />
      </div>
    ) : (
      <div className="flex items-center justify-center h-full text-status-idle text-2xl">
        <span className="animate-pulse">·_·</span>
      </div>
    );

  const faceEmoji =
    status === "success" ? "🤩" : status === "working" ? "🤓" : status === "error" ? "😰" : "🙂";

  return (
    <div className="relative flex flex-col items-center">
      {/* Hermes body */}
      <motion.div className="relative z-10" variants={bodyVariants} animate={status}>
        {/* Head */}
        <div className="relative mx-auto w-24 h-24 rounded-full bg-hermes shadow-soft flex items-center justify-center text-4xl border-4 border-[oklch(0.6_0.14_200)]">
          {/* Headset band */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-20 h-3 rounded-t-full border-t-4 border-x-4 border-foreground/70" />
          {/* Headset cup */}
          <div className="absolute -left-2 top-7 w-4 h-6 rounded-md bg-foreground/70" />
          <div className="absolute -right-2 top-7 w-4 h-6 rounded-md bg-foreground/70" />
          {/* Mic */}
          <div className="absolute right-0 top-12 w-6 h-1.5 rounded-full bg-foreground/70" />
          <AnimatePresence mode="wait">
            <motion.span
              key={faceEmoji}
              aria-hidden
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {faceEmoji}
            </motion.span>
          </AnimatePresence>
        </div>
        {/* Body / shirt */}
        <div className="-mt-3 mx-auto w-32 h-20 rounded-t-[2rem] bg-card relative shadow-soft border-2 border-border">
          {/* Badge */}
          <div className="absolute left-3 top-3 w-8 h-10 rounded-md bg-hermes/30 border border-hermes flex items-center justify-center text-[8px] font-bold text-hermes">
            ID
          </div>
          {/* Pocket */}
          <div className="absolute right-3 top-3 w-10 h-8 rounded border border-border" />
        </div>
      </motion.div>

      {/* Workstation desk */}
      <div className="relative -mt-2 w-80 h-32 wood-grain rounded-2xl shadow-pop border-2 border-wood-dark">
        <div className="absolute inset-x-0 top-0 h-2 bg-wood-light rounded-t-2xl" />

        {/* Monitor */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-20 flex flex-col items-center">
          <div
            className={`w-32 h-20 rounded-lg bg-foreground p-1 border-4 transition-colors ${monitorClass}`}
          >
            <div className="w-full h-full rounded-sm bg-[oklch(0.18_0.03_250)] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={status}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  {screenContent}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          {/* Stand */}
          <div className="w-3 h-3 bg-foreground/80" />
          <div className="w-16 h-1.5 bg-foreground/80 rounded-b-md" />
        </div>

        {/* Keyboard */}
        <motion.div
          animate={status === "working" ? { y: [0, -2, 0] } : { y: 0 }}
          transition={{ duration: 0.12, repeat: status === "working" ? Infinity : 0 }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-40 h-6 rounded-md bg-card border border-border shadow-soft flex items-center justify-center gap-1 px-2"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-sm bg-muted" />
          ))}
        </motion.div>

        {/* Mouse */}
        <div className="absolute bottom-4 right-4 w-5 h-7 rounded-full bg-card border border-border shadow-soft" />

        {/* Nameplate */}
        <div className="absolute bottom-2 left-3 px-2 py-1 rounded-md bg-card border border-border text-[10px] font-bold tracking-wide text-hermes shadow-soft">
          เฮอร์มีส · พนักงาน AI
        </div>
      </div>
    </div>
  );
}
