"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { publicVariants } from "@/lib/ai/personalize";
import { buildScenario } from "@/lib/simulation/scenario";
import { useSim } from "@/lib/simulation/store";

/** Variable-message sign VMS-07 on the western approach; shows the verified signage variant once published. */
export function Signage() {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 300;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [canvas]);
  const last = useRef("");

  const draw = (lines: string[], lang: "en" | "ar", live: boolean) => {
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#07090d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // LED matrix feel
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let y = 8; y < canvas.height; y += 12) for (let x = 8; x < canvas.width; x += 12) ctx.fillRect(x, y, 2, 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = lang === "ar" ? "rtl" : "ltr";
    ctx.fillStyle = live ? "#ffb347" : "#7fa3c7";
    ctx.shadowColor = live ? "rgba(255,179,71,0.8)" : "rgba(127,163,199,0.6)";
    ctx.shadowBlur = 14;
    const fs = lang === "ar" ? 64 : 58;
    ctx.font = `700 ${fs}px ${lang === "ar" ? "'Noto Sans Arabic', sans-serif" : "'JetBrains Mono', 'Inter', monospace"}`;
    const gap = canvas.height / (lines.length + 1);
    lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, gap * (i + 1)));
    texture.needsUpdate = true;
  };

  useEffect(() => {
    draw(["AL MAJAZ DISTRICT", "14:02 · 31°C", "DRIVE SAFELY"], "en", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const { step, lang } = useSim.getState();
    const key = `${step}-${lang}`;
    if (key === last.current) return;
    last.current = key;
    if (step >= 5) {
      const state = buildScenario(step);
      const v = publicVariants(state.facts).find((x) => x.channel === "signage")!;
      draw((lang === "ar" ? v.ar : v.en).split("\n"), lang, true);
    } else if (step >= 1) {
      draw(["HEAVY RAIN", "REDUCE SPEED", "EXPECT DELAYS"], "en", true);
    } else {
      draw(["AL MAJAZ DISTRICT", "14:02 · 31°C", "DRIVE SAFELY"], "en", false);
    }
  });

  // Screen face: matches VMS_Screen in blender/build_district.py (centre x=-104.34, y=-11.0, z=8.58; 6.4 × 2.5, facing west)
  return (
    <mesh position={[-104.37, 8.58, 11.0]} rotation-y={-Math.PI / 2}>
      <planeGeometry args={[6.4, 2.5]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
