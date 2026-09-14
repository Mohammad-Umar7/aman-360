import { describe, expect, it } from "vitest";
import { buildScenario } from "@/lib/simulation/scenario";
import { STEPS } from "@/lib/simulation/steps";

const ALL = STEPS.map((s) => buildScenario(s.index));

describe("buildScenario invariants", () => {
  it("returns the requested step for every index", () => {
    for (const s of ALL) expect(s.step.index).toBe(STEPS[s.step.index].index);
    expect(ALL).toHaveLength(9);
  });

  it("is memoised and never mutates a previously built state", () => {
    const a = buildScenario(5);
    const b = buildScenario(5);
    expect(a).toBe(b);
    const snapshot = JSON.stringify(a);
    buildScenario(8);
    buildScenario(0);
    expect(JSON.stringify(buildScenario(5))).toBe(snapshot);
  });

  it("uses unique ids for everything rendered as a list", () => {
    for (const s of ALL) {
      const ids = (xs: { id: string }[]) => xs.map((x) => x.id);
      const unique = (xs: string[]) => expect(new Set(xs).size).toBe(xs.length);
      unique(ids(s.timeline));
      unique(ids(s.responses));
      unique(ids(s.triage));
      unique(ids(s.claims));
      unique(ids(s.contradictions));
      unique(ids(s.operatorQueue));
      unique(s.people.map((p) => p.person.id));
    }
  });

  it("references only known people", () => {
    for (const s of ALL) {
      const people = new Set(s.people.map((p) => p.person.id));
      for (const r of s.responses) expect(people.has(r.personId)).toBe(true);
      for (const t of s.triage) expect(people.has(t.personId)).toBe(true);
      for (const p of s.people) {
        for (const d of p.deliveries) expect(d.personId).toBe(p.person.id);
        if (p.message) expect(p.message.personId).toBe(p.person.id);
        if (p.impact) expect(p.impact.personId).toBe(p.person.id);
      }
    }
  });

  it("keeps KPIs finite and within range", () => {
    for (const s of ALL) {
      for (const [k, v] of Object.entries(s.kpis)) {
        expect(Number.isFinite(v), `${k} at step ${s.step.index}`).toBe(true);
        expect(v, `${k} at step ${s.step.index}`).toBeGreaterThanOrEqual(0);
      }
      expect(s.kpis.consistency).toBeLessThanOrEqual(1);
      expect(s.kpis.reached).toBeLessThanOrEqual(s.kpis.affected);
      expect(s.kpis.read).toBeLessThanOrEqual(s.kpis.reached);
      expect(s.kpis.contradictionsResolved).toBeLessThanOrEqual(s.kpis.contradictions);
    }
  });

  it("only suppresses alerts for people the engine marks unaffected", () => {
    for (const s of ALL) {
      for (const p of s.people) {
        if (p.status === "no_alert") expect(p.impact?.affected).toBe(false);
        if (p.message) expect(p.impact?.affected).toBe(true);
      }
    }
  });

  it("keeps AI confidences in 0..1", () => {
    for (const s of ALL) {
      for (const p of s.people) if (p.message) expect(p.message.ai.confidence).toBeGreaterThan(0);
      for (const p of s.people) if (p.message) expect(p.message.ai.confidence).toBeLessThanOrEqual(1);
      for (const r of s.responses) {
        expect(r.classification.confidence).toBeGreaterThan(0);
        expect(r.classification.confidence).toBeLessThanOrEqual(1);
      }
      if (s.summary) expect(s.summary.ai.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("orders the timeline chronologically within a step", () => {
    for (const s of ALL) {
      const times = s.timeline.map((e) => e.at);
      const sorted = [...times].sort();
      expect(times).toEqual(sorted);
    }
  });
});
