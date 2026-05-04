import { motion, AnimatePresence } from "framer-motion";
import type { HermesStatus } from "@/lib/hermes-types";

const STATUS_TEXT: Record<HermesStatus, string> = {
  idle: "พร้อมทำงาน",
  working: "กำลังประมวลผล…",
  success: "งานสำเร็จ ✓",
  error: "พบข้อผิดพลาด",
};

/* ───────────────────── Character ───────────────────── */

type Role = "boss" | "hermes" | "agent";

function Character({
  role,
  name,
  title,
  status,
  accent,
  hair,
  skin = "#f3c89a",
  shirt,
  pants = "#1f2937",
}: {
  role: Role;
  name: string;
  title: string;
  status: HermesStatus;
  accent: string;
  hair: string;
  skin?: string;
  shirt: string;
  pants?: string;
}) {
  const isWorking = status === "working" && role === "hermes";
  const isSuccess = status === "success" && role === "hermes";
  const isError = status === "error" && role === "hermes";

  const dotColor =
    role !== "hermes"
      ? "#9ca3af"
      : status === "working"
        ? "#f59e0b"
        : status === "success"
          ? "#22c55e"
          : status === "error"
            ? "#ef4444"
            : "#9ca3af";

  // body bob animation
  const bodyAnim = isWorking
    ? { y: [0, -2, 0] }
    : isSuccess
      ? { y: [0, -8, 0] }
      : isError
        ? { x: [0, -3, 3, -3, 3, 0] }
        : { y: [0, -1.5, 0] };
  const bodyTrans = {
    duration: isWorking ? 0.5 : isSuccess ? 0.6 : isError ? 0.4 : 3.2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };

  // arm animation (typing)
  const armAnim = isWorking
    ? { rotate: [-15, -45, -15] }
    : isSuccess
      ? { rotate: [-10, -90, -10] }
      : { rotate: [-10, -14, -10] };
  const armTrans = {
    duration: isWorking ? 0.35 : isSuccess ? 0.6 : 3,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Name tag */}
      <div className="mb-1.5 flex flex-col items-center">
        <div
          className="rounded-md border border-white/15 bg-black/75 px-2 py-0.5 text-center shadow-md backdrop-blur-sm"
          style={{ borderTopColor: accent, borderTopWidth: 2 }}
        >
          <div className="text-[10px] font-bold leading-tight text-white">{name}</div>
          <div className="text-[8px] leading-tight text-white/55">{title}</div>
        </div>
        <div
          className="mt-0.5 h-1.5 w-1.5 rounded-full shadow"
          style={{
            background: dotColor,
            boxShadow: `0 0 6px ${dotColor}`,
          }}
        />
      </div>

      {/* Body */}
      <motion.svg
        width="60"
        height="84"
        viewBox="0 0 60 84"
        animate={bodyAnim}
        transition={bodyTrans}
        style={{ overflow: "visible" }}
      >
        {/* shadow */}
        <ellipse cx="30" cy="82" rx="16" ry="3" fill="rgba(0,0,0,0.35)" />

        {/* legs */}
        <rect x="22" y="58" width="7" height="20" rx="2" fill={pants} />
        <rect x="31" y="58" width="7" height="20" rx="2" fill={pants} />
        {/* shoes */}
        <rect x="20" y="76" width="11" height="5" rx="2" fill="#0b0f1a" />
        <rect x="29" y="76" width="11" height="5" rx="2" fill="#0b0f1a" />

        {/* torso / shirt */}
        <path
          d={`M16 38 Q16 34 20 33 L40 33 Q44 34 44 38 L44 60 Q30 64 16 60 Z`}
          fill={shirt}
        />
        {/* collar / tie for boss */}
        {role === "boss" && (
          <>
            <path d="M28 33 L30 38 L32 33 Z" fill="#fff" opacity="0.9" />
            <path d="M28.5 38 L30 50 L31.5 38 Z" fill={accent} />
          </>
        )}
        {role === "agent" && (
          <circle cx="30" cy="44" r="2.4" fill={accent} opacity="0.95" />
        )}

        {/* left arm */}
        <motion.g
          style={{ originX: "20px", originY: "38px" }}
          animate={armAnim}
          transition={armTrans}
        >
          <rect x="13" y="37" width="7" height="20" rx="3" fill={shirt} />
          <circle cx="16.5" cy="58" r="3.6" fill={skin} />
        </motion.g>
        {/* right arm */}
        <motion.g
          style={{ originX: "40px", originY: "38px" }}
          animate={{ rotate: isWorking ? [15, 45, 15] : isSuccess ? [10, 90, 10] : [10, 14, 10] }}
          transition={armTrans}
        >
          <rect x="40" y="37" width="7" height="20" rx="3" fill={shirt} />
          <circle cx="43.5" cy="58" r="3.6" fill={skin} />
        </motion.g>

        {/* neck */}
        <rect x="26" y="28" width="8" height="6" fill={skin} />

        {/* head */}
        <circle cx="30" cy="20" r="11" fill={skin} />
        {/* hair */}
        <path
          d={
            role === "boss"
              ? "M19 18 Q19 9 30 9 Q41 9 41 18 Q41 14 36 14 L24 14 Q19 14 19 18 Z"
              : role === "hermes"
                ? "M19 18 Q19 8 30 8 Q41 8 41 18 L40 18 Q40 12 30 12 Q20 12 20 18 Z"
                : "M20 17 Q20 9 30 9 Q40 9 40 17 Q34 13 30 13 Q26 13 20 17 Z"
          }
          fill={hair}
        />

        {/* glasses for boss */}
        {role === "boss" && (
          <g stroke="#0b0f1a" strokeWidth="1.2" fill="none">
            <circle cx="25.5" cy="21" r="2.6" fill="rgba(120,200,255,0.2)" />
            <circle cx="34.5" cy="21" r="2.6" fill="rgba(120,200,255,0.2)" />
            <line x1="28.1" y1="21" x2="31.9" y2="21" />
          </g>
        )}

        {/* eyes */}
        {!isError ? (
          <>
            <ellipse cx="25.5" cy="21" rx="1.2" ry={isWorking ? 0.6 : 1.4} fill="#0b0f1a" />
            <ellipse cx="34.5" cy="21" rx="1.2" ry={isWorking ? 0.6 : 1.4} fill="#0b0f1a" />
          </>
        ) : (
          <g stroke="#0b0f1a" strokeWidth="1.4" strokeLinecap="round">
            <line x1="24" y1="20" x2="27" y2="22" />
            <line x1="24" y1="22" x2="27" y2="20" />
            <line x1="33" y1="20" x2="36" y2="22" />
            <line x1="33" y1="22" x2="36" y2="20" />
          </g>
        )}

        {/* mouth */}
        {isSuccess ? (
          <path d="M26 25 Q30 29 34 25" stroke="#0b0f1a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        ) : isError ? (
          <path d="M26 27 Q30 24 34 27" stroke="#0b0f1a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        ) : (
          <line x1="27" y1="26" x2="33" y2="26" stroke="#0b0f1a" strokeWidth="1.2" strokeLinecap="round" />
        )}
      </motion.svg>

      {/* working indicator above head */}
      <AnimatePresence>
        {isWorking && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-3 right-2 flex gap-0.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block h-1.5 w-1.5 rounded-full"
                style={{ background: accent }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        )}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-3 right-1 text-base"
          >
            ✨
          </motion.div>
        )}
        {isError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-3 right-1 text-sm"
          >
            ⚠️
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────── Desk + Monitor ───────────────────── */

function Workstation({
  monitorContent,
  active = false,
  accent = "#22d3ee",
}: {
  monitorContent?: React.ReactNode;
  active?: boolean;
  accent?: string;
}) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Monitor */}
      <div
        className="relative w-[88px] rounded-md border-2 bg-[#0a0f1c] p-1 shadow-lg"
        style={{
          borderColor: active ? accent : "#1f2a44",
          boxShadow: active
            ? `0 0 18px ${accent}55, inset 0 0 0 1px rgba(255,255,255,0.04)`
            : "0 4px 10px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="h-[52px] w-full overflow-hidden rounded-sm"
          style={{
            background: active
              ? `linear-gradient(135deg, ${accent}33, ${accent}11)`
              : "linear-gradient(135deg,#0f172a,#1e293b)",
          }}
        >
          {monitorContent}
        </div>
        {/* power LED */}
        <div
          className="absolute bottom-0.5 right-1 h-1 w-1 rounded-full"
          style={{
            background: active ? accent : "#374151",
            boxShadow: active ? `0 0 4px ${accent}` : "none",
          }}
        />
      </div>
      {/* monitor stand */}
      <div className="h-2 w-3 bg-slate-700" />
      <div className="-mt-px h-1 w-10 rounded-sm bg-slate-800" />

      {/* desk */}
      <div className="relative -mt-0.5 h-[10px] w-[120px] rounded-sm bg-gradient-to-b from-amber-700 to-amber-900 shadow-md">
        <div className="absolute -top-[3px] left-2 h-[3px] w-3 rounded-sm bg-slate-300/80" />{" "}
        {/* keyboard */}
        <div className="absolute -top-[3px] right-3 h-[3px] w-1.5 rounded-full bg-slate-400/70" />{" "}
        {/* mouse */}
        <div className="absolute -top-[5px] right-9 h-[5px] w-[4px] rounded-sm bg-purple-500" />{" "}
        {/* mug */}
      </div>
      {/* desk legs */}
      <div className="flex w-[110px] justify-between">
        <div className="h-[18px] w-[3px] bg-amber-950" />
        <div className="h-[18px] w-[3px] bg-amber-950" />
      </div>
    </div>
  );
}

/* ───────────────────── Wall props ───────────────────── */

function WallScreen({
  title,
  status,
  color = "#22d3ee",
}: {
  title: string;
  status: HermesStatus;
  color?: string;
}) {
  const bars = [70, 45, 88, 60, 30, 75];
  return (
    <div
      className="relative w-[160px] rounded-lg border-2 border-slate-800 bg-[#06080f] p-2 shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
      style={{ boxShadow: `0 0 22px ${color}22, 0 6px 18px rgba(0,0,0,0.5)` }}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="font-mono text-[8px] font-bold tracking-wider" style={{ color }}>
          {title}
        </div>
        <div className="flex gap-0.5">
          <span className="h-1 w-1 rounded-full bg-red-500" />
          <span className="h-1 w-1 rounded-full bg-yellow-500" />
          <span className="h-1 w-1 rounded-full bg-green-500" />
        </div>
      </div>
      <div className="flex h-[42px] items-end gap-[3px] rounded-sm bg-slate-950/60 p-1">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ background: color, opacity: 0.75 }}
            animate={
              status === "working"
                ? { height: [`${h * 0.6}%`, `${h}%`, `${h * 0.7}%`] }
                : { height: `${h}%` }
            }
            transition={{
              duration: 1.4,
              repeat: status === "working" ? Infinity : 0,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <div className="mt-1 flex items-center gap-1">
        <span
          className="h-1 w-1 animate-pulse rounded-full"
          style={{ background: color }}
        />
        <span className="font-mono text-[7px] text-white/55">
          {status === "working" ? "RUNNING…" : status === "error" ? "ERROR" : "OK"}
        </span>
      </div>
    </div>
  );
}

function Whiteboard() {
  return (
    <div className="w-[110px] rounded-md border-2 border-slate-700 bg-slate-100 p-1.5 shadow-md">
      <div className="space-y-0.5">
        <div className="h-[3px] w-[80%] rounded-sm bg-rose-500/80" />
        <div className="h-[3px] w-[60%] rounded-sm bg-blue-500/80" />
        <div className="h-[3px] w-[70%] rounded-sm bg-emerald-500/80" />
        <div className="h-[3px] w-[40%] rounded-sm bg-amber-500/80" />
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-0.5">
        <div className="h-[10px] rounded-sm bg-yellow-300" />
        <div className="h-[10px] rounded-sm bg-pink-300" />
        <div className="h-[10px] rounded-sm bg-cyan-300" />
      </div>
    </div>
  );
}

function Plant({ size = 32 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div
        className="rounded-sm bg-emerald-600"
        style={{ width: size * 0.9, height: size * 0.5, clipPath: "polygon(15% 100%, 0 40%, 30% 0, 70% 0, 100% 40%, 85% 100%)" }}
      />
      <div
        className="-mt-1 rounded-b-md bg-amber-800"
        style={{ width: size * 0.55, height: size * 0.32 }}
      />
    </div>
  );
}

/* ───────────────────── Main Scene ───────────────────── */

export function IsometricScene({ status }: { status: HermesStatus }) {
  const dotColor =
    status === "working"
      ? "bg-yellow-400"
      : status === "success"
        ? "bg-green-400"
        : status === "error"
          ? "bg-red-400"
          : "bg-slate-400";

  return (
    <div
      className="relative h-[460px] overflow-hidden rounded-3xl border border-white/10 shadow-pop sm:h-[580px]"
      style={{
        background:
          "linear-gradient(180deg,#1a2540 0%,#0f1729 50%,#0a1020 100%)",
      }}
    >
      {/* ── Status pill (top-left) ── */}
      <div className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-bold text-white shadow backdrop-blur">
        <span className={`h-2 w-2 rounded-full ${dotColor} ${status === "working" ? "animate-pulse" : ""}`} />
        {STATUS_TEXT[status]}
      </div>

      {/* ── BACK WALL ── */}
      <div
        className="absolute left-0 right-0 top-0 h-[58%]"
        style={{
          background:
            "linear-gradient(180deg,#243456 0%,#1a2746 70%,#16213e 100%)",
        }}
      >
        {/* wall trim */}
        <div className="absolute bottom-0 left-0 right-0 h-[6px] bg-slate-800" />
        {/* window frame */}
        <div className="absolute right-[6%] top-[8%] w-[140px] rounded-md border-[3px] border-slate-700 bg-gradient-to-b from-sky-300/40 to-indigo-500/30 p-1 shadow-inner">
          <div className="grid h-[80px] grid-cols-2 gap-1">
            <div className="rounded-sm bg-gradient-to-b from-sky-200/60 to-sky-400/30" />
            <div className="rounded-sm bg-gradient-to-b from-sky-200/60 to-sky-400/30" />
            <div className="rounded-sm bg-gradient-to-b from-sky-200/60 to-sky-400/30" />
            <div className="rounded-sm bg-gradient-to-b from-sky-200/60 to-sky-400/30" />
          </div>
          {/* tiny city */}
          <div className="absolute bottom-1 left-1 right-1 flex items-end gap-0.5">
            <div className="h-3 w-1.5 bg-slate-900/70" />
            <div className="h-5 w-1.5 bg-slate-900/70" />
            <div className="h-2 w-1.5 bg-slate-900/70" />
            <div className="h-4 w-1.5 bg-slate-900/70" />
            <div className="h-6 w-1.5 bg-slate-900/70" />
            <div className="h-3 w-1.5 bg-slate-900/70" />
          </div>
        </div>

        {/* wall clock */}
        <div className="absolute right-[34%] top-[10%] h-9 w-9 rounded-full border-2 border-slate-700 bg-slate-100 shadow">
          <div className="absolute left-1/2 top-1/2 h-[1.5px] w-[10px] -translate-x-px -translate-y-1/2 origin-left rotate-[-30deg] bg-slate-900" />
          <div className="absolute left-1/2 top-1/2 h-[1px] w-[12px] -translate-x-px -translate-y-1/2 origin-left rotate-[60deg] bg-slate-900" />
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900" />
        </div>

        {/* dashboard screens */}
        <div className="absolute left-[8%] top-[12%]">
          <WallScreen title="HERMES // DASHBOARD" status={status} color="#22d3ee" />
        </div>
        <div className="absolute left-[36%] top-[42%]">
          <Whiteboard />
        </div>
      </div>

      {/* ── FLOOR ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[42%]"
        style={{
          background:
            "linear-gradient(180deg,#3a2a1a 0%,#2a1d10 60%,#1a1108 100%)",
        }}
      >
        {/* floor planks */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.35) 0 1px, transparent 1px 60px)",
          }}
        />
        {/* carpet */}
        <div
          className="absolute bottom-2 left-1/2 h-[60%] w-[60%] -translate-x-1/2 rounded-md border-2 border-rose-900/60"
          style={{
            background:
              "repeating-linear-gradient(45deg,#7f1d1d 0 6px,#991b1b 6px 12px)",
            opacity: 0.7,
          }}
        />
      </div>

      {/* ─── BOSS (back-left, behind big desk) ─── */}
      <div className="absolute left-[14%] top-[34%] z-10">
        <Character
          role="boss"
          name="คุณบอส"
          title="CEO · Manager"
          status={status}
          accent="#f59e0b"
          hair="#1f2937"
          shirt="#1e3a8a"
          pants="#0f172a"
        />
      </div>
      {/* boss desk (bigger / executive) */}
      <div className="absolute left-[10%] top-[58%] z-[5]">
        <Workstation
          accent="#f59e0b"
          active={false}
          monitorContent={
            <div className="flex h-full flex-col justify-center px-1">
              <div className="font-mono text-[6px] font-bold text-amber-300/90">REPORTS</div>
              <div className="mt-0.5 h-0.5 w-[70%] bg-amber-400/60" />
              <div className="mt-0.5 h-0.5 w-[50%] bg-amber-400/40" />
              <div className="mt-0.5 h-0.5 w-[80%] bg-amber-400/60" />
            </div>
          }
        />
      </div>

      {/* ─── HERMES (center, the orchestrator) ─── */}
      <div className="absolute left-1/2 top-[36%] z-10 -translate-x-1/2">
        <Character
          role="hermes"
          name="Hermes"
          title="AI Orchestrator"
          status={status}
          accent="#22d3ee"
          hair="#0e7490"
          shirt="#0891b2"
          pants="#0f172a"
        />
      </div>
      <div className="absolute left-1/2 top-[60%] z-[5] -translate-x-1/2">
        <Workstation
          accent="#22d3ee"
          active={status === "working" || status === "success"}
          monitorContent={
            <div className="flex h-full flex-col justify-center px-1 font-mono text-[6px] leading-tight">
              {status === "working" ? (
                <>
                  <div className="text-cyan-300">$ exec task…</div>
                  <motion.div
                    className="text-cyan-200/80"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ▮▮▮▮▮░░░ 62%
                  </motion.div>
                  <div className="text-emerald-300/80">▶ orchestrating</div>
                </>
              ) : status === "success" ? (
                <>
                  <div className="text-emerald-300">✓ task done</div>
                  <div className="text-emerald-200/70">+1 completed</div>
                </>
              ) : status === "error" ? (
                <>
                  <div className="text-red-400">✗ ERROR</div>
                  <div className="text-red-300/70">retry?</div>
                </>
              ) : (
                <>
                  <div className="text-cyan-300">$ idle</div>
                  <div className="text-cyan-200/60">awaiting cmd</div>
                  <div className="text-cyan-200/40">_</div>
                </>
              )}
            </div>
          }
        />
      </div>

      {/* ─── AGENT 2 (right) ─── */}
      <div className="absolute right-[14%] top-[36%] z-10">
        <Character
          role="agent"
          name="Agent · Atlas"
          title="Research"
          status={status === "working" ? "working" : "idle"}
          accent="#22c55e"
          hair="#7c2d12"
          shirt="#15803d"
          pants="#1f2937"
        />
      </div>
      <div className="absolute right-[10%] top-[60%] z-[5]">
        <Workstation
          accent="#22c55e"
          active={status === "working"}
          monitorContent={
            <div className="flex h-full flex-col justify-center px-1 font-mono text-[6px]">
              <div className="text-emerald-300">SEARCH</div>
              <div className="mt-0.5 h-0.5 w-[60%] bg-emerald-400/60" />
              <div className="mt-0.5 h-0.5 w-[80%] bg-emerald-400/50" />
              <div className="mt-0.5 h-0.5 w-[45%] bg-emerald-400/40" />
            </div>
          }
        />
      </div>

      {/* ─── AGENT 3 (front-left) ─── */}
      <div className="absolute left-[34%] top-[64%] z-[12]">
        <Character
          role="agent"
          name="Agent · Iris"
          title="Writer"
          status={status === "working" ? "working" : "idle"}
          accent="#a855f7"
          hair="#581c87"
          shirt="#7e22ce"
          pants="#1f2937"
        />
      </div>

      {/* ─── Plants ─── */}
      <div className="absolute bottom-2 left-2 z-[6]">
        <Plant size={42} />
      </div>
      <div className="absolute bottom-2 right-2 z-[6]">
        <Plant size={42} />
      </div>
      <div className="absolute top-[55%] left-[2%] z-[6]">
        <Plant size={28} />
      </div>

      {/* ─── Connection beam: Boss -> Hermes -> Agents (when working) ─── */}
      <AnimatePresence>
        {status === "working" && (
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-[15]"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="beam" x1="0" x2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 18 42 Q 35 30 50 42 T 82 42"
              stroke="url(#beam)"
              strokeWidth="0.4"
              fill="none"
              strokeDasharray="2 2"
              animate={{ strokeDashoffset: [0, -8] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* ─── Floating spec dust (ambient) ─── */}
      <div className="pointer-events-none absolute inset-0 z-[2]">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-300/30"
            style={{
              left: `${15 + i * 13}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
            animate={{ y: [0, -10, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
