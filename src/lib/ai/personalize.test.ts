import { describe, expect, it } from "vitest";
import { buildScenario } from "@/lib/simulation/scenario";

const final = buildScenario(8);
const variant = (id: string, channel: string) => final.people.find((p) => p.person.id === id)!.message!.variants.find((v) => v.channel === channel)!;

describe("message variants", () => {
  it("quotes the verified fact's own timestamp in the call-centre script", () => {
    const fact = final.facts.find((f) => f.subject === "road:al-majaz-underpass")!;
    const op = variant("ahmed", "operator");
    expect(op.en).toContain(fact.verifiedAt);
    expect(op.ar).toContain(fact.verifiedAt);
    expect(op.en).not.toContain("14:05:29");
    const web = final.channelChecks.find((c) => c.channel === "web");
    expect(web?.consistent).toBe(true);
  });
  it("does not repeat the reply instruction in the SMS to a feature-phone user", () => {
    const sms = variant("aisha", "sms");
    expect(sms.en.match(/reply/gi)?.length ?? 0).toBe(1);
    expect(sms.ar.match(/أرسل/g)?.length ?? 0).toBe(1);
  });
  it("uses feminine Arabic agreement for residents registered that way", () => {
    expect(variant("aisha", "sms").ar).toContain("أرسلي");
    expect(variant("aisha", "sms").ar).not.toContain("أرسل «بخير»");
    expect(variant("yusuf", "sms").ar).toContain("أرسل «بخير»");
  });
  it("keeps signage within three lines of twenty characters in both languages", () => {
    const sign = final.channelChecks.find((c) => c.channel === "signage")!;
    expect(sign.consistent).toBe(true);
  });
  it("never leaves dangling separators in public variants", () => {
    for (const s of [2, 5, 8]) {
      for (const c of buildScenario(s).channelChecks) expect(c.checks.every((k) => typeof k.pass === "boolean")).toBe(true);
    }
    for (const p of final.people) {
      for (const v of p.message?.variants ?? []) {
        expect(v.en).not.toMatch(/ \./);
        expect(v.en).not.toMatch(/undefined|null/);
        expect(v.ar).not.toMatch(/undefined|null/);
      }
    }
  });
});
