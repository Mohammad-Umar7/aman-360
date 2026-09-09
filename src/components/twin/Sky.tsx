"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSim } from "@/lib/simulation/store";
import { overcast } from "@/lib/simulation/visual";

const CLEAR = { top: new THREE.Color("#4f86c6"), horizon: new THREE.Color("#d9e6f2"), sun: new THREE.Color("#fff1d6"), sunI: 2.4, hemiI: 0.75, ambI: 0.25 };
const STORM = { top: new THREE.Color("#2a3442"), horizon: new THREE.Color("#5b6673"), sun: new THREE.Color("#c9d3e0"), sunI: 0.55, hemiI: 0.42, ambI: 0.32 };

const VERT = /* glsl */ `
  varying vec3 vPos;
  void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const FRAG = /* glsl */ `
  uniform vec3 uTop; uniform vec3 uHorizon; varying vec3 vPos;
  void main() {
    float h = normalize(vPos).y;
    float m = smoothstep(-0.05, 0.45, h);
    gl_FragColor = vec4(mix(uHorizon, uTop, m), 1.0);
  }
`;

export function SkyAndLights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const scene = useThree((s) => s.scene);
  const uniforms = useMemo(() => ({ uTop: { value: CLEAR.top.clone() }, uHorizon: { value: CLEAR.horizon.clone() } }), []);
  const fog = useMemo(() => new THREE.Fog(CLEAR.horizon.clone(), 320, 900), []);

  useFrame(() => {
    const { step, t } = useSim.getState();
    const o = overcast(step, t);
    uniforms.uTop.value.copy(CLEAR.top).lerp(STORM.top, o);
    uniforms.uHorizon.value.copy(CLEAR.horizon).lerp(STORM.horizon, o);
    fog.color.copy(uniforms.uHorizon.value);
    fog.near = THREE.MathUtils.lerp(320, 180, o);
    fog.far = THREE.MathUtils.lerp(900, 560, o);
    if (scene.fog !== fog) scene.fog = fog;
    if (sun.current) {
      sun.current.intensity = THREE.MathUtils.lerp(CLEAR.sunI, STORM.sunI, o);
      sun.current.color.copy(CLEAR.sun).lerp(STORM.sun, o);
    }
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(CLEAR.hemiI, STORM.hemiI, o);
    if (amb.current) amb.current.intensity = THREE.MathUtils.lerp(CLEAR.ambI, STORM.ambI, o);
  });

  return (
    <>
      <mesh scale={1400}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      <hemisphereLight ref={hemi} args={["#cfe3ff", "#b8a888", CLEAR.hemiI]} />
      <ambientLight ref={amb} intensity={CLEAR.ambI} />
      <directionalLight
        ref={sun}
        position={[120, 170, 90]}
        intensity={CLEAR.sunI}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
        shadow-camera-left={-210}
        shadow-camera-right={210}
        shadow-camera-top={210}
        shadow-camera-bottom={-210}
        shadow-camera-near={10}
        shadow-camera-far={600}
      />
    </>
  );
}
