import { describe, expect, it } from "vitest";
import { personById } from "@/lib/data/people";
import { planEscalation, triageScore } from "@/lib/engine/escalation";
import type { Channel } from "@/lib/types";

describe("planEscalation", () => {
  const yusuf = personById("yusuf");
  const channels: Channel[] = ["sms", "voice"];
  const base = { person: yusuf, sentAtSec: 355, channels };
  const rules = (now: number, extra: Partial<Parameters<typeof planEscalation>[0]> = {}) => planEscalation({ ...base, nowSec: now, ...extra }).map((p) => p.rule);
  it("plans nothing while the message is fresh", () => {
    expect(rules(500)).toEqual([]);
  });
  it("escalates E-01 then E-02 then E-03 for a silent vulnerable resident", () => {
    expect(rules(660)).toEqual(["E-01"]);
    expect(rules(1000)).toEqual(["E-01", "E-02"]);
    expect(rules(1300)).toEqual(["E-01", "E-02", "E-03"]);
  });
  it("uses the next channel that is not app or SMS for the resend", () => {
    const [e1] = planEscalation({ ...base, nowSec: 700 });
    expect(e1.channel).toBe("voice");
    expect(e1.dueSec).toBe(655);
  });
  it("stops at E-02 when the resident is not on the vulnerable registry", () => {
    expect(rules(2000, { person: { ...yusuf, vulnerableRegistry: false } })).toEqual(["E-01", "E-02"]);
  });
  it("skips read-related escalation once the message is read or answered", () => {
    expect(rules(2000, { readAtSec: 400 })).toEqual(["E-02", "E-03"]);
    expect(rules(2000, { readAtSec: 400, respondedAtSec: 401 })).toEqual([]);
  });
});

describe("triageScore", () => {
  it("weights urgency, vulnerability, mobility, zone and silence and caps at 100", () => {
    const top = triageScore({ urgency: 5, vulnerable: true, mobility: "wheelchair", inZone: true });
    expect(top.score).toBe(100);
    expect(top.reasons).toHaveLength(4);
    const low = triageScore({ urgency: 2, vulnerable: false, mobility: "standard", inZone: false });
    expect(low.score).toBe(30);
    expect(low.reasons).toHaveLength(1);
    const silent = triageScore({ urgency: 2, vulnerable: true, mobility: "standard", inZone: true, noResponse: true });
    expect(silent.score).toBe(60);
  });
});
