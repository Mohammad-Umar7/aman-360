import { describe, expect, it } from "vitest";
import { pointAlong } from "@/lib/engine/geometry";
import { LAST_STEP } from "@/lib/simulation/steps";
import { ahmedVehicle, ambulanceVehicle, cdVehicle, floodLevel, helicopter, overcast, rainIntensity } from "@/lib/simulation/visual";

const pos = (v: { path: { x: number; y: number }[]; progress: number }) => pointAlong(v.path, v.progress).p;

describe("visual helpers are continuous across step boundaries", () => {
  for (let s = 0; s < LAST_STEP; s++) {
    it(`step ${s} → ${s + 1}`, () => {
      const a = pos(ahmedVehicle(s, 1));
      const b = pos(ahmedVehicle(s + 1, 0));
      expect(a.x).toBeCloseTo(b.x, 6);
      expect(a.y).toBeCloseTo(b.y, 6);
      expect(pos(ambulanceVehicle(s, 1))).toEqual(pos(ambulanceVehicle(s + 1, 0)));
      expect(pos(cdVehicle(s, 1))).toEqual(pos(cdVehicle(s + 1, 0)));
      const h1 = helicopter(s, 1);
      const h2 = helicopter(s + 1, 0);
      expect(h1.p.x).toBeCloseTo(h2.p.x, 6);
      expect(h1.alt).toBeCloseTo(h2.alt, 6);
      expect(floodLevel(s, 1)).toBeCloseTo(floodLevel(s + 1, 0), 6);
      expect(rainIntensity(s, 1)).toBeCloseTo(rainIntensity(s + 1, 0), 6);
      expect(overcast(s, 1)).toBeCloseTo(overcast(s + 1, 0), 6);
    });
  }
  it("keeps every value finite and in range for any step and t", () => {
    for (const s of [-1, 0, 3, 8, 9]) {
      for (const t of [-0.5, 0, 0.5, 1, 1.5]) {
        for (const v of [ahmedVehicle(s, t), ambulanceVehicle(s, t), cdVehicle(s, t)]) {
          expect(v.progress).toBeGreaterThanOrEqual(0);
          expect(v.progress).toBeLessThanOrEqual(1);
        }
        for (const x of [floodLevel(s, t), rainIntensity(s, t), overcast(s, t)]) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(1);
        }
        expect(Number.isFinite(helicopter(s, t).heading)).toBe(true);
      }
    }
  });
});
