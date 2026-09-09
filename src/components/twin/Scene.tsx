"use client";

import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { CameraRig } from "@/components/twin/CameraRig";
import { District } from "@/components/twin/District";
import { Overlays } from "@/components/twin/Overlays";
import { Rain } from "@/components/twin/Rain";
import { Sea } from "@/components/twin/Sea";
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
      <Sea />
      <Rain />
      <Vehicles />
      <Signage />
      <Overlays compact={compact} labels={labels} />
      <CameraRig interactive={interactive} mode={cameraMode} />
      {/* ground beyond the modelled district */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.1, -600]} receiveShadow>
        <planeGeometry args={[2400, 1400]} />
        <meshStandardMaterial color="#cbbfa6" roughness={1} />
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
