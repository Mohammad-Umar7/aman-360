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
const DRIVEN = new Set(["Car_Ahmed", "Ambulance", "Water_Underpass", "VMS_Screen", "Car_Traffic_1", "Car_Traffic_2", "Car_Traffic_3", "Sea"]);
const WET_MATERIALS = new Set(["Asphalt", "Plaza", "Paving", "Sidewalk", "Curb", "Ground_Sand", "Concrete", "Roof", "Marble_Warm", "Beach", "Helipad"]);
const WARM = new THREE.Color("#ffd9a0");

export function District() {
  const { scene, animations } = useGLTF(DISTRICT_URL, DRACO_PATH);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const action = useMemo(() => {
    if (!animations.length) return null;
    const a = mixer.clipAction(animations[0]);
    a.play();
    a.paused = true;
    return a;
  }, [mixer, animations]);
  const wet = useRef<{ m: THREE.MeshStandardMaterial; rough: number; color: THREE.Color }[]>([]);
  const glass = useRef<THREE.MeshStandardMaterial[]>([]);
  const lamps = useRef<THREE.MeshStandardMaterial[]>([]);
  const highlight = useRef<Map<string, THREE.MeshStandardMaterial[]>>(new Map());

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
        if (WET_MATERIALS.has(m.name)) wet.current.push({ m, rough: m.roughness, color: m.color.clone() });
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
        if (m.name === "Signal_Red") m.emissiveIntensity = 3;
      }
    });
    for (const name of DRIVEN) {
      const n = scene.getObjectByName(name);
      if (n) n.visible = false;
    }
    for (const id of ZONE_BUILDINGS) {
      const b = scene.getObjectByName(id);
      if (!b) continue;
      const list: THREE.MeshStandardMaterial[] = [];
      b.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const cloned = mats.map((m) => {
          if (m instanceof THREE.MeshStandardMaterial && (m.name.startsWith("Facade") || m.name === "Trim")) {
            const c = m.clone();
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
    if (action && animations.length) {
      action.time = floodLevel(step, t) * animations[0].duration * 0.999;
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
    const closure = closureVisible(step, t);
    for (const name of ["Barrier_W", "Barrier_E"]) {
      const n = scene.getObjectByName(name);
      if (n) n.visible = closure;
    }
    const police = scene.getObjectByName("Police_Car");
    if (police) police.visible = policeVisible(step, t);
    const state = buildScenario(step);
    const time = st.clock.getElapsedTime();
    for (const [id, mats] of highlight.current) {
      const residents = state.people.filter((p) => p.person.buildingId === id);
      const help = residents.some((p) => p.status === "help" || p.status === "assistance_assigned");
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
