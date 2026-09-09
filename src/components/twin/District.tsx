"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSim } from "@/lib/simulation/store";
import { buildScenario } from "@/lib/simulation/scenario";
import { closureVisible, floodLevel, policeVisible, rainIntensity } from "@/lib/simulation/visual";
import { ZONE_BUILDINGS } from "@/lib/twin/coords";

export const DISTRICT_URL = "/models/district.glb";

/** Objects the twin drives itself (hidden here, re-created in Vehicles/Water/Signage). */
const DRIVEN = new Set(["Car_Ahmed", "Ambulance", "Water_Underpass", "VMS_Screen", "Car_Traffic_1", "Car_Traffic_2"]);
const WET_MATERIALS = new Set(["Asphalt", "Plaza", "Curb", "Ground_Sand", "Concrete", "Roof"]);

export function District() {
  const { scene, animations } = useGLTF(DISTRICT_URL);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const action = useMemo(() => {
    if (!animations.length) return null;
    const a = mixer.clipAction(animations[0]);
    a.play();
    a.paused = true;
    return a;
  }, [mixer, animations]);
  const wet = useRef<{ m: THREE.MeshStandardMaterial; rough: number; color: THREE.Color }[]>([]);
  const highlight = useRef<Map<string, THREE.MeshStandardMaterial[]>>(new Map());

  // One-time scene preparation
  useEffect(() => {
    wet.current = [];
    const seen = new Set<THREE.Material>();
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!(m instanceof THREE.MeshStandardMaterial) || seen.has(m)) continue;
        seen.add(m);
        if (WET_MATERIALS.has(m.name)) wet.current.push({ m, rough: m.roughness, color: m.color.clone() });
        if (m.name.startsWith("Puddle") || m.name === "Water") {
          m.transparent = true;
          m.opacity = 0.75;
          m.roughness = 0.08;
          m.metalness = 0.1;
          m.depthWrite = false;
        }
        if (m.name === "Lamp") m.emissiveIntensity = 1.2;
        if (m.name === "Screen") m.emissiveIntensity = 0.2;
      }
    });
    for (const name of DRIVEN) {
      const n = scene.getObjectByName(name);
      if (n) n.visible = false;
    }
    // Per-building facade materials for highlighting (cloned so buildings can pulse independently)
    for (const id of ZONE_BUILDINGS) {
      const b = scene.getObjectByName(id);
      if (!b) continue;
      const list: THREE.MeshStandardMaterial[] = [];
      b.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const cloned = mats.map((m) => {
          if (m instanceof THREE.MeshStandardMaterial && m.name.startsWith("Facade")) {
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
    // wet look
    const wetness = rainIntensity(step, t);
    for (const w of wet.current) {
      w.m.roughness = THREE.MathUtils.lerp(w.rough, 0.28, wetness);
      w.m.color.copy(w.color).multiplyScalar(THREE.MathUtils.lerp(1, 0.72, wetness));
    }
    // closure props
    const closure = closureVisible(step, t);
    for (const name of ["Barrier_W", "Barrier_E"]) {
      const n = scene.getObjectByName(name);
      if (n) n.visible = closure;
    }
    const police = scene.getObjectByName("Police_Car");
    if (police) police.visible = policeVisible(step, t);
    // building highlights
    const state = buildScenario(step);
    const time = st.clock.getElapsedTime();
    for (const [id, mats] of highlight.current) {
      const residents = state.people.filter((p) => p.person.buildingId === id);
      const help = residents.some((p) => p.status === "help" || p.status === "assistance_assigned");
      const inZone = step >= 3;
      let intensity = 0;
      if (help) {
        tmpColor.set("#f0554f");
        intensity = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(time * 4));
      } else if (inZone) {
        tmpColor.set("#f2b544");
        intensity = 0.12 + 0.08 * (0.5 + 0.5 * Math.sin(time * 2));
      }
      for (const m of mats) {
        m.emissive.copy(tmpColor);
        m.emissiveIntensity = intensity;
      }
    }
  });

  return <primitive object={scene} />;
}

useGLTF.preload(DISTRICT_URL);
