"use client";

import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { buildScenario } from "@/lib/simulation/scenario";
import { LAST_STEP, STEPS } from "@/lib/simulation/steps";
import type { Lang, ScenarioState } from "@/lib/types";

export type CameraPreset = "auto" | "overview" | "underpass" | "closure" | "impact" | "residence" | "hospital" | "corniche" | "follow";

export type TwinLayer = "hazard" | "routes" | "people" | "units" | "sensors" | "life";
export const TWIN_LAYERS: { id: TwinLayer; label: string }[] = [
  { id: "hazard", label: "Hazard polygon" },
  { id: "routes", label: "Routes" },
  { id: "people", label: "People" },
  { id: "units", label: "Response units" },
  { id: "sensors", label: "Sensors & broadcast" },
  { id: "life", label: "Traffic & activity" },
];

interface SimStore {
  step: number;
  /** progress within the current step (0..1) — drives animation only */
  t: number;
  playing: boolean;
  lang: Lang;
  selectedPersonId: string | null;
  camera: CameraPreset;
  started: boolean;
  layers: Record<TwinLayer, boolean>;
  toggleLayer: (l: TwinLayer) => void;
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

/** Clamp any input (deep-link strings, NaN, out-of-range numbers) to a valid step index. */
export const clampStep = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(LAST_STEP, Math.round(n))) : 0);

/** Playback has run to the end of the storyline. */
const atEnd = (s: { step: number; t: number }) => s.step >= LAST_STEP && s.t >= 1;

export const useSim = create<SimStore>((set, get) => ({
  step: 0,
  t: 0,
  playing: false,
  lang: "en",
  selectedPersonId: null,
  camera: "auto",
  started: false,
  layers: { hazard: true, routes: true, people: true, units: true, sensors: true, life: true },
  toggleLayer: (l) => set((s) => ({ layers: { ...s.layers, [l]: !s.layers[l] } })),
  setStep: (n) => {
    const step = clampStep(n);
    set({ step, t: 0, started: step > 0 || get().started });
  },
  next: () => {
    const { step } = get();
    if (step >= LAST_STEP) return set({ playing: false, t: 1 });
    set({ step: step + 1, t: 0, started: true });
  },
  prev: () => set((s) => ({ step: Math.max(0, s.step - 1), t: 0 })),
  reset: () => set({ step: 0, t: 0, playing: false, started: false, selectedPersonId: null }),
  play: () => set((s) => (atEnd(s) ? { step: 0, t: 0, playing: true, started: true } : { playing: true, started: true })),
  pause: () => set({ playing: false }),
  toggle: () => set((s) => (s.playing ? { playing: false } : atEnd(s) ? { step: 0, t: 0, playing: true, started: true } : { playing: true, started: true })),
  tick: (dt) => {
    const { step, t, playing } = get();
    if (!playing || !Number.isFinite(dt) || dt <= 0) return;
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

/** Mount once: drives autoplay on a wall-clock timer (keeps advancing even when frames are throttled). */
export function useSimulationClock() {
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      useSim.getState().tick(dt);
    }, 40);
    return () => window.clearInterval(id);
  }, []);
}

export const stepMeta = (n: number) => STEPS[clampStep(n)];
