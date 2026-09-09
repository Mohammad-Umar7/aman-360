"use client";

import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ASSEMBLY_POINTS, FLOOD_POLYGON, POI, UNDERPASS, buildingById } from "@/lib/data/district";
import { pointAlong } from "@/lib/engine/geometry";
import { useScenario, useSim } from "@/lib/simulation/store";
import { AMBULANCE_PATH, ahmedVehicle, ambulanceVehicle, closureVisible, hazardVisible } from "@/lib/simulation/visual";
import { buildingTop, toWorld } from "@/lib/twin/coords";
import type { PersonState } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  normal: "#8b99ad",
  affected: "#f2b544",
  message_ready: "#9b8cff",
  sent: "#5aa9ff",
  delivered: "#5aa9ff",
  read: "#4f8df7",
  safe: "#34c77b",
  help: "#f0554f",
  clarification: "#f2b544",
  different: "#9b8cff",
  no_response: "#f0554f",
  assistance_assigned: "#4f8df7",
  resolved: "#34c77b",
  no_alert: "#8b99ad",
};
const STATUS_LABEL: Record<string, string> = {
  normal: "",
  affected: "Affected",
  message_ready: "Message ready",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  safe: "Safe",
  help: "Needs help",
  clarification: "Question",
  different: "Situation differs",
  no_response: "No response",
  assistance_assigned: "Unit assigned",
  resolved: "Resolved",
  no_alert: "No alert",
};

function HazardZone() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    FLOOD_POLYGON.forEach((p, i) => (i === 0 ? s.moveTo(p.x, p.y) : s.lineTo(p.x, p.y)));
    s.closePath();
    return s;
  }, []);
  const outline = useMemo(() => [...FLOOD_POLYGON, FLOOD_POLYGON[0]].map((p) => toWorld(p, 0.55)), []);
  const lineRef = useRef<THREE.Group>(null);
  const fill = useRef<THREE.MeshBasicMaterial>(null);
  const fence = useRef<THREE.MeshBasicMaterial>(null);
  const group = useRef<THREE.Group>(null);
  useFrame((st) => {
    const { step, t } = useSim.getState();
    const on = hazardVisible(step, t);
    if (group.current) group.current.visible = on;
    const pulse = 0.5 + 0.5 * Math.sin(st.clock.getElapsedTime() * 1.6);
    if (fill.current) fill.current.opacity = 0.08 + 0.05 * pulse;
    if (fence.current) fence.current.opacity = 0.05 + 0.03 * pulse;
    // dashed outline crawl
    lineRef.current?.traverse((o) => {
      const m = (o as THREE.Object3D & { material?: THREE.ShaderMaterial & { dashOffset?: number } }).material;
      if (m && "dashOffset" in m) m.dashOffset = -st.clock.getElapsedTime() * 4;
    });
  });
  return (
    <group ref={group}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.4} renderOrder={2}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial ref={fill} color="#f0554f" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.4} renderOrder={2}>
        <extrudeGeometry args={[shape, { depth: 4, bevelEnabled: false }]} />
        <meshBasicMaterial ref={fence} color="#f0554f" transparent opacity={0.06} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={lineRef}>
        <Line points={outline} color="#ff6b63" lineWidth={2} dashed dashSize={3} gapSize={2} transparent opacity={0.95} />
      </group>
    </group>
  );
}

function Routes() {
  const state = useScenario();
  const step = state.step.index;
  const ahmed = state.people.find((p) => p.person.id === "ahmed");
  const route = ahmed?.impact?.route;
  const orig = useMemo(() => (route ? route.original.map((p) => toWorld(p, 0.7)) : null), [route]);
  const alt = useMemo(() => (route?.alternative ? route.alternative.map((p) => toWorld(p, 0.75)) : null), [route]);
  const amb = useMemo(() => AMBULANCE_PATH.map((p) => toWorld(p, 0.75)), []);
  const altRef = useRef<THREE.Group>(null);
  const ambRef = useRef<THREE.Group>(null);
  useFrame((st) => {
    for (const r of [altRef.current, ambRef.current]) {
      r?.traverse((o) => {
        const m = (o as THREE.Object3D & { material?: THREE.ShaderMaterial & { dashOffset?: number } }).material;
        if (m && "dashOffset" in m) m.dashOffset = -st.clock.getElapsedTime() * 10;
      });
    }
  });
  if (step < 3) return null;
  return (
    <>
      {orig && <Line points={orig} color={step >= 4 && alt ? "#f0554f" : "#f2b544"} lineWidth={step >= 4 && alt ? 1.5 : 2.5} dashed={step >= 4 && !!alt} dashSize={2} gapSize={2} transparent opacity={step >= 4 && alt ? 0.55 : 0.95} />}
      {alt && step >= 4 && (
        <group ref={altRef}>
          <Line points={alt} color="#4f8df7" lineWidth={3.2} dashed dashSize={4} gapSize={2.5} />
        </group>
      )}
      {step >= 7 && (
        <group ref={ambRef}>
          <Line points={amb} color="#ff6b63" lineWidth={2.2} dashed dashSize={3} gapSize={2} />
        </group>
      )}
    </>
  );
}

function Label({ ps, position, compact }: { ps: PersonState; position: [number, number, number]; compact?: boolean }) {
  const selectPerson = useSim((s) => s.selectPerson);
  const color = STATUS_COLOR[ps.status];
  const label = STATUS_LABEL[ps.status];
  const attention = ps.status === "help" || ps.status === "no_response";
  return (
    <Html position={position} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
      <button
        onClick={() => selectPerson(ps.person.id)}
        className={cn(
          "pointer-events-auto flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[11.5px] font-medium whitespace-nowrap shadow-[0_8px_24px_-8px_rgba(0,0,0,0.9)] backdrop-blur-md transition-transform hover:scale-105",
          attention ? "bg-[#1a0f12]/90 border-alert/50 text-white" : "bg-[#0b1220]/85 border-white/15 text-ink",
        )}
        style={{ transform: "translateY(-6px)" }}
      >
        <span className="relative flex h-2 w-2">
          {attention && <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: color }} />}
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
        </span>
        {ps.person.name.split(" ")[0]}
        {label && !compact && <span className="text-ink-3 font-normal">· {label}</span>}
      </button>
      <div className="mx-auto h-3 w-px bg-white/30" />
    </Html>
  );
}

function PeopleLabels({ compact }: { compact?: boolean }) {
  const state = useScenario();
  const step = state.step.index;
  const carRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const { step: s, t } = useSim.getState();
    const a = ahmedVehicle(s, t);
    const { p } = pointAlong(a.path, a.progress);
    carRef.current?.position.set(p.x, 3.4, -p.y);
  });
  const shown = state.people.filter((p) => p.person.spotlight || ["help", "no_response", "clarification", "different", "assistance_assigned"].includes(p.status));
  const stackIndex = new Map<string, number>();
  return (
    <>
      {shown.map((ps) => {
        if (ps.person.id === "ahmed") {
          return (
            <group key="ahmed" ref={carRef}>
              <Label ps={ps} position={[0, 0, 0]} compact={compact} />
            </group>
          );
        }
        let pos: [number, number, number];
        if (ps.person.buildingId) {
          const b = buildingById(ps.person.buildingId)!;
          const idx = stackIndex.get(b.id) ?? 0;
          stackIndex.set(b.id, idx + 1);
          pos = [b.p.x + (idx - 0.5) * 9 * (idx ? 1 : 0), buildingTop(b.id) + idx * 3.2, -b.p.y];
        } else pos = toWorld(ps.person.location, 5.5);
        if (step === 0 && !ps.person.spotlight) return null;
        return <Label key={ps.person.id} ps={ps} position={pos} compact={compact} />;
      })}
    </>
  );
}

function ClosureLabel() {
  const visible = useSim((s) => closureVisible(s.step, s.t));
  if (!visible) return null;
  return (
    <Html position={[(UNDERPASS.x0 + UNDERPASS.x1) / 2, 9, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className="rounded-md border border-alert/60 bg-[#2a0f12]/90 px-2.5 py-1 text-[11.5px] font-semibold tracking-wider text-[#ffb3ae] whitespace-nowrap backdrop-blur-md">UNDERPASS CLOSED · FLOODING</div>
    </Html>
  );
}

function AssemblyMarkers() {
  const state = useScenario();
  if (state.step.index < 3) return null;
  return (
    <>
      {ASSEMBLY_POINTS.map((ap) => (
        <group key={ap.id} position={toWorld(ap.p, 0)}>
          <mesh position-y={2.2} rotation-y={Math.PI / 4}>
            <octahedronGeometry args={[1.4]} />
            <meshStandardMaterial color="#2bb8a6" emissive="#2bb8a6" emissiveIntensity={0.7} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 2.2, 6]} />
            <meshBasicMaterial color="#2bb8a6" />
          </mesh>
          <Html position={[0, 4.4, 0]} center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
            <div className="rounded-md border border-teal/40 bg-[#07201c]/85 px-2 py-0.5 text-[11px] text-teal-2 whitespace-nowrap backdrop-blur-md">{ap.name.split(" (")[0]}</div>
          </Html>
        </group>
      ))}
    </>
  );
}

function HelpBeacon() {
  const state = useScenario();
  const ref = useRef<THREE.Mesh>(null);
  const sara = state.people.find((p) => p.person.id === "sara");
  const active = sara?.status === "help" || sara?.status === "assistance_assigned";
  useFrame((st) => {
    if (!ref.current) return;
    const s = 1 + ((st.clock.getElapsedTime() * 0.9) % 1) * 3;
    ref.current.scale.set(s, s, s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - ((st.clock.getElapsedTime() * 0.9) % 1));
  });
  if (!active) return null;
  const b = buildingById("Bldg_Sara")!;
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position={[b.p.x, 0.6, -b.p.y + b.d / 2 + 6]}>
      <ringGeometry args={[3, 3.6, 48]} />
      <meshBasicMaterial color="#f0554f" transparent opacity={0.6} depthWrite={false} />
    </mesh>
  );
}

function AmbulanceLabel() {
  const state = useScenario();
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const { step, t } = useSim.getState();
    const b = ambulanceVehicle(step, t);
    const { p } = pointAlong(b.path, b.progress);
    ref.current?.position.set(p.x, 4.6, -p.y);
  });
  if (state.step.index < 7) return null;
  const done = state.step.index >= 8;
  return (
    <group ref={ref}>
      <Html position={[0, 0, 0]} center zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}>
        <div className="rounded-md border border-alert/50 bg-[#2a0f12]/90 px-2 py-0.5 text-[11px] font-medium text-white whitespace-nowrap backdrop-blur-md">A-07 accessible ambulance · {done ? "on scene" : "en route"}</div>
      </Html>
    </group>
  );
}

function VmsLabel() {
  const state = useScenario();
  if (state.step.index < 5) return null;
  return (
    <Html position={[POI.vms.x, 13.5, -POI.vms.y - 1.5]} center zIndexRange={[12, 0]} style={{ pointerEvents: "none" }}>
      <div className="rounded-md border border-brand/40 bg-[#0b1220]/85 px-2 py-0.5 text-[11px] text-brand-2 whitespace-nowrap backdrop-blur-md">VMS-07 · digital signage</div>
    </Html>
  );
}

export function Overlays({ compact, labels = true }: { compact?: boolean; labels?: boolean }) {
  return (
    <>
      <HazardZone />
      <Routes />
      {labels && <ClosureLabel />}
      {labels && <PeopleLabels compact={compact} />}
      {labels && <AssemblyMarkers />}
      <HelpBeacon />
      {labels && <AmbulanceLabel />}
      {labels && !compact && <VmsLabel />}
    </>
  );
}
