"use client";

import { MeshReflectorMaterial, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DISTRICT_URL } from "@/components/twin/District";
import { UNDERPASS } from "@/lib/data/district";
import { useSim } from "@/lib/simulation/store";
import { floodLevel, rainIntensity } from "@/lib/simulation/visual";

const W = UNDERPASS.x1 - UNDERPASS.x0 + 4;
const D = 16.2;
const CX = (UNDERPASS.x0 - 2 + UNDERPASS.x1 + 2) / 2;
const SEG_X = 110;
const SEG_Z = 14;

/** Procedural tiling normal map: layered ripples + value noise, generated once on the CPU. */
function makeRippleNormalMap(size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const h = (x: number, y: number) => {
    const u = (x / size) * Math.PI * 2;
    const v = (y / size) * Math.PI * 2;
    let s = 0;
    s += Math.sin(u * 3 + v * 1) * 0.5;
    s += Math.sin(u * 7 - v * 4 + 1.3) * 0.25;
    s += Math.sin(u * 13 + v * 9 + 0.4) * 0.12;
    s += Math.sin(u * 2 - v * 6 + 2.1) * 0.35;
    s += Math.sin((u + v) * 17 + 0.9) * 0.06;
    return s;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = h(x + 1, y) - h(x - 1, y);
      const dy = h(x, y + 1) - h(x, y - 1);
      const n = new THREE.Vector3(-dx * 2.2, -dy * 2.2, 1).normalize();
      const i = (y * size + x) * 4;
      data[i] = Math.round((n.x * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round((n.y * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((n.z * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 1);
  tex.needsUpdate = true;
  return tex;
}

const RINGS_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const RINGS_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uRain;
  uniform float uLevel;
  varying vec3 vWorld;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // sunken-road floor profile, mirrored from blender/gen_streets.py dip()
  float floorZ(float x) {
    float a0 = -48.0, a1 = -32.0, b1 = 42.0, b0 = 58.0;
    if (x <= a0 || x >= b0) return 0.06;
    float t;
    if (x < a1) t = (x - a0) / (a1 - a0);
    else if (x > b1) t = (b0 - x) / (b0 - b1);
    else return 0.06 - 2.2;
    float s = t * t * (3.0 - 2.0 * t);
    return 0.06 - 2.2 * s;
  }

  void main() {
    vec2 p = vWorld.xz;
    float rings = 0.0;
    vec2 cell = floor(p / 1.1);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 c = cell + vec2(float(i), float(j));
        float hsh = hash(c);
        vec2 centre = (c + 0.5 + 0.35 * vec2(hash(c + 3.1) - 0.5, hash(c + 7.7) - 0.5)) * 1.1;
        float life = fract(uTime * (0.7 + hsh * 0.5) + hsh * 7.0);
        float r = life * 0.55;
        float d = distance(p, centre);
        float ring = smoothstep(0.045, 0.0, abs(d - r)) * (1.0 - life) * step(hsh, 0.35 + uRain * 0.5);
        rings += ring;
      }
    }
    float depth = uLevel - floorZ(vWorld.x);
    float murk = smoothstep(0.0, 1.6, depth);
    float edge = smoothstep(7.0, 8.05, abs(vWorld.z));         // foam along the retaining walls
    float shallow = 1.0 - smoothstep(0.0, 0.35, depth);        // waterline at the ramps
    vec3 col = vec3(0.16, 0.19, 0.15) * murk;
    float alpha = 0.32 * murk;
    col += vec3(0.85, 0.9, 0.86) * (edge * 0.35 + shallow * 0.45);
    alpha += edge * 0.25 + shallow * 0.35;
    col += vec3(0.9, 0.95, 1.0) * rings * uRain * 0.55;
    alpha += rings * uRain * 0.4;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.9));
  }
`;

export function Water() {
  const { scene } = useGLTF(DISTRICT_URL, "/draco/");
  const node = useMemo(() => scene.getObjectByName("Water_Underpass") ?? null, [scene]);
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(W, D, SEG_X, SEG_Z), []);
  const base = useMemo(() => (geo.getAttribute("position").array as Float32Array).slice(), [geo]);
  const normalTex = useMemo(() => makeRippleNormalMap(), []);
  const ringUniforms = useMemo(() => ({ uTime: { value: 0 }, uRain: { value: 0 }, uLevel: { value: -2.5 } }), []);

  useFrame((st, dt) => {
    const { step, t } = useSim.getState();
    const time = st.clock.getElapsedTime();
    const level = node ? node.position.y : -2.5;
    const rain = rainIntensity(step, t);
    if (group.current) {
      group.current.position.y = level;
      group.current.visible = floodLevel(step, t) > 0.02;
    }
    // gentle surface swell (CPU displacement of the plane's local z, which is world up after rotation)
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const amp = 0.02 + 0.03 * rain;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i];
      const y = base[i + 1];
      arr[i + 2] = Math.sin(x * 0.28 + time * 1.4) * amp + Math.sin(y * 0.9 - time * 1.9) * amp * 0.6 + Math.sin((x + y) * 0.5 + time * 1.1) * amp * 0.5;
    }
    pos.needsUpdate = true;
    normalTex.offset.x += dt * 0.025;
    normalTex.offset.y += dt * 0.012;
    ringUniforms.uTime.value = time;
    ringUniforms.uRain.value = rain;
    ringUniforms.uLevel.value = level;
  });

  return (
    <group ref={group} position={[CX, -2.5, 0]}>
      <mesh rotation-x={-Math.PI / 2} geometry={geo} renderOrder={5}>
        <MeshReflectorMaterial
          blur={[260, 80]}
          resolution={1024}
          mixBlur={0.9}
          mixStrength={2.4}
          mirror={0.6}
          roughness={0.32}
          metalness={0.05}
          color="#3b4d46"
          depthScale={0.8}
          minDepthThreshold={0.85}
          maxDepthThreshold={1.6}
          distortion={0.45}
          distortionMap={normalTex}
          normalMap={normalTex}
          normalScale={new THREE.Vector2(0.45, 0.45)}
          transparent
          opacity={0.94}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} renderOrder={6}>
        <planeGeometry args={[W, D]} />
        <shaderMaterial vertexShader={RINGS_VERT} fragmentShader={RINGS_FRAG} uniforms={ringUniforms} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}
