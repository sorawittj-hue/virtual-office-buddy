import { useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera, Html } from "@react-three/drei";
import * as THREE from "three";
import type { HermesStatus } from "@/lib/hermes-types";
import type { RootState } from "@react-three/fiber";

// ─── Primitive helpers ──────────────────────────────────────────────────────

function Box({
  pos,
  size,
  color,
  emissive,
  emissiveIntensity = 0,
  roughness = 0.85,
  metalness = 0.05,
}: {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={emissive ?? color}
        emissiveIntensity={emissiveIntensity}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
}

// ─── Floor ──────────────────────────────────────────────────────────────────

function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#0d0d1e" roughness={1} />
      </mesh>
      <gridHelper args={[18, 18, "#1a1a3a", "#1a1a3a"]} position={[0, 0, 0]} />
      {/* Carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#1a1040" roughness={1} />
      </mesh>
    </group>
  );
}

// ─── Walls ──────────────────────────────────────────────────────────────────

function Walls() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 3, -9]} receiveShadow>
        <planeGeometry args={[18, 6]} />
        <meshStandardMaterial color="#10102a" roughness={1} />
      </mesh>
      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-9, 3, 0]} receiveShadow>
        <planeGeometry args={[18, 6]} />
        <meshStandardMaterial color="#0e0e26" roughness={1} />
      </mesh>
      {/* Wall screen back */}
      <group position={[-2, 3.5, -8.8]}>
        <Box
          pos={[0, 0, 0]}
          size={[3, 1.8, 0.06]}
          color="#080818"
          roughness={0.2}
          metalness={0.3}
        />
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[2.7, 1.5]} />
          <meshStandardMaterial
            color="#1e3a8a"
            emissive="#1d4ed8"
            emissiveIntensity={0.45}
            roughness={0}
          />
        </mesh>
      </group>
      {/* Wall screen left */}
      <group position={[-8.8, 3.5, -1]} rotation={[0, Math.PI / 2, 0]}>
        <Box
          pos={[0, 0, 0]}
          size={[2.5, 1.6, 0.06]}
          color="#080818"
          roughness={0.2}
          metalness={0.3}
        />
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[2.2, 1.3]} />
          <meshStandardMaterial
            color="#14532d"
            emissive="#16a34a"
            emissiveIntensity={0.3}
            roughness={0}
          />
        </mesh>
      </group>
    </group>
  );
}

// ─── Furniture ──────────────────────────────────────────────────────────────

function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table top */}
      <Box pos={[0, 0.78, 0]} size={[2.4, 0.09, 1.1]} color="#5c3d11" />
      {/* Legs */}
      {(
        [
          [-1.1, 0.38, -0.45],
          [1.1, 0.38, -0.45],
          [-1.1, 0.38, 0.45],
          [1.1, 0.38, 0.45],
        ] as [number, number, number][]
      ).map((p, i) => (
        <Box key={i} pos={p} size={[0.09, 0.76, 0.09]} color="#3d2a0a" />
      ))}
      {/* Monitor */}
      <Box
        pos={[0, 1.5, -0.38]}
        size={[1.15, 0.72, 0.06]}
        color="#08081a"
        roughness={0.15}
        metalness={0.4}
      />
      <Box pos={[0, 0.86, -0.38]} size={[0.12, 0.14, 0.06]} color="#1a1a2e" />
      {/* Monitor glow screen */}
      <mesh position={[0, 1.5, -0.34]}>
        <planeGeometry args={[0.95, 0.57]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#2563eb"
          emissiveIntensity={0.55}
          roughness={0}
        />
      </mesh>
      {/* Keyboard */}
      <Box pos={[0, 0.84, 0.2]} size={[0.85, 0.03, 0.32]} color="#131326" />
      {/* Mouse */}
      <Box pos={[0.58, 0.84, 0.2]} size={[0.16, 0.03, 0.22]} color="#131326" />
      {/* Coffee mug */}
      <Box pos={[-0.7, 0.86, 0.15]} size={[0.13, 0.16, 0.13]} color="#7c3aed" roughness={0.5} />
    </group>
  );
}

function Chair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Box pos={[0, 0.5, 0]} size={[0.62, 0.06, 0.62]} color="#1e1e3a" />
      <Box pos={[0, 0.88, -0.28]} size={[0.62, 0.68, 0.07]} color="#1e1e3a" />
      <Box pos={[0, 0.25, 0]} size={[0.07, 0.5, 0.07]} color="#444466" />
      <Box pos={[-0.25, 0.5, 0.25]} size={[0.07, 0.06, 0.07]} color="#333" />
      <Box pos={[0.25, 0.5, 0.25]} size={[0.07, 0.06, 0.07]} color="#333" />
      <Box pos={[-0.25, 0.5, -0.25]} size={[0.07, 0.06, 0.07]} color="#333" />
      <Box pos={[0.25, 0.5, -0.25]} size={[0.07, 0.06, 0.07]} color="#333" />
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Box pos={[0, 0.22, 0]} size={[0.32, 0.44, 0.32]} color="#1a3a26" />
      <Box pos={[0, 0.65, 0]} size={[0.52, 0.44, 0.52]} color="#1e5c34" />
      <Box pos={[0, 0.97, 0]} size={[0.38, 0.34, 0.38]} color="#27a349" />
      <Box pos={[0.22, 0.88, 0]} size={[0.28, 0.18, 0.2]} color="#22c55e" />
      <Box pos={[-0.22, 0.88, 0]} size={[0.28, 0.18, 0.2]} color="#22c55e" />
    </group>
  );
}

function Sofa({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Box pos={[0, 0.32, 0]} size={[2, 0.38, 0.9]} color="#2d1b69" />
      <Box pos={[0, 0.72, -0.42]} size={[2, 0.72, 0.09]} color="#2d1b69" />
      <Box pos={[-0.96, 0.58, 0]} size={[0.09, 0.55, 0.9]} color="#251660" />
      <Box pos={[0.96, 0.58, 0]} size={[0.09, 0.55, 0.9]} color="#251660" />
      <Box pos={[-0.5, 0.62, 0.35]} size={[0.28, 0.22, 0.18]} color="#3b2280" />
      <Box pos={[0.5, 0.62, 0.35]} size={[0.28, 0.22, 0.18]} color="#3b2280" />
    </group>
  );
}

function CoffeeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Box pos={[0, 0.45, 0]} size={[0.9, 0.07, 0.55]} color="#5c3d11" />
      {(
        [
          [-0.38, 0.22, -0.2],
          [0.38, 0.22, -0.2],
          [-0.38, 0.22, 0.2],
          [0.38, 0.22, 0.2],
        ] as [number, number, number][]
      ).map((p, i) => (
        <Box key={i} pos={p} size={[0.06, 0.44, 0.06]} color="#3d2a0a" />
      ))}
    </group>
  );
}

// ─── Voxel Character ────────────────────────────────────────────────────────

function VoxelCharacter({
  position,
  bodyColor,
  shirtColor,
  name,
  role,
  status = "idle",
}: {
  position: [number, number, number];
  bodyColor: string;
  shirtColor: string;
  name: string;
  role: string;
  status?: HermesStatus;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const base = position[1];

    if (status === "working") {
      groupRef.current.position.y = base + Math.sin(t * 4.5) * 0.13;
      groupRef.current.rotation.y = Math.sin(t * 2) * 0.12;
      if (armLRef.current) armLRef.current.rotation.x = Math.sin(t * 4.5) * 0.5;
      if (armRRef.current) armRRef.current.rotation.x = -Math.sin(t * 4.5) * 0.5;
    } else if (status === "success") {
      groupRef.current.position.y = base + Math.abs(Math.sin(t * 3.5)) * 0.35;
      groupRef.current.rotation.y = t * 1.5;
    } else if (status === "error") {
      groupRef.current.position.x = position[0] + Math.sin(t * 14) * 0.1;
      groupRef.current.position.y = base;
    } else {
      // idle: gentle float
      groupRef.current.position.y = base + Math.sin(t * 0.85) * 0.06;
      groupRef.current.position.x = position[0];
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.1;
      if (armLRef.current) armLRef.current.rotation.x = Math.sin(t * 0.85) * 0.15;
      if (armRRef.current) armRRef.current.rotation.x = -Math.sin(t * 0.85) * 0.15;
    }
  });

  const dotColor =
    status === "working"
      ? "#f59e0b"
      : status === "success"
        ? "#22c55e"
        : status === "error"
          ? "#ef4444"
          : "#6b7280";

  return (
    <group ref={groupRef} position={position}>
      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.35, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>

      {/* Shoes */}
      <Box pos={[-0.13, 0.07, 0.09]} size={[0.19, 0.13, 0.3]} color="#111122" />
      <Box pos={[0.13, 0.07, 0.09]} size={[0.19, 0.13, 0.3]} color="#111122" />

      {/* Legs */}
      <Box pos={[-0.13, 0.37, 0]} size={[0.2, 0.44, 0.22]} color={bodyColor} />
      <Box pos={[0.13, 0.37, 0]} size={[0.2, 0.44, 0.22]} color={bodyColor} />

      {/* Body / shirt */}
      <Box pos={[0, 0.83, 0]} size={[0.52, 0.55, 0.3]} color={shirtColor} />

      {/* Arms */}
      <mesh ref={armLRef} position={[-0.36, 0.81, 0]} castShadow>
        <boxGeometry args={[0.17, 0.5, 0.2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} />
      </mesh>
      <mesh ref={armRRef} position={[0.36, 0.81, 0]} castShadow>
        <boxGeometry args={[0.17, 0.5, 0.2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} />
      </mesh>

      {/* Neck */}
      <Box pos={[0, 1.15, 0]} size={[0.18, 0.13, 0.18]} color={bodyColor} />

      {/* Head */}
      <Box pos={[0, 1.43, 0]} size={[0.44, 0.44, 0.41]} color={bodyColor} />

      {/* Eyes */}
      <mesh position={[-0.11, 1.46, 0.22]}>
        <boxGeometry args={[0.1, 0.1, 0.01]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.11, 1.46, 0.22]}>
        <boxGeometry args={[0.1, 0.1, 0.01]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>

      {/* Status dot */}
      <mesh position={[0.28, 1.6, 0.18]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color={dotColor} emissive={dotColor} emissiveIntensity={1.5} />
      </mesh>

      {/* Name label */}
      <Html position={[0, 2.02, 0]} center distanceFactor={9}>
        <div
          style={{
            background: "rgba(8,8,24,0.88)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "4px 12px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 12, color: "#fff", letterSpacing: "0.02em" }}>
            {name}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{role}</div>
        </div>
      </Html>
    </group>
  );
}

// ─── Main Scene ─────────────────────────────────────────────────────────────

const STATUS_TEXT: Record<HermesStatus, string> = {
  idle: "พร้อมทำงาน",
  working: "กำลังประมวลผล…",
  success: "งานสำเร็จ ✓",
  error: "พบข้อผิดพลาด",
};

function checkWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/* ── CSS 2D Fallback Office ─────────────────────────────────────────────── */

function FallbackOffice({ status }: { status: HermesStatus }) {
  const dotColor =
    status === "working"
      ? "bg-yellow-400"
      : status === "success"
        ? "bg-green-400"
        : status === "error"
          ? "bg-red-400"
          : "bg-gray-400";
  const charAnim =
    status === "working"
      ? "animate-bounce"
      : status === "success"
        ? "animate-pulse"
        : status === "error"
          ? "animate-ping"
          : "";

  return (
    <div className="relative h-[420px] sm:h-[560px] rounded-3xl overflow-hidden border border-border shadow-pop bg-gradient-to-br from-[#07071a] via-[#0d0d2e] to-[#1a1040]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floor perspective */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[55%]"
        style={{ background: "linear-gradient(to top, rgba(26,16,64,0.5), transparent)" }}
      />

      {/* Back wall screen */}
      <div className="absolute top-[12%] left-[15%] w-[120px] h-[70px] rounded-lg border border-blue-500/30 bg-blue-900/40 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-800/20 flex items-center justify-center">
          <div className="text-blue-400/60 text-[10px] font-mono">DASHBOARD</div>
        </div>
      </div>

      {/* Left wall screen */}
      <div className="absolute top-[15%] left-[5%] w-[80px] h-[55px] rounded-lg border border-green-500/30 bg-green-900/30 shadow-[0_0_20px_rgba(22,163,74,0.15)]">
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-green-600/20 to-green-800/20 flex items-center justify-center">
          <div className="text-green-400/60 text-[8px] font-mono">STATUS</div>
        </div>
      </div>

      {/* Desk 1 */}
      <div className="absolute bottom-[32%] left-[20%] w-[100px] h-[12px] rounded bg-amber-900/70 shadow-lg" />
      <div className="absolute bottom-[34%] left-[28%] w-[45px] h-[30px] rounded border border-blue-500/30 bg-[#08081a] shadow-[0_0_15px_rgba(59,130,246,0.2)]">
        <div className="w-[85%] h-[80%] mx-auto mt-[2px] rounded-sm bg-blue-500/30" />
      </div>
      <div className="absolute bottom-[32%] left-[35%] w-[8px] h-[3px] rounded-sm bg-gray-700" />

      {/* Desk 2 */}
      <div className="absolute bottom-[45%] right-[22%] w-[90px] h-[10px] rounded bg-amber-900/60 shadow-lg" />
      <div className="absolute bottom-[47%] right-[30%] w-[40px] h-[26px] rounded border border-blue-500/20 bg-[#08081a] shadow-[0_0_12px_rgba(59,130,246,0.15)]">
        <div className="w-[85%] h-[80%] mx-auto mt-[2px] rounded-sm bg-blue-500/25" />
      </div>

      {/* Sofa */}
      <div className="absolute bottom-[22%] right-[12%] w-[80px] h-[20px] rounded-lg bg-purple-900/60 border border-purple-700/30" />
      <div className="absolute bottom-[27%] right-[12%] w-[80px] h-[12px] rounded-t-lg bg-purple-900/50" />

      {/* Plants */}
      {[
        { left: "8%", bottom: "18%" },
        { right: "8%", bottom: "18%" },
        { left: "6%", bottom: "55%" },
        { right: "6%", bottom: "50%" },
      ].map((pos, i) => (
        <div key={i} className="absolute w-[22px]" style={{ ...pos }}>
          <div className="w-3 h-5 mx-auto rounded-t bg-green-600/70" />
          <div className="w-4 h-4 mx-auto -mt-1 rounded-t bg-green-500/60" />
          <div className="w-3 h-3 mx-auto rounded bg-green-800/60" />
        </div>
      ))}

      {/* Coffee table */}
      <div className="absolute bottom-[20%] right-[18%] w-[35px] h-[6px] rounded bg-amber-900/50" />

      {/* ── Characters ── */}
      {/* Hermes */}
      <div className={`absolute bottom-[28%] left-[24%] flex flex-col items-center ${charAnim}`}>
        <div className="bg-black/70 backdrop-blur rounded-lg px-2 py-0.5 mb-1 border border-white/10">
          <div className="text-[10px] font-bold text-white">Hermes</div>
          <div className="text-[8px] text-white/40">Orchestrator</div>
        </div>
        <div className="relative">
          <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${dotColor}`} />
          <div className="w-[18px] h-[18px] rounded-sm bg-purple-600" />
          <div className="w-[22px] h-[22px] rounded-sm bg-purple-500 mx-auto -mt-1" />
          <div className="flex gap-[2px] mx-auto w-[18px] -mt-0.5">
            <div className="w-2 h-4 rounded-sm bg-purple-700" />
            <div className="w-2 h-4 rounded-sm bg-purple-700" />
          </div>
        </div>
      </div>

      {/* Boss */}
      <div className="absolute bottom-[38%] right-[28%] flex flex-col items-center">
        <div className="bg-black/70 backdrop-blur rounded-lg px-2 py-0.5 mb-1 border border-white/10">
          <div className="text-[10px] font-bold text-white">เจ้านาย</div>
          <div className="text-[8px] text-white/40">Manager</div>
        </div>
        <div className="relative">
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gray-400" />
          <div className="w-[18px] h-[18px] rounded-sm bg-sky-700" />
          <div className="w-[22px] h-[22px] rounded-sm bg-sky-600 mx-auto -mt-1" />
          <div className="flex gap-[2px] mx-auto w-[18px] -mt-0.5">
            <div className="w-2 h-4 rounded-sm bg-sky-800" />
            <div className="w-2 h-4 rounded-sm bg-sky-800" />
          </div>
        </div>
      </div>

      {/* Agent 2 */}
      <div className="absolute bottom-[16%] right-[15%] flex flex-col items-center">
        <div className="bg-black/70 backdrop-blur rounded-lg px-2 py-0.5 mb-1 border border-white/10">
          <div className="text-[10px] font-bold text-white">Agent 2</div>
          <div className="text-[8px] text-white/40">Assistant</div>
        </div>
        <div className="relative">
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gray-400" />
          <div className="w-[18px] h-[18px] rounded-sm bg-emerald-700" />
          <div className="w-[22px] h-[22px] rounded-sm bg-emerald-600 mx-auto -mt-1" />
          <div className="flex gap-[2px] mx-auto w-[18px] -mt-0.5">
            <div className="w-2 h-4 rounded-sm bg-emerald-800" />
            <div className="w-2 h-4 rounded-sm bg-emerald-800" />
          </div>
        </div>
      </div>

      {/* Overlay badges */}
      <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-bold text-white shadow backdrop-blur">
        <span
          className={`h-2 w-2 rounded-full ${dotColor} ${status === "working" ? "animate-pulse" : ""}`}
        />
        {STATUS_TEXT[status]}
      </div>
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />3 Agents Online
      </div>
    </div>
  );
}

export function IsometricScene({ status }: { status: HermesStatus }) {
  const [useFallback, setUseFallback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCreated = useCallback((state: RootState) => {
    const canvas = state.gl.domElement;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      setUseFallback(true);
    });

    // Check after a short delay if the canvas actually rendered something
    setTimeout(() => {
      try {
        const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (!ctx || ctx.isContextLost()) {
          setUseFallback(true);
        }
      } catch {
        setUseFallback(true);
      }
    }, 1000);
  }, []);

  if (useFallback) {
    return <FallbackOffice status={status} />;
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[420px] sm:h-[560px] rounded-3xl overflow-hidden border border-border shadow-pop"
    >
      {/* Overlay badges */}
      <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-bold text-white shadow backdrop-blur">
        <span
          className={`h-2 w-2 rounded-full ${
            status === "working"
              ? "animate-pulse bg-yellow-400"
              : status === "success"
                ? "bg-green-400"
                : status === "error"
                  ? "bg-red-400"
                  : "bg-white/40"
          }`}
        />
        {STATUS_TEXT[status]}
      </div>
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />3 Agents Online
      </div>

      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: false,
          alpha: false,
        }}
        onCreated={handleCreated}
        style={{ background: "#07071a" }}
      >
        <OrthographicCamera makeDefault position={[10, 10, 10]} zoom={42} near={0.1} far={200} />
        <ambientLight intensity={0.7} color="#8080ff" />
        <directionalLight position={[6, 12, 6]} intensity={1.4} />
        <pointLight position={[-4, 4, 4]} intensity={0.4} color="#5b8dee" />
        <pointLight position={[4, 2, -4]} intensity={0.25} color="#a855f7" />
        <Floor />
        <Walls />
        <Desk position={[-2, 0, 0]} />
        <Chair position={[-2, 0, 1.3]} />
        <Desk position={[2.5, 0, -2.5]} />
        <Chair position={[2.5, 0, -1.2]} />
        <Sofa position={[4, 0, 2.5]} />
        <CoffeeTable position={[4, 0, 1.2]} />
        <Plant position={[-6, 0, -6]} />
        <Plant position={[6, 0, -6]} />
        <Plant position={[6.5, 0, 5]} />
        <Plant position={[-6, 0, 5]} />
        <VoxelCharacter
          position={[-2, 0, -0.6]}
          bodyColor="#5b21b6"
          shirtColor="#7c3aed"
          name="Hermes"
          role="Orchestrator"
          status={status}
        />
        <VoxelCharacter
          position={[2.5, 0, 0.8]}
          bodyColor="#075985"
          shirtColor="#0369a1"
          name="เจ้านาย"
          role="Manager"
          status="idle"
        />
        <VoxelCharacter
          position={[5, 0, 4]}
          bodyColor="#065f46"
          shirtColor="#047857"
          name="Agent 2"
          role="Assistant"
          status="idle"
        />
      </Canvas>
    </div>
  );
}
