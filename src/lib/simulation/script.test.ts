import { describe, expect, it } from "vitest";
import { classifyResponse } from "@/lib/ai/classify";
import { PEOPLE } from "@/lib/data/people";
import { planEscalation } from "@/lib/engine/escalation";
import { clockAt } from "@/lib/format";
import { buildScenario } from "@/lib/simulation/scenario";
import { KPI_BY_STEP, OPERATOR_QUEUE, SCRIPT, TIMELINE } from "@/lib/simulation/script";
import { STEPS } from "@/lib/simulation/steps";

const toSec = (clock: string) => {
  const [h, m, s] = clock.split(":").map(Number);
  return h * 3600 + m * 60 + s - (14 * 3600 + 2 * 60);
};

describe("scripted data", () => {
  it("has a status for every step for every person", () => {
    for (const p of PEOPLE) expect(SCRIPT[p.id]?.status, p.id).toHaveLength(STEPS.length);
    expect(KPI_BY_STEP).toHaveLength(STEPS.length);
  });
  it("keeps timeline events in time order, grouped by step, and never ahead of the step clock", () => {
    for (let i = 1; i < TIMELINE.length; i++) {
      expect(TIMELINE[i][0]).toBeGreaterThan(TIMELINE[i - 1][0]);
      expect(TIMELINE[i][1]).toBeGreaterThanOrEqual(TIMELINE[i - 1][1]);
    }
    for (const step of STEPS) {
      for (const e of buildScenario(step.index).timeline) expect(toSec(e.at), e.title).toBeLessThanOrEqual(step.offsetSec);
    }
    expect(buildScenario(0).timeline).toHaveLength(1);
  });
  it("queues operator items only for known people", () => {
    const ids = new Set(PEOPLE.map((p) => p.id));
    for (const items of Object.values(OPERATOR_QUEUE)) for (const it of items) if (it.personId) expect(ids.has(it.personId)).toBe(true);
  });
  it("schedules scripted escalations no earlier than the engine thresholds allow", () => {
    const yusuf = buildScenario(8).people.find((p) => p.person.id === "yusuf")!;
    const sent = toSec(yusuf.deliveries.find((d) => d.status === "sent")!.at);
    for (const e of SCRIPT.yusuf.escalation!) {
      const plan = planEscalation({ person: yusuf.person, sentAtSec: sent, nowSec: e.sec, channels: yusuf.impact!.channels });
      expect(plan.map((p) => p.rule), `${e.rule} at ${e.sec}`).toContain(e.rule);
    }
  });
  it("quotes the classifier's real confidence in the response feed", () => {
    for (const id of ["ahmed", "fatima"]) {
      const r = SCRIPT[id].response!;
      const conf = classifyResponse(r.text, r.lang, r.hint).confidence;
      const ev = TIMELINE.find((e) => e[4].startsWith(PEOPLE.find((p) => p.id === id)!.name))!;
      expect(ev[5], id).toContain(`(${conf.toFixed(2)})`);
    }
  });
  it("logs the sent time before any read or response", () => {
    for (const p of buildScenario(8).people) {
      const sent = p.deliveries.find((d) => d.status === "sent");
      if (!sent) continue;
      for (const d of p.deliveries) expect(toSec(d.at)).toBeGreaterThanOrEqual(toSec(sent.at));
      if (p.response) expect(toSec(p.response.at)).toBeGreaterThan(toSec(sent.at));
    }
    expect(clockAt(0)).toBe("14:02:00");
  });
});
