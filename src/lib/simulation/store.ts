"use client";

import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { buildScenario } from "@/lib/simulation/scenario";
import { LAST_STEP, STEPS } from "@/lib/simulation/steps";
import type { Lang, ScenarioState } from "@/lib/types";

export type CameraPreset = "overview" | "underpass" | "residence" | "hospital" | "follow";

interface SimStore {
  step: number;
  /** progress within the current step (0..1) — drives animation only */
  t: number;
  playing: boolean;
  lang: Lang;
  selectedPersonId: string | null;
  camera: CameraPreset;
  started: boolean;
  setStep: (n: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  tick: (dt: number) => void;
  setLang: (l: Lang) => void;
  selectPerson: (id: string | null) => void;
  setCamera: (c: CameraPreset) => void;
}

export const useSim = create<SimStore>((set, get) => ({
  step: 0,
  t: 0,
  playing: false,
  lang: "en",
  selectedPersonId: null,
  camera: "overview",
  started: false,
  setStep: (n) => set({ step: Math.max(0, Math.min(LAST_STEP, n)), t: 0, started: n > 0 || get().started }),
  next: () => {
    const { step } = get();
    if (step >= LAST_STEP) return set({ playing: false, t: 1 });
    set({ step: step + 1, t: 0, started: true });
  },
  prev: () => set((s) => ({ step: Math.max(0, s.step - 1), t: 0 })),
  reset: () => set({ step: 0, t: 0, playing: false, started: false, selectedPersonId: null }),
  play: () => set({ playing: true, started: true }),
  pause: () => set({ playing: false }),
  toggle: () => set((s) => ({ playing: !s.playing, started: true })),
  tick: (dt) => {
    const { step, t, playing } = get();
    if (!playing) return;
    const duration = STEPS[step].durationSec;
    const nt = t + dt / duration;
    if (nt >= 1) {
      if (step >= LAST_STEP) set({ t: 1, playing: false });
      else set({ step: step + 1, t: 0 });
    } else set({ t: nt });
  },
  setLang: (lang) => set({ lang }),
  selectPerson: (id) => set({ selectedPersonId: id }),
  setCamera: (camera) => set({ camera }),
}));

/** Memoised scenario state for the current step. */
export function useScenario(): ScenarioState {
  const step = useSim((s) => s.step);
  return useMemo(() => buildScenario(step), [step]);
}

/** Mount once: drives autoplay with requestAnimationFrame. */
export function useSimulationClock() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      useSim.getState().tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

export const stepMeta = (n: number) => STEPS[Math.max(0, Math.min(LAST_STEP, n))];
