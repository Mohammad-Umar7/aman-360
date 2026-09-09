"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSim } from "@/lib/simulation/store";
import { overcast } from "@/lib/simulation/visual";
import { SKY } from "@/components/twin/Sky";

const VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  varying float vFoam;
  void main() {
    vec3 p = position;
    float w = sin(p.x * 0.09 + uTime * 0.7) * 0.12 + sin(p.y * 0.13 - uTime * 0.9) * 0.09 + sin((p.x - p.y) * 0.05 + uTime * 0.5) * 0.14;
    p.z += w;
    vFoam = w;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform vec3 uSky;
  uniform vec3 uSun;
  uniform float uGloss;
  varying vec3 vWorld;
  varying float vFoam;
  void main() {
    vec3 n = normalize(vec3(
      sin(vWorld.x * 0.35 + uTime * 1.1) * 0.06 + sin(vWorld.x * 1.7 - uTime * 2.3) * 0.02,
      1.0,
      cos(vWorld.z * 0.42 - uTime * 1.3) * 0.06 + cos(vWorld.z * 2.1 + uTime * 1.9) * 0.02));
    vec3 v = normalize(cameraPosition - vWorld);
    float fres = pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 2.5);
    vec3 h = normalize(normalize(uSun) + v);
    float spec = pow(clamp(dot(n, h), 0.0, 1.0), 140.0) * uGloss;
    float shore = smoothstep(96.0, 88.5, vWorld.z);           // lighter, sandy water near the beach
    vec3 col = mix(uDeep, uShallow, shore * 0.8 + fres * 0.2);
    col = mix(col, uSky, fres * 0.55);
    float crest = smoothstep(0.28, 0.34, vFoam) * 0.08;                          // faint white caps only on the highest crests
    float shoreFoam = smoothstep(89.6, 88.6, vWorld.z) * (0.35 + 0.25 * sin(vWorld.x * 0.7 + uTime * 1.5));
    col += vec3(0.85) * (crest + shoreFoam);
    col += spec * 0.9;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const CLEAR = { shallow: new THREE.Color("#3aa6b8"), deep: new THREE.Color("#1a6a8a") };
const STORM = { shallow: new THREE.Color("#4f6f78"), deep: new THREE.Color("#2b4652") };

export function Sea() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShallow: { value: CLEAR.shallow.clone() },
      uDeep: { value: CLEAR.deep.clone() },
      uSky: { value: new THREE.Color("#d9e6f2") },
      uSun: { value: new THREE.Vector3(120, 170, 90) },
      uGloss: { value: 1 },
    }),
    [],
  );
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((st) => {
    const { step, t } = useSim.getState();
    const o = overcast(step, t);
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value = st.clock.getElapsedTime();
    (u.uShallow.value as THREE.Color).copy(CLEAR.shallow).lerp(STORM.shallow, o);
    (u.uDeep.value as THREE.Color).copy(CLEAR.deep).lerp(STORM.deep, o);
    (u.uSky.value as THREE.Color).copy(SKY.horizon);
    u.uGloss.value = 1 - 0.75 * o;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.32, 190]}>
      <planeGeometry args={[520, 205, 120, 60]} />
      <shaderMaterial ref={mat} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
    </mesh>
  );
}
