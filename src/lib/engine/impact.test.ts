import { describe, expect, it } from "vitest";
import { ASSEMBLY_POINTS, BUILDINGS, HAZARD } from "@/lib/data/district";
import { PEOPLE, personById } from "@/lib/data/people";
import { pointInPolygon } from "@/lib/engine/geometry";
import { assessPerson, selectChannels } from "@/lib/engine/impact";
import { IMPACT_CONTEXT } from "@/lib/simulation/scenario";

const assess = (id: string) => assessPerson(personById(id), IMPACT_CONTEXT);
const fired = (id: string, rule: string) => assess(id).rules.find((r) => r.rule === rule)?.fired;

describe("people data", () => {
  it("places residents at the location of a known building", () => {
    for (const p of PEOPLE) {
      if (!p.buildingId) continue;
      const b = BUILDINGS.find((x) => x.id === p.buildingId);
      expect(b, p.id).toBeDefined();
      expect(p.location).toEqual(b!.p);
    }
  });
  it("keeps every assembly point outside the hazard polygon", () => {
    for (const ap of ASSEMBLY_POINTS) expect(pointInPolygon(ap.p, HAZARD.polygon), ap.id).toBe(false);
  });
});

describe("assessPerson", () => {
  it("reroutes the driver whose route crosses the closure", () => {
    const a = assess("ahmed");
    expect(a.affected).toBe(true);
    expect(a.action).toBe("REROUTE");
    expect(a.severity).toBe("medium");
    expect(a.route?.delayMinutes).toBe(6);
    expect(a.channels).toEqual(["app", "sms"]);
    expect(fired("ahmed", "R-02")).toBe(true);
    expect(fired("ahmed", "R-03")).toBe(true);
    expect(fired("ahmed", "R-01")).toBe(false);
  });
  it("shelters residents indoors inside the polygon", () => {
    const f = assess("fatima");
    expect(f.action).toBe("SHELTER_IN_PLACE");
    expect(fired("fatima", "R-01")).toBe(true);
    expect(fired("fatima", "R-04")).toBe(true);
  });
  it("offers assistance to residents with accessibility needs", () => {
    const s = assess("sara");
    expect(s.action).toBe("OFFER_ASSISTANCE");
    expect(s.severity).toBe("high");
    expect(fired("sara", "R-06")).toBe(true);
    expect(s.reason).toMatch(/wheelchair/);
  });
  it("suppresses alerts outside the impact area", () => {
    for (const id of ["omar", "hassan", "rashid"]) {
      const o = assess(id);
      expect(o.affected, id).toBe(false);
      expect(o.action, id).toBe("NO_ACTION");
      expect(o.channels, id).toEqual([]);
      expect(fired(id, "R-05"), id).toBe(true);
    }
  });
  it("sends the pedestrian in the zone to the nearest accessible assembly point", () => {
    const l = assess("layla");
    expect(l.action).toBe("AVOID_AREA");
    expect(l.severity).toBe("high");
    expect(l.assemblyPointId).toBe("ap-hall");
  });
  it("lists every rule exactly once in a stable order", () => {
    const order = assess("ahmed").rules.map((r) => r.rule);
    expect(order).toEqual(["R-01", "R-02", "R-03", "R-04", "R-07", "R-06", "R-05", "R-08"]);
    for (const p of PEOPLE) expect(assessPerson(p, IMPACT_CONTEXT).rules.map((r) => r.rule)).toEqual(order);
  });
});

describe("selectChannels", () => {
  it("drops the app and adds SMS and voice without a smartphone", () => {
    expect(selectChannels(personById("yusuf"))).toEqual(["sms", "voice"]);
  });
  it("never calls a resident with a hearing impairment", () => {
    expect(selectChannels(personById("aisha"))).toEqual(["sms"]);
  });
  it("prefers voice for a resident with a vision impairment", () => {
    const p = { ...personById("khalid"), accessibility: { mobility: "standard" as const, vision: true, smartphone: true } };
    expect(selectChannels(p)[0]).toBe("voice");
  });
});
