import { motion } from "framer-motion";
import type { HermesStatus } from "@/lib/hermes-types";

const statusText: Record<HermesStatus, string> = {
  idle: "พร้อมทำงาน",
  working: "กำลังประมวลผล",
  success: "งานสำเร็จ",
  error: "ต้องตรวจสอบ",
};

function Cube({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`absolute rounded-sm shadow-soft ${className}`}>{children}</div>;
}

function Desk({ className = "" }: { className?: string }) {
  return (
    <div className={`office-item desk ${className}`}>
      <Cube className="desk-top" />
      <Cube className="desk-leg desk-leg-a" />
      <Cube className="desk-leg desk-leg-b" />
      <Cube className="desk-leg desk-leg-c" />
      <Cube className="monitor">
        <div className="monitor-screen">
          <span />
          <span />
          <span />
        </div>
      </Cube>
      <Cube className="keyboard" />
      <Cube className="chair" />
    </div>
  );
}

function Sofa({ className = "" }: { className?: string }) {
  return (
    <div className={`office-item sofa ${className}`}>
      <Cube className="sofa-base" />
      <Cube className="sofa-back" />
      <Cube className="sofa-arm sofa-arm-a" />
      <Cube className="sofa-arm sofa-arm-b" />
    </div>
  );
}

function Plant({ className = "" }: { className?: string }) {
  return (
    <div className={`office-item plant ${className}`}>
      <Cube className="plant-pot" />
      <Cube className="leaf leaf-a" />
      <Cube className="leaf leaf-b" />
      <Cube className="leaf leaf-c" />
    </div>
  );
}

function VoxelCharacter({
  className = "",
  name,
  role,
  status = "idle",
  variant = "hermes",
}: {
  className?: string;
  name: string;
  role: string;
  status?: HermesStatus;
  variant?: "hermes" | "boss" | "agent";
}) {
  return (
    <motion.div
      className={`office-item character ${variant} ${className}`}
      animate={
        status === "working"
          ? { y: [0, -5, 0], rotate: [-1, 1, -1] }
          : status === "success"
            ? { y: [0, -18, 0], scale: [1, 1.08, 1] }
            : status === "error"
              ? { x: [0, -5, 5, -3, 3, 0] }
              : { y: [0, -4, 0] }
      }
      transition={{ duration: status === "working" ? 0.45 : 2.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="name-label">
        <span>{name}</span>
        <small>{role}</small>
        <i className={`status-dot ${status}`} />
      </div>
      <Cube className="char-shadow" />
      <Cube className="char-leg char-leg-a" />
      <Cube className="char-leg char-leg-b" />
      <Cube className="char-body" />
      <Cube className="char-arm char-arm-a" />
      <Cube className="char-arm char-arm-b" />
      <Cube className="char-head">
        <span className="eye eye-a" />
        <span className="eye eye-b" />
        {variant === "hermes" && <span className="headset" />}
      </Cube>
    </motion.div>
  );
}

export function IsometricScene({ status }: { status: HermesStatus }) {
  return (
    <div className="relative h-[420px] min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-pop sm:h-[580px]">
      <div className="office-scene-backdrop absolute inset-0" />
      <div className="office-scene" aria-label="ห้องออฟฟิศ 3D พร้อมตัวละคร voxel">
        <div className="wall wall-left">
          <div className="dashboard-screen">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="wall-picture picture-a" />
        </div>
        <div className="wall wall-back">
          <div className="dashboard-screen back-screen">
            <span />
            <span />
            <span />
          </div>
          <div className="wall-picture picture-b" />
          <div className="wall-picture picture-c" />
        </div>
        <div className="floor-grid" />
        <div className="carpet" />

        <Desk className="desk-main" />
        <Desk className="desk-agent-a" />
        <Desk className="desk-agent-b" />
        <Sofa className="sofa-a" />
        <Cube className="coffee-table" />
        <Cube className="pingpong-table">
          <span />
        </Cube>
        <Cube className="fridge" />
        <Cube className="divider divider-a" />
        <Plant className="plant-a" />
        <Plant className="plant-b" />
        <Plant className="plant-c" />

        <VoxelCharacter className="hermes-char" name="Hermes" role="Orchestrator" status={status} variant="hermes" />
        <VoxelCharacter className="boss-char" name="เจ้านาย" role="Manager" status="idle" variant="boss" />
        <VoxelCharacter className="agent-char" name="Agent 2" role="Assistant" status="idle" variant="agent" />
      </div>

      <div className="absolute left-4 top-4 z-20 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-bold text-foreground shadow-soft backdrop-blur">
        สถานะ Hermes · {statusText[status]}
      </div>
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-background/10 bg-foreground/70 px-3 py-1.5 text-xs font-bold text-background backdrop-blur-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-status-success" />
        3 Agents
      </div>
    </div>
  );
}
