"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSim } from "@/lib/simulation/store";
import { buildScenario } from "@/lib/simulation/scenario";
import { closureVisible, floodLevel, overcast, policeVisible, rainIntensity } from "@/lib/simulation/visual";
import { ZONE_BUILDINGS } from "@/lib/twin/coords";

export const DISTRICT_URL = "/models/district.glb";
export const DRACO_PATH = "/draco/";

/** Objects the twin drives itself (hidden here, re-created in Vehicles/Water/Sea/Signage). */
const DRIVEN = new Set([
  "Car_Ahmed", "Ambulance", "Water_Underpass", "VMS_Screen", "Sea",
  "Car_Traffic_1", "Car_Traffic_2", "Car_Traffic_3", "Car_Traffic_4", "Car_Traffic_5", "Car_Traffic_6",
  "CD_Unit", "Helicopter", "Flag", "Walker_1", "Walker_2", "Walker_3", "Walker_4", "Walker_5", "Walker_6", "Boat_1", "Boat_2", "Boat_3",
]);
const WET_MATERIALS = new Set(["Asphalt", "Plaza", "Paving", "Sidewalk", "Curb", "Ground_Sand", "Concrete", "Roof", "Marble_Warm", "Beach", "Helipad"]);
const WARM = new THREE.Color("#ffd9a0");

/**
 * useGLTF hands every mount the same cached scene, and the frame loop writes wetness into its
 * materials in place. The dry baseline is therefore captured exactly once per material instance,
 * or every remount would start from an already-darkened, already-glossy ground.
 */
const DRY_BASELINE = new WeakMap<THREE.MeshStandardMaterial, { rough: number; color: THREE.Color }>();
const baselineOf = (m: THREE.MeshStandardMaterial) => {
  let b = DRY_BASELINE.get(m);
  if (!b) {
    b = { rough: m.roughness, color: m.color.clone() };
    DRY_BASELINE.set(m, b);
  }
  return b;
};
/** Highlight clones are cached per source material so remounts reuse them instead of cloning clones. */
const HIGHLIGHT_CLONE = new WeakMap<THREE.MeshStandardMaterial, THREE.MeshStandardMaterial>();

export function District() {
  const { scene, animations } = useGLTF(DISTRICT_URL, DRACO_PATH);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  // Every clip in the file is scrubbed together: the underpass water level and the eight
  // street puddles (which start at zero scale and only appear once their clip is applied).
  const actions = useMemo(
    () =>
      animations.map((clip) => {
        const a = mixer.clipAction(clip);
        a.play();
        a.paused = true;
        return a;
      }),
    [mixer, animations],
  );
  const duration = useMemo(() => Math.max(0, ...animations.map((c) => c.duration)), [animations]);
  const wet = useRef<{ m: THREE.MeshStandardMaterial; rough: number; color: THREE.Color }[]>([]);
  const glass = useRef<THREE.MeshStandardMaterial[]>([]);
  const lamps = useRef<THREE.MeshStandardMaterial[]>([]);
  const signals = useRef<Record<string, THREE.MeshStandardMaterial>>({});
  const highlight = useRef<Map<string, THREE.MeshStandardMaterial[]>>(new Map());
  // Resolved once per scene instead of three full-scene traversals per frame.
  const barriers = useRef<THREE.Object3D[]>([]);
  const police = useRef<THREE.Object3D | null>(null);
  const helpCache = useRef<{ step: number; buildings: Set<string> }>({ step: -1, buildings: new Set() });

  useEffect(() => {
    wet.current = [];
    glass.current = [];
    lamps.current = [];
    const seen = new Set<THREE.Material>();
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!(m instanceof THREE.MeshStandardMaterial) || seen.has(m)) continue;
        seen.add(m);
        m.envMapIntensity = 0.9;
        if (WET_MATERIALS.has(m.name)) wet.current.push({ m, ...baselineOf(m) });
        if (m.name.startsWith("Glass_")) {
          m.envMapIntensity = 1.6;
          glass.current.push(m);
        }
        if (m.name === "Water" || m.name === "Pool") {
          m.transparent = true;
          m.opacity = 0.82;
          m.roughness = 0.04;
          m.metalness = 0.05;
          m.envMapIntensity = 2.2;
          m.depthWrite = false;
        }
        if (m.name === "Marble" || m.name === "Marble_Warm") m.envMapIntensity = 1.2;
        if (m.name === "Lamp" || m.name === "Lamp_Globe") {
          m.emissiveIntensity = 0.6;
          lamps.current.push(m);
        }
        if (m.name === "Screen") m.emissiveIntensity = 0.2;
        if (m.name.startsWith("Signal_")) signals.current[m.name] = m;
      }
    });
    for (const name of DRIVEN) {
      const n = scene.getObjectByName(name);
      if (n) n.visible = false;
    }
    barriers.current = ["Barrier_W", "Barrier_E"].map((n) => scene.getObjectByName(n)).filter((o): o is THREE.Object3D => !!o);
    police.current = scene.getObjectByName("Police_Car") ?? null;
    helpCache.current = { step: -1, buildings: new Set() };
    for (const id of ZONE_BUILDINGS) {
      const b = scene.getObjectByName(id);
      if (!b) continue;
      const list: THREE.MeshStandardMaterial[] = [];
      b.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const cloned = mats.map((m) => {
          if (m instanceof THREE.MeshStandardMaterial && (m.name.startsWith("Facade") || m.name === "Trim")) {
            const c = HIGHLIGHT_CLONE.get(m) ?? m.clone();
            HIGHLIGHT_CLONE.set(m, c);
            HIGHLIGHT_CLONE.set(c, c); // a second mount sees the clone already in place
            list.push(c);
            return c;
          }
          return m;
        });
        o.material = Array.isArray(o.material) ? cloned : cloned[0];
      });
      highlight.current.set(id, list);
    }
  }, [scene]);

  const tmpColor = useMemo(() => new THREE.Color(), []);
  useFrame((st) => {
    const { step, t } = useSim.getState();
    if (actions.length) {
      const time = floodLevel(step, t) * duration * 0.999;
      for (const a of actions) a.time = time;
      mixer.update(0);
    }
    const wetness = rainIntensity(step, t);
    const o = overcast(step, t);
    for (const w of wet.current) {
      w.m.roughness = THREE.MathUtils.lerp(w.rough, 0.22, wetness);
      w.m.color.copy(w.color).multiplyScalar(THREE.MathUtils.lerp(1, 0.66, wetness));
      w.m.envMapIntensity = THREE.MathUtils.lerp(0.9, 1.8, wetness);
    }
    for (const g of glass.current) {
      g.emissive.copy(WARM);
      g.emissiveIntensity = 0.22 * o;
    }
    for (const l of lamps.current) l.emissiveIntensity = THREE.MathUtils.lerp(0.6, 5, o);
    // traffic signals cycle (all intersections in phase): red → green → amber
    const phase = (st.clock.getElapsedTime() % 12) / 12;
    const red = phase < 0.45 ? 1 : 0;
    const green = phase >= 0.5 && phase < 0.92 ? 1 : 0;
    const amber = (phase >= 0.45 && phase < 0.5) || phase >= 0.92 ? 1 : 0;
    if (signals.current.Signal_Red) signals.current.Signal_Red.emissiveIntensity = 0.3 + 4 * red;
    if (signals.current.Signal_Green) signals.current.Signal_Green.emissiveIntensity = 0.3 + 4 * green;
    if (signals.current.Signal_Amber) signals.current.Signal_Amber.emissiveIntensity = 0.3 + 4 * amber;
    const closure = closureVisible(step, t);
    for (const n of barriers.current) n.visible = closure;
    if (police.current) police.current.visible = policeVisible(step, t) && useSim.getState().layers.units;
    // Which zone buildings hold a resident asking for help — recomputed only when the step changes.
    if (helpCache.current.step !== step) {
      const state = buildScenario(step);
      const set = new Set<string>();
      for (const p of state.people) if (p.person.buildingId && (p.status === "help" || p.status === "assistance_assigned")) set.add(p.person.buildingId);
      helpCache.current = { step, buildings: set };
    }
    const time = st.clock.getElapsedTime();
    for (const [id, mats] of highlight.current) {
      const help = helpCache.current.buildings.has(id);
      let intensity = 0;
      if (help) {
        tmpColor.set("#f0554f");
        intensity = 0.3 + 0.3 * (0.5 + 0.5 * Math.sin(time * 4));
      } else if (step >= 3) {
        tmpColor.set("#f2b544");
        intensity = 0.1 + 0.07 * (0.5 + 0.5 * Math.sin(time * 2));
      }
      for (const m of mats) {
        m.emissive.copy(tmpColor);
        m.emissiveIntensity = intensity;
      }
    }
  });

  return <primitive object={scene} />;
}

useGLTF.preload(DISTRICT_URL, DRACO_PATH);
