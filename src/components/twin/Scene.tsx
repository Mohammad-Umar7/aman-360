"use client";

import { CameraRig } from "@/components/twin/CameraRig";
import { District } from "@/components/twin/District";
import { Overlays } from "@/components/twin/Overlays";
import { Rain } from "@/components/twin/Rain";
import { Signage } from "@/components/twin/Signage";
import { SkyAndLights } from "@/components/twin/Sky";
import { Vehicles } from "@/components/twin/Vehicles";
import { Water } from "@/components/twin/Water";

export function Scene({ interactive, compact, cameraMode, labels }: { interactive: boolean; compact: boolean; cameraMode?: "orbit"; labels: boolean }) {
  return (
    <>
      <SkyAndLights />
      <District />
      <Water />
      <Rain />
      <Vehicles />
      <Signage />
      <Overlays compact={compact} labels={labels} />
      <CameraRig interactive={interactive} mode={cameraMode} />
      {/* ground beyond the modelled district */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.08} receiveShadow>
        <circleGeometry args={[1600, 48]} />
        <meshStandardMaterial color="#cbbfa6" roughness={1} />
      </mesh>
    </>
  );
}
