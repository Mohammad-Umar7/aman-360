"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DISTRICT_URL } from "@/components/twin/District";
import { pointAlong } from "@/lib/engine/geometry";
import { useSim } from "@/lib/simulation/store";
import { ahmedVehicle, ambulanceVehicle, TRAFFIC_CO, TRAFFIC_KF } from "@/lib/simulation/visual";
import type { Point } from "@/lib/types";

function useClone(name: string) {
  const { scene } = useGLTF(DISTRICT_URL);
  return useMemo(() => {
    const src = scene.getObjectByName(name);
    if (!src) return null;
    const c = src.clone(true);
    c.position.set(0, 0, 0);
    c.rotation.set(0, 0, 0);
    c.visible = true;
    c.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return c;
  }, [scene, name]);
}

function place(group: THREE.Group | null, path: Point[], progress: number) {
  if (!group) return;
  const { p, heading } = pointAlong(path, progress);
  group.position.set(p.x, 0.06, -p.y);
  group.rotation.y = heading;
}

export function Vehicles() {
  const car = useClone("Car_Ahmed");
  const amb = useClone("Ambulance");
  const t1 = useClone("Car_Traffic_1");
  const t2 = useClone("Car_Traffic_2");
  const carRef = useRef<THREE.Group>(null);
  const ambRef = useRef<THREE.Group>(null);
  const t1Ref = useRef<THREE.Group>(null);
  const t2Ref = useRef<THREE.Group>(null);
  const lights = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    lights.current = [];
    amb?.traverse((o) => {
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
  }, [amb]);

  useFrame((st) => {
    const { step, t } = useSim.getState();
    const a = ahmedVehicle(step, t);
    place(carRef.current, a.path, a.progress);
    const b = ambulanceVehicle(step, t);
    place(ambRef.current, b.path, b.progress);
    const time = st.clock.getElapsedTime();
    const active = step >= 7 && b.progress < 1;
    lights.current.forEach((m, i) => {
      const on = active && Math.floor(time * 6 + i) % 2 === 0;
      m.emissiveIntensity = on ? 8 : step >= 7 ? 1.5 : 0.6;
    });
    // ambient traffic loops (slow in rain)
    const speed = step >= 1 ? 0.018 : 0.035;
    place(t1Ref.current, TRAFFIC_KF, (time * speed) % 1);
    place(t2Ref.current, TRAFFIC_CO, (time * speed * 0.8 + 0.4) % 1);
  });

  return (
    <>
      {car && (
        <group ref={carRef}>
          <primitive object={car} />
        </group>
      )}
      {amb && (
        <group ref={ambRef}>
          <primitive object={amb} />
        </group>
      )}
      {t1 && (
        <group ref={t1Ref}>
          <primitive object={t1} />
        </group>
      )}
      {t2 && (
        <group ref={t2Ref}>
          <primitive object={t2} />
        </group>
      )}
    </>
  );
}
