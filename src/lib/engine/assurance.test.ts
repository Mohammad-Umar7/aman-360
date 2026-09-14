import { describe, expect, it } from "vitest";
import { CLAIMS, SOURCES, SUBJECTS } from "@/lib/data/sources";
import { assuranceScore, detectContradictions, observedSec, verifyFacts } from "@/lib/engine/assurance";

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

describe("recency and ties", () => {
  const police = (id: string, value: "closed" | "open", observedAt: string) => ({ ...claims.find((c) => c.id === "clm-police-1")!, id, value, observedAt });
  it("lets the newer observation win between equally authoritative sources", () => {
    const out = detectContradictions([police("p-old", "closed", "14:05:25"), police("p-new", "open", "14:40:00")], "x");
    expect(out).toHaveLength(1);
    expect(out[0].winningClaimId).toBe("p-new");
    const facts = verifyFacts([police("p-old", "closed", "14:05:25"), police("p-new", "open", "14:40:00")], out, "x");
    expect(facts[0].value).toBe("OPEN");
  });
  it("still prefers authority over recency", () => {
    const stalePortal = claims.find((c) => c.id === "clm-web-1")!;
    const out = detectContradictions([police("p", "closed", "14:05:25"), { ...stalePortal, stale: false, observedAt: "14:50:00" }], "x");
    expect(out[0].winningClaimId).toBe("p");
  });
  it("ranks a date-only stamp older than any time of day", () => {
    expect(observedSec({ ...claims[0], observedAt: "2026-08-26" })).toBe(Number.NEGATIVE_INFINITY);
    expect(observedSec({ ...claims[0], observedAt: "14:05:25" })).toBe(14 * 3600 + 5 * 60 + 25);
  });
  it("leaves an exact tie unresolved, publishes no fact and lowers the assurance score", () => {
    const tied = [police("p-a", "closed", "14:05:25"), { ...police("p-b", "open", "14:05:25") }];
    const out = detectContradictions(tied, "x");
    expect(out[0].winningClaimId).toBeUndefined();
    expect(out[0].resolvedAt).toBeUndefined();
    expect(out[0].rationale.join(" ")).toMatch(/operator/i);
    const facts = verifyFacts(tied, out, "x");
    expect(facts.find((f) => f.subject === "road:al-majaz-underpass")).toBeUndefined();
    expect(assuranceScore([{ subject: "s", label: "l", value: "v", valueAr: "v", sourceId: "src-police", verifiedAt: "x", assurance: 0.9 }], out)).toBeCloseTo(0.7, 3);
  });
});
