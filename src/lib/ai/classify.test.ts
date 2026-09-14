import { describe, expect, it } from "vitest";
import { classifyResponse } from "@/lib/ai/classify";
import { SCRIPT } from "@/lib/simulation/script";

const scripted = (id: string) => {
  const r = SCRIPT[id].response!;
  return classifyResponse(r.text, r.lang, r.hint);
};

describe("classifyResponse on the scripted replies", () => {
  it("matches the hinted category for every scripted reply", () => {
    for (const [id, sc] of Object.entries(SCRIPT)) {
      if (!sc.response) continue;
      expect(scripted(id).category, id).toBe(sc.response.hint);
    }
  });
  it("extracts the situation for the assistance requests", () => {
    const sara = scripted("sara");
    expect(sara.urgency).toBe(5);
    expect(sara.entities).toEqual(expect.arrayContaining(["water entering premises", "accessible ramp blocked", "ground floor affected", "cannot self-evacuate"]));
    const aisha = scripted("aisha");
    expect(aisha.urgency).toBe(4);
    expect(aisha.entities).toEqual(expect.arrayContaining(["water entering premises", "ground floor affected", "alone"]));
  });
  it("reads the Arabic question mark as a clarification signal", () => {
    const noura = scripted("noura");
    expect(noura.category).toBe("clarification");
    expect(noura.confidence).toBeGreaterThanOrEqual(0.8);
    expect(noura.ai.reviewRequired).toBe(false);
  });
  it("flags a different situation for operator review", () => {
    expect(scripted("layla").ai.reviewRequired).toBe(true);
  });
});

describe("classifyResponse edge cases", () => {
  it("does not invent a safe confirmation when nothing matches", () => {
    const r = classifyResponse("الوضع سيء جداً هنا", "ar");
    expect(r.category).toBe("none");
    expect(r.ai.reviewRequired).toBe(true);
    expect(r.summary).not.toMatch(/safe/i);
  });
  it("falls back to the operator hint when the text carries no evidence", () => {
    expect(classifyResponse("الوضع سيء جداً هنا", "ar", "help").category).toBe("help");
  });
  it("ignores keywords buried inside other words", () => {
    expect(classifyResponse("The road is blocked and the lift is broken", "en").category).not.toBe("safe");
    expect(classifyResponse("There is a person here who took the bus", "en").entities).not.toContain("alone");
  });
  it("keeps confidence within the documented band", () => {
    for (const t of ["ok", "help help help help help", "", "???"]) {
      const c = classifyResponse(t, "en").confidence;
      expect(c).toBeGreaterThanOrEqual(0.55);
      expect(c).toBeLessThanOrEqual(0.97);
    }
  });
});
