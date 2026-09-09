"use client";

import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Suspense } from "react";
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
        camera={{ fov: 42, near: 0.5, far: 2500, position: [-150, 92, 200] }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene interactive={interactive} compact={hud === "compact"} cameraMode={cameraMode} labels={labels} />
        </Suspense>
      </Canvas>
      <Loader />
      {hud !== "none" && <TwinHUD compact={hud === "compact"} />}
    </div>
  );
}
