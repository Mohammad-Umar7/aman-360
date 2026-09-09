"use client";

/**
 * Ambient life and secondary storytelling for the twin: boulevard traffic,
 * pedestrians, boats, birds, the medevac helicopter, the Civil Defence unit,
 * the Corniche flag, the cell-broadcast pulse and the drainage sensor label.
 */

import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DISTRICT_URL, DRACO_PATH } from "@/components/twin/District";
import { SEA_LEVEL } from "@/components/twin/Sea";
import { LANE, nodeById } from "@/lib/data/district";
import { pointAlong } from "@/lib/engine/geometry";
import { useSim } from "@/lib/simulation/store";
import { cdVehicle, floodLevel, helicopter, rainIntensity } from "@/lib/simulation/visual";
import type { Point } from "@/lib/types";

const P = (id: string) => nodeById(id).p;

function useClone(name: string, keepTransform = false) {
  const { scene } = useGLTF(DISTRICT_URL, DRACO_PATH);
  return useMemo(() => {
    const src = scene.getObjectByName(name);
    if (!src) return null;
    const c = src.clone(true);
    if (!keepTransform) {
      c.position.set(0, 0, 0);
      c.rotation.set(0, 0, 0);
    }
    c.visible = true;
    c.traverse((o) => {
      o.visible = true;
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return c;
  }, [scene, name, keepTransform]);
}

function place(g: THREE.Object3D | null, path: Point[], progress: number, y = 0.06) {
  if (!g) return;
  const { p, heading } = pointAlong(path, progress);
  g.position.set(p.x, y, -p.y);
  g.rotation.y = heading;
}

/* ------------------------------------------------------------------ */
/* Boulevard traffic                                                   */
/* ------------------------------------------------------------------ */

const LANES: Point[][] = [
  [{ x: -146, y: P("K1").y - LANE }, { x: 146, y: P("K1").y - LANE }],
  [{ x: 146, y: P("K1").y + LANE }, { x: -146, y: P("K1").y + LANE }],
  [{ x: -146, y: P("C1").y - LANE }, { x: 146, y: P("C1").y - LANE }],
  [{ x: 146, y: P("C1").y + LANE }, { x: -146, y: P("C1").y + LANE }],
  [{ x: P("A1").x + 3, y: -68 }, { x: P("A1").x + 3, y: 146 }],
  [{ x: P("A1").x - 3, y: 146 }, { x: P("A1").x - 3, y: -68 }],
  [{ x: P("A2").x + 3, y: -68 }, { x: P("A2").x + 3, y: 146 }],
  [{ x: P("A2").x - 3, y: 146 }, { x: P("A2").x - 3, y: -68 }],
];
const MODELS = ["Car_Traffic_1", "Car_Traffic_2", "Car_Traffic_4", "Car_Traffic_5", "Car_Traffic_6", "Car_Traffic_2", "Car_Traffic_4"];

function Traffic() {
  const cars = MODELS.map((m) => useClone(m)); // eslint-disable-line react-hooks/rules-of-hooks
  const refs = useRef<(THREE.Group | null)[]>([]);
  const spec = useMemo(() => {
    const out: { lane: number; phase: number; speed: number; model: number }[] = [];
    let k = 0;
    for (let lane = 0; lane < LANES.length; lane++) {
      for (let i = 0; i < 2; i++) {
        out.push({ lane, phase: (i * 0.5 + lane * 0.13) % 1, speed: 0.022 + ((k * 7) % 5) * 0.003, model: k % MODELS.length });
        k++;
      }
    }
    return out;
  }, []);
  useFrame((st) => {
    const { step, layers } = useSim.getState();
    const time = st.clock.getElapsedTime();
    const slow = step >= 1 ? 0.55 : 1;
    spec.forEach((s, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.visible = layers.life;
      place(g, LANES[s.lane], (s.phase + time * s.speed * slow) % 1);
    });
  });
  return (
    <>
      {spec.map((s, i) => {
        const model = cars[s.model];
        if (!model) return null;
        return (
          <group
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
          >
            <primitive object={i === s.model ? model : model.clone(true)} />
          </group>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pedestrians, boats, birds, flag                                     */
/* ------------------------------------------------------------------ */

const WALKS: Point[][] = [
  [{ x: -140, y: -76.5 }, { x: 140, y: -76.5 }],
  [{ x: 120, y: -73.5 }, { x: -120, y: -73.5 }],
  [{ x: -60, y: -75 }, { x: 60, y: -75 }],
  [{ x: -140, y: P("K1").y - 9 }, { x: 60, y: P("K1").y - 9 }],
  [{ x: 140, y: P("K1").y + 9 }, { x: -60, y: P("K1").y + 9 }],
  [{ x: -46, y: -12 }, { x: -34, y: -12 }],
];

function Walkers() {
  const models = [1, 2, 3, 4, 5, 6].map((i) => useClone(`Walker_${i}`)); // eslint-disable-line react-hooks/rules-of-hooks
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((st) => {
    const { step, layers } = useSim.getState();
    const time = st.clock.getElapsedTime();
    models.forEach((m, i) => {
      const g = refs.current[i];
      if (!g) return;
      // people head indoors during the storm — fewer walkers on the promenade
      g.visible = layers.life && !(step >= 1 && step <= 7 && i % 2 === 0);
      const path = WALKS[i];
      const cycle = (time * 0.012 + i * 0.17) % 2; // there and back
      const u = cycle < 1 ? cycle : 2 - cycle;
      const { p, heading } = pointAlong(path, u);
      const base = path[0].y < -70 ? 0.16 : 0.18;
      g.position.set(p.x, base + Math.abs(Math.sin(time * 6 + i)) * 0.03, -p.y);
      g.rotation.y = cycle < 1 ? heading : heading + Math.PI;
    });
  });
  return (
    <>
      {models.map((m, i) =>
        m ? (
          <group
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
          >
            <primitive object={m} />
          </group>
        ) : null,
      )}
    </>
  );
}

const BOATS = [
  { x: -26, y: -98, r: 5, w: 0.05 },
  { x: -16, y: -106, r: 7, w: -0.04 },
  { x: 14, y: -97, r: 4, w: 0.06 },
];

function Boats() {
  const models = [1, 2, 3].map((i) => useClone(`Boat_${i}`)); // eslint-disable-line react-hooks/rules-of-hooks
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((st) => {
    const time = st.clock.getElapsedTime();
    const { step, t, layers } = useSim.getState();
    const swell = 0.12 + 0.25 * rainIntensity(step, t);
    BOATS.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.visible = layers.life;
      const a = time * b.w + i;
      g.position.set(b.x + Math.cos(a) * b.r, SEA_LEVEL + 0.05 + Math.sin(time * 1.1 + i) * swell, -(b.y + Math.sin(a) * b.r));
      g.rotation.set(Math.sin(time * 0.9 + i) * 0.05 * (1 + swell), a + Math.PI / 2, Math.cos(time * 0.7 + i) * 0.04 * (1 + swell));
    });
  });
  return (
    <>
      {models.map((m, i) =>
        m ? (
          <group
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
          >
            <primitive object={m} />
          </group>
        ) : null,
      )}
    </>
  );
}

function Birds({ count = 16 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({ r: 40 + (i % 5) * 9, h: 22 + (i % 4) * 6, phase: (i / count) * Math.PI * 2, speed: 0.25 + (i % 3) * 0.05, flap: 6 + (i % 4) })), [count]);
  useFrame((st) => {
    const g = group.current;
    if (!g) return;
    const { step, t, layers } = useSim.getState();
    const rain = rainIntensity(step, t);
    g.visible = layers.life && rain < 0.6;
    const time = st.clock.getElapsedTime();
    g.children.forEach((bird, i) => {
      const s = seeds[i];
      const a = time * s.speed + s.phase;
      bird.position.set(-20 + Math.cos(a) * s.r, s.h + Math.sin(time * 0.7 + i) * 2, 96 + Math.sin(a) * s.r * 0.6);
      bird.rotation.y = -a + Math.PI / 2;
      const flap = Math.sin(time * s.flap) * 0.55;
      (bird.children[0] as THREE.Mesh).rotation.z = flap;
      (bird.children[1] as THREE.Mesh).rotation.z = -flap;
    });
  });
  return (
    <group ref={group}>
      {seeds.map((_, i) => (
        <group key={i}>
          <mesh position={[0.45, 0, 0]}>
            <planeGeometry args={[0.9, 0.22]} />
            <meshBasicMaterial color="#222a33" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.45, 0, 0]}>
            <planeGeometry args={[0.9, 0.22]} />
            <meshBasicMaterial color="#222a33" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Flag() {
  const { scene } = useGLTF(DISTRICT_URL, DRACO_PATH);
  // the flag exports as a group of one mesh per colour; clone every geometry so the source stays untouched
  const parts = useMemo(() => {
    const src = scene.getObjectByName("Flag");
    if (!src) return null;
    const root = src.clone(true);
    root.visible = true;
    const meshes: { mesh: THREE.Mesh; base: Float32Array }[] = [];
    root.traverse((o) => {
      o.visible = true;
      if (o instanceof THREE.Mesh) {
        o.geometry = o.geometry.clone();
        meshes.push({ mesh: o, base: (o.geometry.getAttribute("position").array as Float32Array).slice() });
      }
    });
    return { root, meshes };
  }, [scene]);
  useFrame((st) => {
    if (!parts) return;
    const { step, t } = useSim.getState();
    const wind = 1 + 1.4 * rainIntensity(step, t);
    const time = st.clock.getElapsedTime();
    for (const { mesh, base } of parts.meshes) {
      const pos = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        const x = base[i];
        const y = base[i + 1];
        const f = x / 14;
        arr[i + 2] = (Math.sin(x * 0.5 - time * 3.4 * wind + y * 0.25) * 0.35 + Math.sin(x * 1.1 - time * 5.1 * wind) * 0.12) * f * wind;
        arr[i + 1] = y - f * f * 0.5;
      }
      pos.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }
  });
  if (!parts) return null;
  return <primitive object={parts.root} />;
}

/* ------------------------------------------------------------------ */
/* Response units and sensors                                          */
/* ------------------------------------------------------------------ */

function Helicopter() {
  const model = useClone("Helicopter");
  const show = useSim((s) => s.step >= 7 && s.layers.units);
  const g = useRef<THREE.Group>(null);
  const rotor = useMemo(() => model?.getObjectByName("Rotor") ?? null, [model]);
  const tail = useMemo(() => model?.getObjectByName("Tail_Rotor") ?? null, [model]);
  const spin = useRef(0);
  const labelRef = useRef<HTMLDivElement>(null);
  useFrame((_, dt) => {
    const { step, t, layers } = useSim.getState();
    const h = helicopter(step, t);
    if (!g.current) return;
    g.current.visible = h.visible && layers.units;
    g.current.position.set(h.p.x, h.alt, -h.p.y);
    g.current.rotation.y = h.heading;
    g.current.rotation.x = step === 7 ? -0.12 * (1 - t) : 0;
    spin.current += dt * (8 + 40 * h.rotor);
    if (rotor) rotor.rotation.y = spin.current;
    if (tail) tail.rotation.x = spin.current * 2.5;
    if (labelRef.current) labelRef.current.textContent = step >= 8 ? "Medevac H-2 · on the helipad" : "Medevac H-2 · inbound";
  });
  if (!model) return null;
  return (
    <group ref={g} visible={false}>
      <primitive object={model} />
      {show && (
        <Html position={[0, 5.5, 0]} center zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}>
          <div ref={labelRef} className="rounded-md border border-alert/50 bg-[#2a0f12]/90 px-2 py-0.5 text-[11px] font-medium text-white whitespace-nowrap backdrop-blur-md">
            Medevac H-2 · inbound
          </div>
        </Html>
      )}
    </group>
  );
}

function CivilDefenceUnit() {
  const model = useClone("CD_Unit");
  const show = useSim((s) => s.step >= 7 && s.layers.units);
  const g = useRef<THREE.Group>(null);
  const lights = useRef<THREE.MeshStandardMaterial[]>([]);
  const labelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    lights.current = [];
    model?.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const cloned = mats.map((m) => {
        if (m instanceof THREE.MeshStandardMaterial && (m.name === "Light_Red" || m.name === "Light_Blue")) {
          const c = m.clone();
          lights.current.push(c);
          return c;
        }
        return m;
      });
      o.material = Array.isArray(o.material) ? cloned : cloned[0];
    });
  }, [model]);
  useFrame((st) => {
    const { step, t, layers } = useSim.getState();
    const v = cdVehicle(step, t);
    if (!g.current) return;
    g.current.visible = v.visible && layers.units;
    place(g.current, v.path, v.progress);
    const time = st.clock.getElapsedTime();
    const active = step === 7;
    lights.current.forEach((m, i) => {
      m.emissiveIntensity = active && Math.floor(time * 6 + i) % 2 === 0 ? 8 : 1.2;
    });
    if (labelRef.current) labelRef.current.textContent = step >= 8 ? "CD-3 Civil Defence · on scene" : "CD-3 Civil Defence · en route";
  });
  if (!model) return null;
  return (
    <group ref={g} visible={false}>
      <primitive object={model} />
      {show && (
        <Html position={[0, 3.6, 0]} center zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}>
          <div ref={labelRef} className="rounded-md border border-warn/50 bg-[#2a1c0f]/90 px-2 py-0.5 text-[11px] font-medium text-white whitespace-nowrap backdrop-blur-md">
            CD-3 Civil Defence · en route
          </div>
        </Html>
      )}
    </group>
  );
}

function BroadcastPulse() {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const group = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const show = useSim((s) => s.step >= 5 && s.layers.sensors);
  useFrame((st) => {
    const { step, t, layers } = useSim.getState();
    const on = layers.sensors && (step === 5 || (step === 6 && t < 0.5));
    if (group.current) group.current.visible = layers.sensors && step >= 5;
    const time = st.clock.getElapsedTime();
    rings.current.forEach((r, i) => {
      if (!r) return;
      const u = (time * 0.45 + i / 3) % 1;
      const s = on ? 4 + u * 150 : 0.001;
      r.scale.set(s, s, s);
      (r.material as THREE.MeshBasicMaterial).opacity = on ? 0.35 * (1 - u) : 0;
    });
    if (labelRef.current) labelRef.current.textContent = step >= 6 ? "Cell broadcast · 1,211 devices reached" : "Cell broadcast · sending to 1,284";
  });
  return (
    <group ref={group} position={[84, 33, 52]} visible={false}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
          rotation-x={-Math.PI / 2}
          position-y={-31}
        >
          <ringGeometry args={[0.96, 1, 64]} />
          <meshBasicMaterial color="#8ab8ff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.7, 12, 8]} />
        <meshBasicMaterial color="#8ab8ff" />
      </mesh>
      {show && (
        <Html position={[0, 3, 0]} center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
          <div ref={labelRef} className="rounded-md border border-brand/40 bg-[#0b1220]/85 px-2 py-0.5 text-[11px] text-brand-2 whitespace-nowrap backdrop-blur-md">
            Cell broadcast
          </div>
        </Html>
      )}
    </group>
  );
}

function DrainageSensor() {
  const ref = useRef<HTMLSpanElement>(null);
  const group = useRef<THREE.Group>(null);
  const show = useSim((s) => s.step >= 1 && s.layers.sensors);
  useFrame(() => {
    const { step, t, layers } = useSim.getState();
    if (group.current) group.current.visible = layers.sensors && step >= 1;
    if (ref.current) {
      const level = Math.max(0, -0.15 + floodLevel(step, t) * 2.2);
      ref.current.textContent = `${level.toFixed(1)} m ${step <= 7 && step >= 1 ? "↑" : step === 8 ? "↓" : ""}`;
    }
  });
  return (
    <group ref={group} visible={false}>
      <mesh position={[-8, 1.6, -8.6]}>
        <cylinderGeometry args={[0.12, 0.12, 2.4, 8]} />
        <meshStandardMaterial color="#7c8288" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[-8, 2.9, -8.6]}>
        <sphereGeometry args={[0.28, 10, 8]} />
        <meshStandardMaterial color="#f2b544" emissive="#f2b544" emissiveIntensity={1.5} />
      </mesh>
      {show && (
        <Html position={[-8, 4.6, -8.6]} center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
          <div className="rounded-md border border-warn/40 bg-[#1f160a]/90 px-2 py-0.5 text-[11px] text-[#ffd27a] whitespace-nowrap backdrop-blur-md">
            UP-07 drainage · water <span ref={ref}>0.0 m</span>
          </div>
        </Html>
      )}
    </group>
  );
}

export function Life({ labels = true }: { labels?: boolean }) {
  return (
    <>
      <Traffic />
      <Walkers />
      <Boats />
      <Birds />
      <Flag />
      <Helicopter />
      <CivilDefenceUnit />
      {labels && <BroadcastPulse />}
      {labels && <DrainageSensor />}
    </>
  );
}
