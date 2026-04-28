import { motion } from "framer-motion";
import { Coffee } from "lucide-react";

/**
 * Boss character: stylized executive at a wooden desk.
 * Built with CSS shapes + emoji for personality.
 */
export function BossCharacter() {
  return (
    <div className="relative flex flex-col items-center">
      {/* Boss body */}
      <motion.div
        className="relative"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Head */}
        <div className="relative mx-auto w-24 h-24 rounded-full bg-[oklch(0.84_0.06_60)] shadow-soft flex items-center justify-center text-5xl border-4 border-[oklch(0.78_0.08_60)]">
          <span aria-hidden>😎</span>
          {/* Tiny crown */}
          <div className="absolute -top-3 text-2xl">👑</div>
        </div>
        {/* Suit / shoulders */}
        <div className="-mt-3 mx-auto w-36 h-20 rounded-t-[2rem] bg-[oklch(0.35_0.04_260)] relative shadow-soft">
          {/* Tie */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1 w-3 h-10 bg-boss rounded-b-md" />
          {/* Lapels */}
          <div className="absolute left-3 top-0 w-8 h-12 bg-[oklch(0.28_0.04_260)] rounded-bl-[2rem] rotate-[10deg]" />
          <div className="absolute right-3 top-0 w-8 h-12 bg-[oklch(0.28_0.04_260)] rounded-br-[2rem] -rotate-[10deg]" />
        </div>
      </motion.div>

      {/* Desk */}
      <div className="relative mt-1 w-72 h-28 wood-grain rounded-2xl shadow-pop border-2 border-wood-dark">
        {/* Desk top edge */}
        <div className="absolute inset-x-0 top-0 h-2 bg-wood-light rounded-t-2xl" />
        {/* Desk items */}
        <div className="absolute top-3 left-5 flex items-end gap-3">
          {/* Coffee mug */}
          <motion.div
            animate={{ rotate: [0, -2, 0, 2, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="w-10 h-10 rounded-md bg-card border-2 border-border shadow-soft flex items-center justify-center text-primary"
          >
            <Coffee className="w-5 h-5" />
          </motion.div>
          {/* Phone */}
          <div className="w-7 h-12 rounded-md bg-foreground/80 flex items-center justify-center">
            <div className="w-5 h-8 rounded-sm bg-window-sky" />
          </div>
          {/* Papers */}
          <div className="w-12 h-8 rounded-sm bg-card shadow-soft border border-border rotate-[-4deg]">
            <div className="m-1 h-1 bg-muted-foreground/40 rounded" />
            <div className="mx-1 h-1 bg-muted-foreground/40 rounded" />
            <div className="m-1 h-1 bg-muted-foreground/40 rounded w-2/3" />
          </div>
        </div>
        {/* Nameplate */}
        <div className="absolute bottom-2 right-3 px-2 py-1 rounded-md bg-card border border-border text-[10px] font-bold tracking-wide text-boss shadow-soft">
          เจ้านาย
        </div>
      </div>
    </div>
  );
}
