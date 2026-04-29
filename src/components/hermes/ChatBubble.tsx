import { motion, AnimatePresence } from "framer-motion";
import type { HermesStatus } from "@/lib/hermes-types";

interface ChatBubbleProps {
  message: string | null;
  side: "left" | "right";
  variant: "boss" | "hermes";
  label: string;
  /** Pass current Hermes status so we can show typing dots when working */
  hermesStatus?: HermesStatus;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 h-5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-hermes/70"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function ChatBubble({ message, side, variant, label, hermesStatus }: ChatBubbleProps) {
  const tailClass =
    side === "left"
      ? "after:left-8 after:border-l-transparent after:border-r-card"
      : "after:right-8 after:border-r-transparent after:border-l-card";

  const accent = variant === "boss" ? "text-boss" : "text-hermes";

  const showTyping = variant === "hermes" && hermesStatus === "working";

  return (
    <div className="min-h-[88px] w-full max-w-[280px]">
      <AnimatePresence mode="wait">
        {(message || showTyping) && (
          <motion.div
            key={showTyping ? "__typing__" : message}
            initial={{ opacity: 0, y: 12, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className={`relative rounded-2xl bg-card px-4 py-3 shadow-pop border border-border
              after:content-[''] after:absolute after:-bottom-2 after:w-0 after:h-0
              after:border-t-[10px] after:border-t-card after:border-x-[10px] after:border-x-transparent
              ${tailClass}`}
          >
            <div className={`text-[10px] font-bold uppercase tracking-wider ${accent}`}>
              {label}
            </div>
            {showTyping ? (
              <TypingDots />
            ) : (
              <p className="mt-1 text-sm leading-snug text-card-foreground">{message}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
