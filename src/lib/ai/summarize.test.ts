import { describe, expect, it } from "vitest";
import { buildScenario } from "@/lib/simulation/scenario";

describe("operatorSummary", () => {
  it("is absent before impact analysis and present afterwards", () => {
    expect(buildScenario(2).summary).toBeNull();
    for (let s = 3; s <= 8; s++) expect(buildScenario(s).summary?.headline).toBeTruthy();
  });
  it("quotes accessibility, smartphone and reroute counts from the deterministic state", () => {
    const s3 = buildScenario(3);
    const text = s3.summary!.bullets.join(" ");
    const affected = s3.people.filter((p) => p.impact?.affected);
    const accessibility = affected.filter((p) => p.impact?.rules.some((r) => r.rule === "R-06" && r.fired)).length;
    const noSmartphone = affected.filter((p) => !p.person.accessibility.smartphone).length;
    const rerouted = affected.filter((p) => p.impact?.action === "REROUTE").length;
    expect(text).toContain(`${accessibility} registered profiles carry accessibility flags`);
    expect(text).toContain(`${noSmartphone} have no smartphone`);
    expect(text).toContain(`${rerouted} registered road user `);
  });
  it("counts silent vulnerable residents from the people list, not the review queue", () => {
    const s6 = buildScenario(6);
    const silent = s6.people.filter((p) => p.person.vulnerableRegistry && p.status === "no_response").length;
    expect(silent).toBe(1);
    expect(s6.summary!.bullets.join(" ")).toContain("1 registered vulnerable-persons profile is silent");
  });
  it("leads the dispatch headline with the aggregate assistance count", () => {
    const s7 = buildScenario(7);
    expect(s7.summary!.headline).toMatch(new RegExp(`^${s7.kpis.help} assistance requests`));
    expect(s7.summary!.headline).toContain(`${s7.kpis.unitsDispatched} units dispatched`);
  });
  it("never renders NaN percentages", () => {
    for (let s = 3; s <= 8; s++) {
      const sum = buildScenario(s).summary!;
      expect(sum.headline + sum.bullets.join(" ")).not.toMatch(/NaN|undefined/);
    }
  });
});
