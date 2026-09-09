"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DISTRICT_URL } from "@/components/twin/District";
import { UNDERPASS } from "@/lib/data/district";
import { useSim } from "@/lib/simulation/store";
import { floodLevel } from "@/lib/simulation/visual";

const VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  void main() {
    vec3 p = position;
    float w = sin(p.x * 0.35 + uTime * 1.6) * 0.045 + sin(p.y * 0.9 - uTime * 2.1) * 0.03 + sin((p.x + p.y) * 0.6 + uTime * 1.1) * 0.025;
    p.z += w;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform float uOpacity;
  uniform vec3 uSun;
  varying vec3 vWorld;
  void main() {
    vec3 n = normalize(vec3(sin(vWorld.x * 0.7 + uTime * 1.3) * 0.09, 1.0, cos(vWorld.z * 1.1 - uTime * 1.7) * 0.09));
    vec3 v = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    vec3 h = normalize(normalize(uSun) + v);
    float spec = pow(max(dot(n, h), 0.0), 90.0);
    float ripple = 0.5 + 0.5 * sin(vWorld.x * 2.0 + uTime * 2.0) * sin(vWorld.z * 3.0 - uTime * 1.4);
    vec3 col = mix(uDeep, uShallow, clamp(fres * 0.75 + ripple * 0.10, 0.0, 1.0));
    col += spec * 0.55;
    gl_FragColor = vec4(col, clamp(uOpacity + fres * 0.12, 0.0, 1.0));
  }
`;

export function Water() {
  const { scene } = useGLTF(DISTRICT_URL);
  const node = useMemo(() => scene.getObjectByName("Water_Underpass") ?? null, [scene]);
  const ref = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShallow: { value: new THREE.Color("#6b8a86") },
      uDeep: { value: new THREE.Color("#2f4a45") },
      uOpacity: { value: 0.86 },
      uSun: { value: new THREE.Vector3(120, 160, 80) },
    }),
    [],
  );
  useFrame((st) => {
    uniforms.uTime.value = st.clock.getElapsedTime();
    const { step, t } = useSim.getState();
    const level = node ? node.position.y : -2.5;
    if (ref.current) {
      ref.current.position.y = level;
      ref.current.visible = floodLevel(step, t) > 0.02;
    }
  });
  const cx = (UNDERPASS.x0 - 2 + UNDERPASS.x1 + 2) / 2;
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position={[cx, -2.5, 0]} renderOrder={5}>
      <planeGeometry args={[UNDERPASS.x1 - UNDERPASS.x0 + 4, 16.2, 96, 12]} />
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}
