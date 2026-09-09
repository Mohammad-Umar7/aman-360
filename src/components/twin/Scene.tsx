"use client";

import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CameraRig } from "@/components/twin/CameraRig";
import { District } from "@/components/twin/District";
import { Life } from "@/components/twin/Life";
import { Overlays } from "@/components/twin/Overlays";
import { Rain } from "@/components/twin/Rain";
import { Sea } from "@/components/twin/Sea";
import { Signage } from "@/components/twin/Signage";
import { SkyAndLights } from "@/components/twin/Sky";
import { Vehicles } from "@/components/twin/Vehicles";
import { Water } from "@/components/twin/Water";

/** Dev aid: lets tooling render frames on demand when the tab is hidden (no requestAnimationFrame). */
function FrameHook() {
  const advance = useThree((s) => s.advance);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __amanAdvance?: (n?: number) => void; __amanScene?: unknown; __amanErrors?: string[]; __amanGL?: unknown };
    w.__amanGL = gl;
    w.__amanAdvance = (n = 1) => {
      for (let i = 0; i < n; i++) advance(performance.now() + i * 16, true);
    };
    w.__amanScene = scene;
    w.__amanErrors = w.__amanErrors ?? [];
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      w.__amanErrors?.push(args.map((a) => (typeof a === "string" ? a : String(a))).join(" ").slice(0, 1200));
      orig(...args);
    };
    return () => {
      console.error = orig;
      delete w.__amanAdvance;
      delete w.__amanScene;
    };
  }, [advance, scene, gl]);
  return null;
}

/** The sloping shore continues east and west of the modelled district so the coastline never shows a step. */
function ShoreBeyondDistrict() {
  const geo = useMemo(() => {
    const profile: [number, number][] = [[81, 0.02], [84, -0.1], [88, -0.3], [92, -0.8], [96, -1.6], [110, -4], [140, -8], [200, -14], [260, -18]];
    const pos: number[] = [];
    for (const [x0, x1] of [
      [-1600, -190],
      [190, 1600],
    ]) {
      for (let i = 0; i < profile.length - 1; i++) {
        const [za, ya] = profile[i];
        const [zb, yb] = profile[i + 1];
        pos.push(x0, ya, za, x1, ya, za, x1, yb, zb, x0, ya, za, x1, yb, zb, x0, yb, zb);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#e2d3b1" roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function Scene({ interactive, compact, cameraMode, labels }: { interactive: boolean; compact: boolean; cameraMode?: "orbit"; labels: boolean }) {
  return (
    <>
      <FrameHook />
      <SkyAndLights />
      <District />
      <Water />
      <Sea />
      <Rain />
      <Vehicles />
      <Life labels={labels} />
      <Signage />
      <Overlays compact={compact} labels={labels} />
      <CameraRig interactive={interactive} mode={cameraMode} />
      <ShoreBeyondDistrict />
      {/* ground beyond the modelled district (kept clear of the district itself so it never caps the underpass) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.1, -800]} receiveShadow>
        <planeGeometry args={[2800, 1240]} />
        <meshStandardMaterial color="#cbbfa6" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-800, -0.1, -51]} receiveShadow>
        <planeGeometry args={[1200, 278]} />
        <meshStandardMaterial color="#cbbfa6" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[800, -0.1, -51]} receiveShadow>
        <planeGeometry args={[1200, 278]} />
        <meshStandardMaterial color="#cbbfa6" roughness={1} />
      </mesh>
      {/* sea bed beyond the modelled beach so nothing shows through the water at the district's edges */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -16, 1100]}>
        <planeGeometry args={[3400, 2100]} />
        <meshStandardMaterial color="#7d7255" roughness={1} />
      </mesh>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <N8AO aoRadius={5} intensity={2.2} distanceFalloff={1.2} quality="medium" halfRes color="#0a0f18" />
        <Bloom intensity={0.3} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.5} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SMAA />
      </EffectComposer>
    </>
  );
}
