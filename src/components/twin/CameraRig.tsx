"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { pointAlong } from "@/lib/engine/geometry";
import { useSim } from "@/lib/simulation/store";
import { ahmedVehicle, ambulanceVehicle } from "@/lib/simulation/visual";
import { CAMERA_PRESETS, type CamPose } from "@/lib/twin/coords";

const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

function autoPose(step: number, t: number): CamPose | "ahmed" | "ambulance" {
  switch (step) {
    case 0:
      return CAMERA_PRESETS.overview;
    case 1:
      return t < 0.5 ? CAMERA_PRESETS.underpass : CAMERA_PRESETS.closure;
    case 2:
      return CAMERA_PRESETS.closure;
    case 3:
      return CAMERA_PRESETS.impact;
    case 4:
      return "ahmed";
    case 5:
      return t < 0.5 ? "ahmed" : CAMERA_PRESETS.residence;
    case 6:
      return CAMERA_PRESETS.residence;
    case 7:
      return t < 0.25 ? CAMERA_PRESETS.hospital : "ambulance";
    default:
      return CAMERA_PRESETS.overview;
  }
}

function followPose(kind: "ahmed" | "ambulance", step: number, t: number, out: { pos: THREE.Vector3; target: THREE.Vector3 }) {
  const v = kind === "ahmed" ? ahmedVehicle(step, t) : ambulanceVehicle(step, t);
  const { p, heading } = pointAlong(v.path, v.progress);
  const fx = Math.cos(heading);
  const fz = -Math.sin(heading);
  // behind-and-above, slightly offset to the side for a cinematic three-quarter view
  out.pos.set(p.x - fx * 30 - fz * 14, 14, -p.y - fz * 30 + fx * 14);
  out.target.set(p.x + fx * 12, 1.5, -p.y + fz * 12);
}

export function CameraRig({ interactive, mode }: { interactive: boolean; mode?: "orbit" }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const userControl = useRef(false);
  const lastKey = useRef("");
  const desired = useRef({ pos: new THREE.Vector3(-150, 92, 200), target: new THREE.Vector3(10, 6, -5) });

  useEffect(() => {
    const unsub = useSim.subscribe((s, prev) => {
      if (s.camera !== prev.camera || s.step !== prev.step) userControl.current = false;
    });
    return unsub;
  }, []);

  useFrame((st, dt) => {
    if (mode === "orbit") {
      const a = st.clock.getElapsedTime() * 0.045 - 2.4;
      const r = 235;
      camera.position.set(Math.cos(a) * r, 96, Math.sin(a) * r);
      camera.lookAt(8, 4, 0);
      return;
    }
    const { step, t, camera: preset } = useSim.getState();
    let pose: CamPose | "ahmed" | "ambulance";
    if (preset === "auto") pose = autoPose(step, t);
    else if (preset === "follow") pose = step >= 7 ? "ambulance" : "ahmed";
    else pose = CAMERA_PRESETS[preset] ?? CAMERA_PRESETS.overview;

    const key = typeof pose === "string" ? pose : JSON.stringify(pose);
    if (key !== lastKey.current) {
      lastKey.current = key;
      userControl.current = false;
    }
    if (userControl.current) return;

    if (typeof pose === "string") followPose(pose, step, t, desired.current);
    else {
      desired.current.pos.set(...pose.pos);
      desired.current.target.set(...pose.target);
    }
    const k = 1 - Math.exp(-dt * (typeof pose === "string" ? 3.2 : 1.9));
    tmpPos.copy(camera.position).lerp(desired.current.pos, k);
    camera.position.copy(tmpPos);
    if (controls.current) {
      tmpTarget.copy(controls.current.target).lerp(desired.current.target, k);
      controls.current.target.copy(tmpTarget);
      controls.current.update();
    }
  });

  if (mode === "orbit") return null;
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={interactive}
      enableDamping
      dampingFactor={0.08}
      minDistance={12}
      maxDistance={520}
      maxPolarAngle={1.45}
      onStart={() => {
        userControl.current = true;
      }}
    />
  );
}
