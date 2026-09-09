"use client";

import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useEffect, useState } from "react";
import { Scene } from "@/components/twin/Scene";
import { TwinHUD } from "@/components/twin/TwinHUD";
import { cn } from "@/lib/utils";

function Loader() {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm">
      <div className="w-[260px] text-center">
        <div className="eyebrow mb-2">Loading digital twin</div>
        <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <div className="h-full bg-brand transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-[12px] text-ink-3 num">{Math.round(progress)}% · Blender district model</div>
      </div>
    </div>
  );
}

/** Dev-only: surfaces WebGL/shader errors and the water state on screen so they can be checked without devtools. */
function DevDiagnostics() {
  const [info, setInfo] = useState<string[]>([]);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    const id = window.setInterval(() => {
      const w = window as unknown as { __amanErrors?: string[]; __amanScene?: THREE.Scene; __amanGL?: THREE.WebGLRenderer };
      const errs = (w.__amanErrors ?? []).filter((e) => /THREE|shader|Shader|GLSL|WebGL/.test(e)).slice(-2).map((e) => e.replace(/\s+/g, " ").slice(0, 220));
      // programs that failed to compile/link, straight from the renderer
      type Prog = { diagnostics?: { runnable: boolean; programLog?: string; fragmentShader?: { log?: string }; vertexShader?: { log?: string }; material?: { type?: string; name?: string } } };
      const progs = ((w.__amanGL?.info.programs ?? []) as unknown as Prog[]).filter((p) => p.diagnostics && !p.diagnostics.runnable);
      for (const p of progs) {
        const d = p.diagnostics!;
        errs.push(`program failed (${d.material?.type ?? "?"}): ${(d.fragmentShader?.log || d.vertexShader?.log || d.programLog || "").replace(/\s+/g, " ").slice(0, 260)}`);
      }
      let water = "water: none";
      w.__amanScene?.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
        if (m?.uniforms?.uLevel) water = `water: visible=${o.visible && (o.parent?.visible ?? true)} y=${o.parent?.position.y.toFixed(2)} level=${Number(m.uniforms.uLevel.value).toFixed(2)} culled=${(o as THREE.Mesh).frustumCulled} programs=${w.__amanGL?.info.programs?.length ?? "?"}`;
      });
      setInfo([water, ...errs]);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  if (process.env.NODE_ENV === "production" || info.length === 0) return null;
  return (
    <div className="pointer-events-none absolute left-2 bottom-2 z-30 max-w-[520px] rounded-md bg-black/70 px-2 py-1 font-mono text-[10px] leading-4 text-[#ffb3ae]">
      {info.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

export interface DigitalTwinProps {
  className?: string;
  hud?: "full" | "compact" | "none";
  interactive?: boolean;
  /** Override the store camera (e.g. a slow orbit for the landing hero). */
  cameraMode?: "orbit";
  labels?: boolean;
}

export default function DigitalTwin({ className, hud = "full", interactive = true, cameraMode, labels = true }: DigitalTwinProps) {
  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-[#0b1220]", className)}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05, outputColorSpace: THREE.SRGBColorSpace, powerPreference: "high-performance" }}
        camera={{ fov: 42, near: 0.5, far: 9000, position: [-150, 92, 200] }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene interactive={interactive} compact={hud === "compact"} cameraMode={cameraMode} labels={labels} />
        </Suspense>
      </Canvas>
      <Loader />
      {hud === "full" && <DevDiagnostics />}
      {hud !== "none" && <TwinHUD compact={hud === "compact"} />}
    </div>
  );
}
