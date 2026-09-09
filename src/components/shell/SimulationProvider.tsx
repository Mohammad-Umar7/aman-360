"use client";

import { useEffect } from "react";
import { useSim, useSimulationClock } from "@/lib/simulation/store";

/** Drives autoplay and keyboard shortcuts for the command centre. Mount once. */
export function SimulationProvider({ children }: { children: React.ReactNode }) {
  useSimulationClock();
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
