"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSim } from "@/lib/simulation/store";
import { overcast, rainIntensity } from "@/lib/simulation/visual";
import { SKY } from "@/components/twin/Sky";

/** Water level (world y) and the shore line (world z = -north). */
export const SEA_LEVEL = -0.32;
export const SHORE_Z = 88;

const COMMON = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  // layered swell — no regular sine grids
  float waveH(vec2 p, float t) {
    float h = 0.0;
    h += (vnoise(p * 0.035 + vec2(t * 0.05, t * 0.035)) - 0.5) * 1.1;
    h += (vnoise(p * 0.09 + vec2(-t * 0.11, t * 0.08)) - 0.5) * 0.5;
    h += (vnoise(p * 0.26 + vec2(t * 0.22, -t * 0.17)) - 0.5) * 0.2;
    h += (vnoise(p * 0.8 + vec2(-t * 0.45, t * 0.3)) - 0.5) * 0.07;
    return h;
  }
  // sea-bed profile, mirrored from the sloping beach in blender/gen_streets.py (world z = -north)
  float sandZ(float z) {
    if (z < 81.0) return 0.02;
    if (z < 84.0) return mix(0.02, -0.1, (z - 81.0) / 3.0);
    if (z < 88.0) return mix(-0.1, -0.3, (z - 84.0) / 4.0);
    if (z < 92.0) return mix(-0.3, -0.8, (z - 88.0) / 4.0);
    if (z < 96.0) return mix(-0.8, -1.6, (z - 92.0) / 4.0);
    if (z < 110.0) return mix(-1.6, -4.0, (z - 96.0) / 14.0);
    if (z < 140.0) return mix(-4.0, -8.0, (z - 110.0) / 30.0);
    if (z < 200.0) return mix(-8.0, -14.0, (z - 140.0) / 60.0);
    return -14.0 - (z - 200.0) * 0.06;
  }
`;

const VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  ${COMMON}
  #include <fog_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    wp.y += waveH(wp.xz, uTime);
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOvercast;
  uniform float uRain;
  uniform vec3 uSky;
  uniform vec3 uSun;
  uniform float uLevel;
  varying vec3 vWorld;
  ${COMMON}
  #include <fog_pars_fragment>

  void main() {
    vec2 p = vWorld.xz;
    // normal from the same height field (analytic finite differences) plus fine ripple detail
    float e = 0.45;
    float hx = waveH(p + vec2(e, 0.0), uTime) - waveH(p - vec2(e, 0.0), uTime);
    float hz = waveH(p + vec2(0.0, e), uTime) - waveH(p - vec2(0.0, e), uTime);
    float r1 = vnoise(p * 1.9 + vec2(uTime * 0.7, -uTime * 0.5)) - 0.5;
    float r2 = vnoise(p * 3.7 - vec2(uTime * 1.1, uTime * 0.6)) - 0.5;
    vec3 n = normalize(vec3(-hx / (2.0 * e) + r1 * 0.18 * (0.5 + uRain), 1.0, -hz / (2.0 * e) + r2 * 0.14 * (0.5 + uRain)));

    float depth = (uLevel + waveH(p, uTime)) - sandZ(vWorld.z);
    float deepF = 1.0 - exp(-max(depth, 0.0) * 0.28);

    // linear-space colours; storm variants are desaturated and darker
    vec3 shallowC = mix(vec3(0.09, 0.42, 0.42), vec3(0.16, 0.24, 0.24), uOvercast);
    vec3 midC = mix(vec3(0.02, 0.19, 0.30), vec3(0.06, 0.11, 0.14), uOvercast);
    vec3 deepC = mix(vec3(0.004, 0.05, 0.11), vec3(0.015, 0.03, 0.045), uOvercast);
    vec3 sandC = vec3(0.55, 0.45, 0.28);
    vec3 body = mix(shallowC, midC, smoothstep(0.0, 0.55, deepF));
    body = mix(body, deepC, smoothstep(0.45, 1.0, deepF));
    // sand showing through very shallow water
    body = mix(sandC * 0.8, body, smoothstep(0.0, 0.9, depth));

    vec3 v = normalize(cameraPosition - vWorld);
    float ndv = clamp(dot(n, v), 0.0, 1.0);
    float fres = 0.04 + 0.6 * pow(clamp(1.0 - ndv, 0.0, 1.0), 4.0);
    vec3 col = mix(body, uSky, fres);

    // sun glints (clear weather) and a broad sheen
    vec3 h = normalize(normalize(uSun) + v);
    float ndh = clamp(dot(n, h), 0.0, 1.0);
    col += vec3(1.0, 0.96, 0.85) * pow(ndh, 220.0) * (1.0 - 0.9 * uOvercast) * 1.4;
    col += uSky * pow(ndh, 8.0) * 0.05;

    // foam: the waterline, and breaking-wave streaks running onto the beach
    float shoreN = vnoise(p * vec2(0.9, 2.5) + vec2(uTime * 0.25, 0.0));
    float waterline = smoothstep(0.55, 0.0, depth) * (0.45 + 0.55 * shoreN);
    float breaker = smoothstep(0.86, 1.0, sin(vWorld.z * 0.42 - uTime * 1.1 + shoreN * 2.2)) * smoothstep(116.0, 92.0, vWorld.z) * (0.3 + 0.7 * vnoise(p * 0.7 + uTime * 0.2));
    float foam = clamp(waterline + breaker * 0.7, 0.0, 1.0);
    col = mix(col, vec3(0.78, 0.8, 0.78), foam * 0.85);

    float alpha = mix(0.35, 1.0, smoothstep(-0.05, 0.25, depth));
    gl_FragColor = vec4(col, alpha);
    #include <fog_fragment>
  }
`;

export function Sea() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOvercast: { value: 0 },
      uRain: { value: 0 },
      uSky: { value: new THREE.Color("#dbe7f2") },
      uSun: { value: new THREE.Vector3(120, 170, 90) },
      uLevel: { value: SEA_LEVEL },
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    }),
    [],
  );
  useFrame((st) => {
    const { step, t } = useSim.getState();
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value = st.clock.getElapsedTime();
    u.uOvercast.value = overcast(step, t);
    u.uRain.value = rainIntensity(step, t);
    (u.uSky.value as THREE.Color).copy(SKY.horizon);
  });
  // wide enough to reach the fog horizon in every direction; starts at the shore line
  const depth = 1900;
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, SEA_LEVEL, SHORE_Z - 14 + depth / 2]} frustumCulled={false}>
      <planeGeometry args={[3200, depth + 28, 220, 170]} />
      <shaderMaterial ref={mat} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent fog />
    </mesh>
  );
}
