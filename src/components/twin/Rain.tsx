"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSim } from "@/lib/simulation/store";
import { rainIntensity } from "@/lib/simulation/visual";

const N = 9000;
const AREA = 200;
const TOP = 80;
const DIR = new THREE.Vector3(0.22, -1, 0.08).normalize();
const LEN = 1.7;
const SPEED = 42;

export function Rain() {
  const ref = useRef<THREE.LineSegments>(null);
  const matRef = useRef<THREE.LineBasicMaterial>(null);
  const { geometry, heads } = useMemo(() => {
    const heads = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      heads[i * 3] = (Math.random() * 2 - 1) * AREA;
      heads[i * 3 + 1] = Math.random() * TOP;
      heads[i * 3 + 2] = (Math.random() * 2 - 1) * AREA;
    }
    const pos = new Float32Array(N * 2 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setDrawRange(0, 0);
    return { geometry, heads };
  }, []);

  useFrame((_, dt) => {
    const { step, t } = useSim.getState();
    const intensity = rainIntensity(step, t);
    const count = Math.floor(N * intensity);
    geometry.setDrawRange(0, count * 2);
    if (matRef.current) matRef.current.opacity = 0.16 + 0.2 * intensity;
    if (count === 0) return;
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const step_ = Math.min(dt, 0.05) * SPEED;
    for (let i = 0; i < count; i++) {
      let x = heads[i * 3] + DIR.x * step_;
      let y = heads[i * 3 + 1] + DIR.y * step_;
      let z = heads[i * 3 + 2] + DIR.z * step_;
      if (y < 0) {
        y = TOP - Math.random() * 6;
        x = (Math.random() * 2 - 1) * AREA;
        z = (Math.random() * 2 - 1) * AREA;
      }
      heads[i * 3] = x;
      heads[i * 3 + 1] = y;
      heads[i * 3 + 2] = z;
      const o = i * 6;
      arr[o] = x;
      arr[o + 1] = y;
      arr[o + 2] = z;
      arr[o + 3] = x - DIR.x * LEN;
      arr[o + 4] = y - DIR.y * LEN;
      arr[o + 5] = z - DIR.z * LEN;
    }
    pos.needsUpdate = true;
  });

  return (
    <lineSegments ref={ref} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial ref={matRef} color="#d6e6ff" transparent opacity={0} depthWrite={false} />
    </lineSegments>
  );
}
