import { beforeEach, describe, expect, it } from "vitest";
import { clampStep, useSim } from "@/lib/simulation/store";
import { LAST_STEP, STEPS } from "@/lib/simulation/steps";
import { buildScenario } from "@/lib/simulation/scenario";

beforeEach(() => useSim.getState().reset());

describe("clampStep", () => {
  it("clamps and rounds numbers and rejects NaN", () => {
    expect(clampStep(-3)).toBe(0);
    expect(clampStep(99)).toBe(LAST_STEP);
    expect(clampStep(2.6)).toBe(3);
    expect(clampStep(Number.NaN)).toBe(0);
    expect(clampStep(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("useSim", () => {
  it("never stores an invalid step", () => {
    useSim.getState().setStep(Number.NaN);
    expect(useSim.getState().step).toBe(0);
    useSim.getState().setStep(42);
    expect(useSim.getState().step).toBe(LAST_STEP);
    expect(buildScenario(Number.NaN).step.index).toBe(0);
  });

  it("advances through steps on the clock and stops at the end", () => {
    const s = useSim.getState();
    s.play();
    s.tick(STEPS[0].durationSec / 2);
    expect(useSim.getState().step).toBe(0);
    expect(useSim.getState().t).toBeCloseTo(0.5);
    s.tick(STEPS[0].durationSec);
    expect(useSim.getState().step).toBe(1);
    // half of step 0 was left over and is carried into step 1
    expect(useSim.getState().t).toBeCloseTo((STEPS[0].durationSec / 2) / STEPS[1].durationSec);
    useSim.getState().setStep(LAST_STEP);
    useSim.getState().play();
    useSim.getState().tick(STEPS[LAST_STEP].durationSec + 1);
    expect(useSim.getState().playing).toBe(false);
    expect(useSim.getState().t).toBe(1);
  });

  it("ignores paused, zero and invalid ticks", () => {
    useSim.getState().tick(1);
    expect(useSim.getState().t).toBe(0);
    useSim.getState().play();
    useSim.getState().tick(0);
    useSim.getState().tick(-1);
    useSim.getState().tick(Number.NaN);
    expect(useSim.getState().t).toBe(0);
  });

  it("restarts from the beginning when play is pressed after the end", () => {
    useSim.getState().setStep(LAST_STEP);
    useSim.getState().play();
    useSim.getState().tick(60);
    expect(useSim.getState().playing).toBe(false);
    useSim.getState().toggle();
    expect(useSim.getState()).toMatchObject({ step: 0, t: 0, playing: true });
  });

  it("clears selection and playback on reset", () => {
    useSim.getState().selectPerson("sara");
    useSim.getState().setStep(4);
    useSim.getState().setCamera("underpass");
    useSim.getState().play();
    useSim.getState().reset();
    expect(useSim.getState()).toMatchObject({ step: 0, t: 0, playing: false, selectedPersonId: null, started: false, camera: "auto" });
  });
});
