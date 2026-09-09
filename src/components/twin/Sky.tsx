"use client";

import { Environment } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSim } from "@/lib/simulation/store";
import { overcast } from "@/lib/simulation/visual";

const CLEAR = { top: new THREE.Color("#3f7fc4"), horizon: new THREE.Color("#dbe7f2"), sun: new THREE.Color("#fff1d6"), sunI: 2.6, hemiI: 0.7, ambI: 0.22 };
const STORM = { top: new THREE.Color("#252d3a"), horizon: new THREE.Color("#57626f"), sun: new THREE.Color("#c9d3e0"), sunI: 0.5, hemiI: 0.4, ambI: 0.3 };

/** Shared sky colours: the visible dome, the environment probe and the sea all read from here. */
export const SKY = { top: CLEAR.top.clone(), horizon: CLEAR.horizon.clone() };

const VERT = /* glsl */ `
  varying vec3 vPos;
  void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const FRAG = /* glsl */ `
  uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform float uSunGlow; varying vec3 vPos;
  void main() {
    vec3 d = normalize(vPos);
    float h = d.y;
    float m = smoothstep(-0.05, 0.5, h);
    vec3 col = mix(uHorizon, uTop, m);
    float g = pow(max(dot(d, normalize(uSunDir)), 0.0), 40.0);
    col += vec3(1.0, 0.95, 0.85) * g * uSunGlow;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function SkyDome({ uniforms, scale = 1400 }: { uniforms: Record<string, { value: unknown }>; scale?: number }) {
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

export function SkyAndLights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const scene = useThree((s) => s.scene);
  const uniforms = useMemo(
    () => ({ uTop: { value: SKY.top }, uHorizon: { value: SKY.horizon }, uSunDir: { value: new THREE.Vector3(120, 170, 90) }, uSunGlow: { value: 0.35 } }),
    [],
  );
  const fog = useMemo(() => new THREE.Fog(CLEAR.horizon.clone(), 340, 980), []);

  useFrame(() => {
    const { step, t } = useSim.getState();
    const o = overcast(step, t);
    SKY.top.copy(CLEAR.top).lerp(STORM.top, o);
    SKY.horizon.copy(CLEAR.horizon).lerp(STORM.horizon, o);
    uniforms.uSunGlow.value = 0.35 * (1 - o);
    fog.color.copy(SKY.horizon);
    fog.near = THREE.MathUtils.lerp(340, 190, o);
    fog.far = THREE.MathUtils.lerp(980, 600, o);
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
      <SkyDome uniforms={uniforms} />
      {/* the same sky rendered into a small cubemap drives PBR reflections on glass, water and wet ground */}
      <Environment frames={Infinity} resolution={128} background={false}>
        <SkyDome uniforms={uniforms} scale={100} />
      </Environment>
      <hemisphereLight ref={hemi} args={["#cfe3ff", "#b8a888", CLEAR.hemiI]} />
      <ambientLight ref={amb} intensity={CLEAR.ambI} />
      <directionalLight
        ref={sun}
        position={[120, 170, 90]}
        intensity={CLEAR.sunI}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.5}
        shadow-camera-left={-230}
        shadow-camera-right={230}
        shadow-camera-top={230}
        shadow-camera-bottom={-230}
        shadow-camera-near={10}
        shadow-camera-far={700}
      />
    </>
  );
}
