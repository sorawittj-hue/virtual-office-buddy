import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { HermesStatus } from "@/lib/hermes-types";

// ─── Room ────────────────────────────────────────────────────────────────────

function Floor() {
  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshLambertMaterial color="#d6c4a0" />
      </mesh>
      {/* Carpet area (lounge) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.5, 0.01, -2]}>
        <planeGeometry args={[5, 4]} />
        <meshLambertMaterial color="#b8a8d8" />
      </mesh>
      {/* Subtle floor tile lines */}
      <gridHelper args={[22, 11, "#bba878", "#bba878"]} position={[0, 0.005, 0]} />
    </group>
  );
}

function Walls() {
  return (
    <group>
      {/* Left wall */}
      <mesh position={[-11, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.25, 5, 22]} />
        <meshLambertMaterial color="#9898aa" />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 2.5, -11]} receiveShadow>
        <boxGeometry args={[22, 5, 0.25]} />
        <meshLambertMaterial color="#888898" />
      </mesh>
      {/* Wall base trim – left */}
      <mesh position={[-10.88, 0.15, 0]}>
        <boxGeometry args={[0.02, 0.3, 22]} />
        <meshLambertMaterial color="#c8c8d8" />
      </mesh>
      {/* Wall base trim – back */}
      <mesh position={[0, 0.15, -10.88]}>
        <boxGeometry args={[22, 0.3, 0.02]} />
        <meshLambertMaterial color="#c8c8d8" />
      </mesh>
    </group>
  );
}

// ─── Wall decorations ─────────────────────────────────────────────────────────

function WallScreen({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[2.8, 1.6, 0.1]} />
        <meshLambertMaterial color="#111" />
      </mesh>
      {/* Screen glow */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[2.6, 1.45]} />
        <meshBasicMaterial color="#0b1f3a" />
      </mesh>
      {/* Fake chart bars on screen */}
      {[[-0.9, 0.15], [-0.5, -0.1], [-0.1, 0.3], [0.3, 0], [0.7, 0.2]].map(([x, h], i) => (
        <mesh key={i} position={[x, h / 2 - 0.2, 0.07]}>
          <planeGeometry args={[0.25, 0.4 + Math.abs(h)]} />
          <meshBasicMaterial color={["#4488ff", "#44cc88", "#ffaa44", "#ff6688", "#aa88ff"][i]} />
        </mesh>
      ))}
    </group>
  );
}

function WallPicture({ position, rotation, color = "#7799bb" }: { position: [number, number, number]; rotation: [number, number, number]; color?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.9, 0.08]} />
        <meshLambertMaterial color="#5a3e28" />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[1.05, 0.75]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// ─── Furniture ───────────────────────────────────────────────────────────────

function Desk({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Surface */}
      <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.07, 1.0]} />
        <meshLambertMaterial color="#8b6410" />
      </mesh>
      {/* Legs */}
      {([ [-0.82, 0, -0.42], [0.82, 0, -0.42], [-0.82, 0, 0.42], [0.82, 0, 0.42] ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.07, 0.75, 0.07]} />
          <meshLambertMaterial color="#5a4010" />
        </mesh>
      ))}
      {/* Monitor */}
      <mesh position={[0, 1.24, -0.28]} castShadow>
        <boxGeometry args={[0.9, 0.55, 0.06]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 1.24, -0.24]}>
        <planeGeometry args={[0.82, 0.47]} />
        <meshBasicMaterial color="#0e2244" />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.88, -0.28]}>
        <boxGeometry args={[0.07, 0.12, 0.07]} />
        <meshLambertMaterial color="#333" />
      </mesh>
      {/* Keyboard */}
      <mesh position={[0, 0.80, 0.12]}>
        <boxGeometry args={[0.55, 0.025, 0.2]} />
        <meshLambertMaterial color="#bbb" />
      </mesh>
      {/* Mouse */}
      <mesh position={[0.38, 0.795, 0.1]}>
        <boxGeometry args={[0.1, 0.02, 0.14]} />
        <meshLambertMaterial color="#ccc" />
      </mesh>
      {/* Papers */}
      <mesh position={[-0.5, 0.795, 0.22]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.28, 0.01, 0.2]} />
        <meshLambertMaterial color="#f5f0e8" />
      </mesh>
    </group>
  );
}

function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.45, 0.06, 0.45]} />
        <meshLambertMaterial color="#5533aa" />
      </mesh>
      <mesh position={[0, 0.78, -0.2]} castShadow>
        <boxGeometry args={[0.45, 0.58, 0.06]} />
        <meshLambertMaterial color="#5533aa" />
      </mesh>
      {/* Armrests */}
      <mesh position={[-0.24, 0.65, 0.02]}>
        <boxGeometry args={[0.05, 0.06, 0.3]} />
        <meshLambertMaterial color="#4422aa" />
      </mesh>
      <mesh position={[0.24, 0.65, 0.02]}>
        <boxGeometry args={[0.05, 0.06, 0.3]} />
        <meshLambertMaterial color="#4422aa" />
      </mesh>
      {([ [-0.18, 0, -0.18], [0.18, 0, -0.18], [-0.18, 0, 0.18], [0.18, 0, 0.18] ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} position={[p[0], 0.23, p[2]]}>
          <boxGeometry args={[0.05, 0.46, 0.05]} />
          <meshLambertMaterial color="#333" />
        </mesh>
      ))}
    </group>
  );
}

function Sofa({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[2.2, 0.32, 0.8]} />
        <meshLambertMaterial color="#d06090" />
      </mesh>
      <mesh position={[0, 0.7, -0.36]} castShadow>
        <boxGeometry args={[2.2, 0.6, 0.12]} />
        <meshLambertMaterial color="#c05080" />
      </mesh>
      <mesh position={[-1.05, 0.7, 0]} castShadow>
        <boxGeometry args={[0.12, 0.6, 0.8]} />
        <meshLambertMaterial color="#c05080" />
      </mesh>
      <mesh position={[1.05, 0.7, 0]} castShadow>
        <boxGeometry args={[0.12, 0.6, 0.8]} />
        <meshLambertMaterial color="#c05080" />
      </mesh>
      {/* Seat cushions */}
      <mesh position={[-0.55, 0.56, 0]} castShadow>
        <boxGeometry args={[0.9, 0.08, 0.75]} />
        <meshLambertMaterial color="#e070a0" />
      </mesh>
      <mesh position={[0.55, 0.56, 0]} castShadow>
        <boxGeometry args={[0.9, 0.08, 0.75]} />
        <meshLambertMaterial color="#e070a0" />
      </mesh>
    </group>
  );
}

function CoffeeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.06, 0.55]} />
        <meshLambertMaterial color="#6a4a18" />
      </mesh>
      {([ [-0.35, 0, -0.2], [0.35, 0, -0.2], [-0.35, 0, 0.2], [0.35, 0, 0.2] ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <meshLambertMaterial color="#4a3010" />
        </mesh>
      ))}
    </group>
  );
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.44, 8]} />
        <meshLambertMaterial color="#7a4010" />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.35, 9, 7]} />
        <meshLambertMaterial color="#277040" />
      </mesh>
      <mesh position={[0.22, 0.92, 0.1]} castShadow>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshLambertMaterial color="#38884e" />
      </mesh>
      <mesh position={[-0.16, 0.88, 0.18]} castShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshLambertMaterial color="#2d7a45" />
      </mesh>
    </group>
  );
}

function PingPongTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.07, 1.3]} />
        <meshLambertMaterial color="#2a8a3a" />
      </mesh>
      {/* White lines */}
      <mesh position={[0, 0.875, 0]}>
        <boxGeometry args={[0.04, 0.01, 1.3]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      <mesh position={[0, 0.875, 0]}>
        <boxGeometry args={[2.4, 0.01, 0.04]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      {/* Net */}
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[2.4, 0.2, 0.02]} />
        <meshLambertMaterial color="#eee" transparent opacity={0.85} />
      </mesh>
      {([ [-1.1, 0, -0.55], [1.1, 0, -0.55], [-1.1, 0, 0.55], [1.1, 0, 0.55] ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.08, 0.8, 0.08]} />
          <meshLambertMaterial color="#555" />
        </mesh>
      ))}
    </group>
  );
}

function Fridge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.7, 1.8, 0.65]} />
        <meshLambertMaterial color="#2a2a3a" />
      </mesh>
      <mesh position={[0, 1.5, 0.34]}>
        <boxGeometry args={[0.6, 0.6, 0.02]} />
        <meshLambertMaterial color="#3a3a4a" />
      </mesh>
      <mesh position={[0, 0.8, 0.34]}>
        <boxGeometry args={[0.6, 0.9, 0.02]} />
        <meshLambertMaterial color="#333344" />
      </mesh>
      <mesh position={[0.22, 1.5, 0.36]}>
        <boxGeometry args={[0.04, 0.12, 0.02]} />
        <meshLambertMaterial color="#888" />
      </mesh>
      <mesh position={[0.22, 0.8, 0.36]}>
        <boxGeometry args={[0.04, 0.15, 0.02]} />
        <meshLambertMaterial color="#888" />
      </mesh>
    </group>
  );
}

function Divider({ position, rotation = 0, length = 3 }: { position: [number, number, number]; rotation?: number; length?: number }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, 1.5, 0.1]} />
      <meshLambertMaterial color="#5a5a72" />
    </mesh>
  );
}

// ─── Voxel characters ─────────────────────────────────────────────────────────

interface CharacterProps {
  position: [number, number, number];
  rotation?: number;
  name: string;
  role: string;
  bodyColor: string;
  headColor?: string;
  status?: HermesStatus | "idle";
  isMain?: boolean;
}

function VoxelCharacter({ position, rotation = 0, name, role, bodyColor, headColor = "#f0c4a0", status = "idle", isMain = false }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    if (status === "working") {
      groupRef.current.position.y = Math.sin(t * 9) * 0.04;
      groupRef.current.rotation.y = rotation + Math.sin(t * 3) * 0.08;
    } else if (status === "success") {
      groupRef.current.position.y = Math.abs(Math.sin(t * 5)) * 0.25;
    } else if (status === "error") {
      groupRef.current.position.y = 0;
    } else {
      groupRef.current.position.y = Math.sin(t * 1.6 + (isMain ? 0 : 1)) * 0.055;
    }
  });

  const dotColor =
    status === "working" ? "#f59e0b"
    : status === "success" ? "#22c55e"
    : status === "error" ? "#ef4444"
    : "#22c55e";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group ref={groupRef}>
        {/* Head */}
        <mesh position={[0, 1.42, 0]} castShadow>
          <boxGeometry args={[0.54, 0.54, 0.54]} />
          <meshLambertMaterial color={headColor} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.12, 1.46, 0.28]}>
          <boxGeometry args={[0.1, 0.1, 0.02]} />
          <meshBasicMaterial color="#222" />
        </mesh>
        <mesh position={[0.12, 1.46, 0.28]}>
          <boxGeometry args={[0.1, 0.1, 0.02]} />
          <meshBasicMaterial color="#222" />
        </mesh>
        {/* Smile when success */}
        {status === "success" && (
          <mesh position={[0, 1.34, 0.28]}>
            <boxGeometry args={[0.18, 0.04, 0.02]} />
            <meshBasicMaterial color="#444" />
          </mesh>
        )}
        {/* Hair / headset band */}
        {isMain && (
          <>
            <mesh position={[0, 1.72, 0]}>
              <boxGeometry args={[0.56, 0.08, 0.56]} />
              <meshLambertMaterial color="#333" />
            </mesh>
            <mesh position={[-0.3, 1.48, 0]}>
              <boxGeometry args={[0.08, 0.22, 0.12]} />
              <meshLambertMaterial color="#333" />
            </mesh>
            <mesh position={[0.3, 1.48, 0]}>
              <boxGeometry args={[0.08, 0.22, 0.12]} />
              <meshLambertMaterial color="#333" />
            </mesh>
          </>
        )}
        {/* Body */}
        <mesh position={[0, 0.88, 0]} castShadow>
          <boxGeometry args={[0.46, 0.64, 0.32]} />
          <meshLambertMaterial color={bodyColor} />
        </mesh>
        {/* Badge on body */}
        <mesh position={[-0.14, 1.02, 0.17]}>
          <boxGeometry args={[0.1, 0.13, 0.02]} />
          <meshBasicMaterial color="#88aaff" />
        </mesh>
        {/* Left arm */}
        <mesh position={[-0.32, 0.88, 0]} castShadow>
          <boxGeometry args={[0.14, 0.52, 0.26]} />
          <meshLambertMaterial color={bodyColor} />
        </mesh>
        {/* Right arm */}
        <mesh position={[0.32, 0.88, 0]} castShadow>
          <boxGeometry args={[0.14, 0.52, 0.26]} />
          <meshLambertMaterial color={bodyColor} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.13, 0.34, 0]} castShadow>
          <boxGeometry args={[0.18, 0.56, 0.26]} />
          <meshLambertMaterial color="#2a2a44" />
        </mesh>
        <mesh position={[0.13, 0.34, 0]} castShadow>
          <boxGeometry args={[0.18, 0.56, 0.26]} />
          <meshLambertMaterial color="#2a2a44" />
        </mesh>
        {/* Shoes */}
        <mesh position={[-0.13, 0.06, 0.06]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.32]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[0.13, 0.06, 0.06]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.32]} />
          <meshLambertMaterial color="#111" />
        </mesh>
      </group>

      {/* Status dot */}
      <mesh position={[0.35, 2.05, 0.28]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshBasicMaterial color={dotColor} />
      </mesh>

      {/* Name label */}
      <Html position={[0, 2.45, 0]} center distanceFactor={10} zIndexRange={[10, 11]}>
        <div
          style={{
            background: "rgba(10,10,20,0.88)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            padding: "3px 10px",
            color: "#fff",
            fontSize: "11px",
            fontWeight: "700",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "ui-rounded, system-ui, sans-serif",
          }}
        >
          <span>{name}</span>
          <span style={{ color: "#aaa", fontWeight: 400, fontSize: "10px" }}>· {role}</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: dotColor,
              flexShrink: 0,
              boxShadow: `0 0 6px ${dotColor}`,
            }}
          />
        </div>
      </Html>
    </group>
  );
}

// ─── Full scene ───────────────────────────────────────────────────────────────

function SceneContent({ status }: { status: HermesStatus }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[12, 22, 12]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-8, 8, -4]} intensity={0.3} color="#8899ff" />

      {/* Environment */}
      <Floor />
      <Walls />

      {/* Wall decorations */}
      <WallScreen position={[-10.85, 3.2, -1]} rotation={[0, Math.PI / 2, 0]} />
      <WallScreen position={[-10.85, 3.2, 5]} rotation={[0, Math.PI / 2, 0]} />
      <WallScreen position={[3, 3.2, -10.85]} rotation={[0, 0, 0]} />
      <WallPicture position={[-10.85, 2.2, 3]} rotation={[0, Math.PI / 2, 0]} color="#446688" />
      <WallPicture position={[-2, 2.8, -10.85]} rotation={[0, 0, 0]} color="#228844" />
      <WallPicture position={[-6, 2.8, -10.85]} rotation={[0, 0, 0]} color="#884422" />

      {/* ── Hermes workstation (right side) ── */}
      <Desk position={[4, 0, 3]} />
      <Chair position={[4, 0, 4.4]} />
      <Desk position={[7, 0, 1]} rotation={Math.PI / 2} />
      <Chair position={[8.4, 0, 1]} rotation={Math.PI / 2} />

      {/* ── Other agent desks ── */}
      <Desk position={[1, 0, -2]} />
      <Chair position={[1, 0, -0.6]} rotation={Math.PI} />
      <Desk position={[-1, 0, 5]} rotation={Math.PI} />
      <Chair position={[-1, 0, 3.6]} />
      <Desk position={[6, 0, -4]} />
      <Chair position={[6, 0, -2.6]} rotation={Math.PI} />

      {/* ── Lounge / break area ── */}
      <Sofa position={[-4, 0, -2]} />
      <CoffeeTable position={[-4, 0, -0.5]} />
      <Sofa position={[-5.5, 0, -4]} rotation={Math.PI / 2} />

      {/* ── Fun zone ── */}
      <PingPongTable position={[5, 0, -7]} />

      {/* ── Fridge corner ── */}
      <Fridge position={[-9.5, 0, -9]} />
      <Fridge position={[-8.5, 0, -9]} />

      {/* ── Room dividers ── */}
      <Divider position={[2.5, 0.75, -0.5]} length={4} />
      <Divider position={[0.5, 0.75, 2]} rotation={Math.PI / 2} length={3.5} />

      {/* ── Plants ── */}
      <Plant position={[-10, 0, 9]} />
      <Plant position={[-10, 0, -8]} scale={1.2} />
      <Plant position={[9, 0, -10]} scale={0.9} />
      <Plant position={[9, 0, 9]} scale={1.1} />
      <Plant position={[-10, 0, 2]} scale={0.85} />
      <Plant position={[3, 0, -10]} scale={0.95} />

      {/* ── Characters ── */}
      {/* Hermes – at his desk */}
      <VoxelCharacter
        position={[4, 0, 5.2]}
        rotation={Math.PI}
        name="Hermes"
        role="Orchestrator"
        bodyColor="#3366cc"
        headColor="#f0c4a0"
        status={status}
        isMain
      />
      {/* Boss character */}
      <VoxelCharacter
        position={[-2, 0, 4]}
        rotation={-0.4}
        name="เจ้านาย"
        role="Manager"
        bodyColor="#2d4a22"
        headColor="#e8b870"
      />
      {/* Agent 2 */}
      <VoxelCharacter
        position={[1, 0, -3.5]}
        rotation={0.3}
        name="Agent 2"
        role="Assistant"
        bodyColor="#884422"
        headColor="#f4d0b0"
      />
    </>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export function IsometricScene({ status }: { status: HermesStatus }) {
  return (
    <div className="w-full min-w-0 h-[420px] sm:h-[580px] rounded-3xl overflow-hidden border border-border shadow-pop bg-[#1e1e2e]">
      <Canvas
        orthographic
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [18, 18, 18], zoom: 42, near: 0.1, far: 500 }}
        gl={{ antialias: true, powerPreference: "default" }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, 0);
          camera.updateProjectionMatrix();
        }}
      >
        <Suspense fallback={null}>
          <SceneContent status={status} />
        </Suspense>
      </Canvas>
    </div>
  );
}
