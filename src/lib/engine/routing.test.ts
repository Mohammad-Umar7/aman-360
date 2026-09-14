import { describe, expect, it } from "vitest";
import { EDGES, HAZARD, NODES } from "@/lib/data/district";
import { personById } from "@/lib/data/people";
import { evaluateRoute, minutesFor, shortestPath, unitsToKm } from "@/lib/engine/routing";
import { CLOSED_EDGES } from "@/lib/simulation/scenario";

const closed = new Set(CLOSED_EDGES);

describe("district graph", () => {
  it("references only known nodes and has unique ids", () => {
    const ids = new Set(NODES.map((n) => n.id));
    for (const e of EDGES) {
      expect(ids.has(e.from), e.id).toBe(true);
      expect(ids.has(e.to), e.id).toBe(true);
    }
    expect(new Set(EDGES.map((e) => e.id)).size).toBe(EDGES.length);
    expect(ids.size).toBe(NODES.length);
  });
  it("only closes edges that exist and are closable", () => {
    for (const id of CLOSED_EDGES) expect(EDGES.find((e) => e.id === id)?.closable).toBe(true);
  });
});

describe("shortestPath", () => {
  it("uses the underpass when nothing is closed", () => {
    const r = shortestPath("AW", "AE", new Set());
    expect(r?.nodes).toEqual(["AW", "A1", "AU1", "AU2", "A2", "AE"]);
  });
  it("avoids the closed underpass and the hazard polygon", () => {
    const r = shortestPath("A1", "AE", closed, HAZARD.polygon);
    expect(r).not.toBeNull();
    expect(r!.edges.map((e) => e.id)).not.toContain("al-majaz-underpass");
    expect(r!.nodes).toEqual(["A1", "K1", "K2", "A2", "AE"]);
  });
  it("returns null when the destination is unreachable", () => {
    const everything = new Set(EDGES.map((e) => e.id));
    expect(shortestPath("AW", "AE", everything)).toBeNull();
  });
});

describe("evaluateRoute", () => {
  it("reroutes Ahmed via King Faisal Street with a six-minute delay", () => {
    const ahmed = personById("ahmed");
    const r = evaluateRoute(ahmed.location, ahmed.route!, closed, HAZARD.polygon);
    expect(r.blockedEdgeId).toBe("al-majaz-underpass");
    expect(r.alternative).toBeDefined();
    expect(r.viaRoads).toContain("King Faisal Street");
    expect(r.delayMinutes).toBe(6);
    expect(r.alternativeKm!).toBeGreaterThan(r.originalKm);
  });
  it("leaves an unaffected route untouched", () => {
    const hassan = personById("hassan");
    const r = evaluateRoute(hassan.location, hassan.route!, closed, HAZARD.polygon);
    expect(r.blockedEdgeId).toBeUndefined();
    expect(r.alternative).toBeUndefined();
    expect(r.delayMinutes).toBe(0);
    expect(r.viaRoads).toEqual(["King Faisal Street"]);
  });
});

describe("scale helpers", () => {
  it("converts schematic units to kilometres and minutes", () => {
    expect(unitsToKm(125)).toBe(1);
    expect(minutesFor(125)).toBeCloseTo(6);
  });
});
