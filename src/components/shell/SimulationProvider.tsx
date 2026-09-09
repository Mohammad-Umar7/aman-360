"use client";

import { useEffect } from "react";
import { useSim, useSimulationClock } from "@/lib/simulation/store";

/** Drives autoplay and keyboard shortcuts for the command centre. Mount once. */
export function SimulationProvider({ children }: { children: React.ReactNode }) {
  useSimulationClock();
  // Deep links for demos: /command/twin?step=6&cam=underpass&play=1
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const s = useSim.getState();
    const step = sp.get("step");
    if (step !== null && /^[0-8]$/.test(step)) s.setStep(Number(step));
    const cam = sp.get("cam");
    if (cam && ["auto", "overview", "underpass", "closure", "impact", "residence", "hospital", "follow"].includes(cam)) s.setCamera(cam as Parameters<typeof s.setCamera>[0]);
    if (sp.get("play") === "1") s.play();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const s = useSim.getState();
      if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        s.toggle();
      } else if (e.key === "ArrowRight") s.next();
      else if (e.key === "ArrowLeft") s.prev();
      else if (e.key.toLowerCase() === "r") s.reset();
      else if (/^[0-8]$/.test(e.key)) s.setStep(Number(e.key));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return <>{children}</>;
}
