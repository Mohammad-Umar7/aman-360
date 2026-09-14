import { describe, expect, it } from "vitest";
import { CLAIMS, SOURCES, SUBJECTS } from "@/lib/data/sources";
import { assuranceScore, detectContradictions, verifyFacts } from "@/lib/engine/assurance";

const claims = CLAIMS.map((c) => {
  const copy: Partial<typeof c> = { ...c };
  delete copy.receivedSec;
  return copy as (typeof CLAIMS)[number];
});

describe("source data", () => {
  it("references known sources and subjects", () => {
    const src = new Set(SOURCES.map((s) => s.id));
    for (const c of CLAIMS) {
      expect(src.has(c.sourceId), c.id).toBe(true);
      expect(SUBJECTS[c.subject], c.subject).toBeDefined();
    }
    expect(new Set(CLAIMS.map((c) => c.id)).size).toBe(CLAIMS.length);
  });
});

describe("detectContradictions", () => {
  it("finds the police/portal disagreement and lets the authoritative source win", () => {
    const out = detectContradictions(claims, "14:05:52");
    expect(out).toHaveLength(1);
    const [c] = out;
    expect(c.subject).toBe("road:al-majaz-underpass");
    expect(c.winningClaimId).toBe("clm-police-1");
    expect(c.claims.map((x) => x.id).sort()).toEqual(["clm-police-1", "clm-web-1"]);
    expect(c.rationale.join(" ")).toMatch(/stale/);
  });
  it("ignores subjects with a single definitive claim", () => {
    const only = claims.filter((c) => c.id !== "clm-web-1");
    expect(detectContradictions(only, "x")).toHaveLength(0);
  });
});

describe("verifyFacts", () => {
  it("publishes one verified fact per subject from the winning claim", () => {
    const ctr = detectContradictions(claims, "x");
    const facts = verifyFacts(claims, ctr, "14:05:55");
    expect(facts.map((f) => f.subject).sort()).toEqual(Object.keys(SUBJECTS).sort());
    const road = facts.find((f) => f.subject === "road:al-majaz-underpass")!;
    expect(road.sourceId).toBe("src-police");
    expect(road.value).toMatch(/^CLOSED/);
    expect(road.valueAr).toMatch(/مغلق/);
    expect(road.assurance).toBeGreaterThan(0.95);
    for (const f of facts) expect(f.assurance).toBeLessThanOrEqual(0.99);
  });
  it("scores assurance from the facts and penalises unresolved contradictions", () => {
    const ctr = detectContradictions(claims, "x");
    const facts = verifyFacts(claims, ctr, "x");
    const resolved = assuranceScore(facts, ctr);
    expect(resolved).toBeGreaterThan(0.9);
    const unresolved = assuranceScore(facts, [{ ...ctr[0], winningClaimId: "" }]);
    expect(unresolved).toBeCloseTo(resolved - 0.2, 3);
    expect(assuranceScore([], [])).toBe(1);
  });
});
