"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
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
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);
    vec3 h = normalize(normalize(uSun) + v);
    float spec = pow(max(dot(n, h), 0.0), 140.0) * uGloss;
    float shore = smoothstep(96.0, 88.5, vWorld.z);           // lighter, sandy water near the beach
    vec3 col = mix(uDeep, uShallow, shore * 0.8 + fres * 0.2);
    col = mix(col, uSky, fres * 0.55);
    float foam = smoothstep(0.16, 0.26, vFoam) * 0.25 + smoothstep(89.5, 88.6, vWorld.z) * 0.6;
    col += vec3(0.9) * foam;
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
  useFrame((st) => {
    const { step, t } = useSim.getState();
    const o = overcast(step, t);
    uniforms.uTime.value = st.clock.getElapsedTime();
    uniforms.uShallow.value.copy(CLEAR.shallow).lerp(STORM.shallow, o);
    uniforms.uDeep.value.copy(CLEAR.deep).lerp(STORM.deep, o);
    uniforms.uSky.value.copy(SKY.horizon);
    uniforms.uGloss.value = 1 - 0.75 * o;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.32, 190]}>
      <planeGeometry args={[520, 205, 120, 60]} />
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
    </mesh>
  );
}
