"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DISTRICT_URL } from "@/components/twin/District";
import { SKY } from "@/components/twin/Sky";
import { UNDERPASS } from "@/lib/data/district";
import { useSim } from "@/lib/simulation/store";
import { floodLevel, overcast, rainIntensity } from "@/lib/simulation/visual";

const W = UNDERPASS.x1 - UNDERPASS.x0 + 4;
const D = 16.2;
const CX = (UNDERPASS.x0 - 2 + UNDERPASS.x1 + 2) / 2;

const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
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
`;

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uRain;
  varying vec3 vWorld;
  varying vec3 vNormal;
  ${NOISE}
  float height(vec2 p) {
    float h = 0.0;
    h += sin(p.x * 0.55 + uTime * 1.3) * 0.035;
    h += sin(p.y * 1.4 - uTime * 1.7 + p.x * 0.2) * 0.022;
    h += (vnoise(p * 0.45 + vec2(uTime * 0.25, -uTime * 0.18)) - 0.5) * 0.09;
    h += (vnoise(p * 1.6 + vec2(-uTime * 0.6, uTime * 0.4)) - 0.5) * 0.03 * (0.4 + uRain);
    return h;
  }
  void main() {
    vec3 p = position;                       // plane local: x along the road, y across, z up (pre-rotation)
    vec2 q = p.xy;
    float h = height(q);
    float e = 0.35;
    float hx = height(q + vec2(e, 0.0)) - height(q - vec2(e, 0.0));
    float hy = height(q + vec2(0.0, e)) - height(q - vec2(0.0, e));
    p.z += h;
    // local normal in plane space, then to world (plane is rotated -90deg about X: local y -> world -z, local z -> world y)
    vec3 nl = normalize(vec3(-hx / (2.0 * e), -hy / (2.0 * e), 1.0));
    vNormal = normalize(vec3(nl.x, nl.z, -nl.y));
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uRain;
  uniform float uLevel;
  uniform float uOvercast;
  uniform vec3 uSky;
  uniform vec3 uSun;
  varying vec3 vWorld;
  varying vec3 vNormal;
  ${NOISE}

  void main() {
    vec2 p = vWorld.xz;
    // fine ripples layered on the vertex waves
    float r1 = vnoise(p * 2.2 + vec2(uTime * 0.9, uTime * 0.5));
    float r2 = vnoise(p * 4.5 - vec2(uTime * 1.4, uTime * 0.8));
    vec3 n = normalize(vNormal + vec3((r1 - 0.5) * 0.5, 0.0, (r2 - 0.5) * 0.5) * (0.6 + 0.6 * uRain));

    // rain rings
    float rings = 0.0;
    vec2 cell = floor(p / 1.4);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 c = cell + vec2(float(i), float(j));
      float hsh = hash(c);
      vec2 centre = (c + 0.5 + 0.4 * vec2(hash(c + 3.1) - 0.5, hash(c + 7.7) - 0.5)) * 1.4;
      float life = fract(uTime * (0.7 + hsh * 0.6) + hsh * 7.0);
      float r = life * 0.7;
      float d = distance(p, centre);
      rings += smoothstep(0.05, 0.0, abs(d - r)) * (1.0 - life) * (1.0 - life) * step(hsh, 0.2 + uRain * 0.45);
    }
    n = normalize(n + vec3(rings * 0.35, 0.0, rings * 0.25));

    float depth = uLevel - floorZ(vWorld.x);
    float murk = smoothstep(0.0, 1.5, depth);
    vec3 v = normalize(cameraPosition - vWorld);
    float ndv = clamp(dot(n, v), 0.0, 1.0);
    float fres = 0.06 + 0.7 * pow(clamp(1.0 - ndv, 0.0, 1.0), 3.5);

    // turbid flood water: silty brown-green, darker where deep (constants are linear-space)
    vec3 shallowCol = vec3(0.20, 0.17, 0.07);
    vec3 deepCol = vec3(0.020, 0.036, 0.024);
    float swirl = vnoise(p * 0.18 + vec2(uTime * 0.05, -uTime * 0.03));
    vec3 body = mix(shallowCol, deepCol, murk);
    body = mix(body, body * vec3(1.35, 1.1, 0.7), swirl * 0.6);
    vec3 skyRef = mix(uSky, uSky * 0.55, uOvercast * 0.5);
    vec3 col = mix(body, skyRef, fres);

    // sun / sky sheen on the ripples
    vec3 h = normalize(normalize(uSun) + v);
    float ndh = clamp(dot(n, h), 0.0, 1.0);
    float spec = pow(ndh, 90.0) * (1.0 - 0.75 * uOvercast) * 1.1;
    float sheen = pow(ndh, 6.0) * 0.06;
    col += vec3(1.0, 0.97, 0.9) * spec + skyRef * sheen;

    // foam along the walls and at the waterline on the ramps; ring highlights
    float edge = smoothstep(7.1, 8.05, abs(vWorld.z));
    float shallow = 1.0 - smoothstep(0.0, 0.3, depth);
    float foamN = vnoise(p * 3.0 + vec2(uTime * 0.3, 0.0));
    col = mix(col, vec3(0.62, 0.66, 0.60), (edge * 0.45 + shallow * 0.6) * (0.5 + 0.5 * foamN));
    col += vec3(0.7, 0.8, 0.9) * rings * uRain * 0.45;

    float alpha = mix(0.55, 0.97, murk);
    gl_FragColor = vec4(col, alpha);
  }
`;

/** Floating debris (leaves, litter) drifting slowly with the flow. */
function Debris({ count = 40 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ x: (Math.random() - 0.5) * (W - 6), z: (Math.random() - 0.5) * (D - 3), r: Math.random() * Math.PI, s: 0.6 + Math.random() * 1.0, v: 0.15 + Math.random() * 0.25, i })),
    [count],
  );
  const m = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = st.clock.getElapsedTime();
    for (const d of seeds) {
      const span = W - 4;
      const x = ((((d.x + t * d.v + span / 2) % span) + span) % span) - span / 2;
      m.position.set(x, 0.06 + Math.sin(t * 1.3 + d.i) * 0.02, d.z + Math.sin(t * 0.4 + d.i) * 0.6);
      m.rotation.set(-Math.PI / 2, 0, d.r + t * 0.1);
      m.scale.setScalar(d.s);
      m.updateMatrix();
      mesh.setMatrixAt(d.i, m.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} renderOrder={7}>
      <planeGeometry args={[0.5, 0.3]} />
      <meshStandardMaterial color="#3a2e1f" roughness={0.9} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

export function Water() {
  const { scene } = useGLTF(DISTRICT_URL, "/draco/");
  const node = useMemo(() => scene.getObjectByName("Water_Underpass") ?? null, [scene]);
  const group = useRef<THREE.Group>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRain: { value: 0 },
      uLevel: { value: -2.5 },
      uOvercast: { value: 0 },
      uSky: { value: new THREE.Color("#dbe7f2") },
      uSun: { value: new THREE.Vector3(120, 170, 90) },
    }),
    [],
  );

  const mat = useRef<THREE.ShaderMaterial>(null);

  useFrame((st) => {
    const { step, t } = useSim.getState();
    const level = node ? node.position.y : -2.5;
    if (group.current) {
      group.current.position.y = level;
      group.current.visible = floodLevel(step, t) > 0.02;
    }
    // update the material's own uniform holders (the reconciler may copy the uniforms object)
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value = st.clock.getElapsedTime();
    u.uRain.value = rainIntensity(step, t);
    u.uLevel.value = level;
    u.uOvercast.value = overcast(step, t);
    (u.uSky.value as THREE.Color).copy(SKY.horizon);
  });

  return (
    <group ref={group} position={[CX, -2.5, 0]}>
      <mesh rotation-x={-Math.PI / 2} renderOrder={5}>
        <planeGeometry args={[W, D, 160, 24]} />
        <shaderMaterial ref={mat} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent depthWrite={false} />
      </mesh>
      <Debris />
    </group>
  );
}
