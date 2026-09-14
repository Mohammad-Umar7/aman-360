import { describe, expect, it } from "vitest";
import { checkChannels, consistencyScore } from "@/lib/engine/consistency";
import { buildScenario } from "@/lib/simulation/scenario";
import type { ChannelVariant, VerifiedFact } from "@/lib/types";

const closedFact: VerifiedFact = { subject: "road:al-majaz-underpass", label: "x", value: "CLOSED — both directions", valueAr: "مغلق", sourceId: "src-police", verifiedAt: "x", assurance: 0.98 };

describe("checkChannels", () => {
  it("passes a variant that names the road, states closed and keeps bilingual parity", () => {
    const v: ChannelVariant = { channel: "sms", en: "Al Majaz underpass CLOSED. Use King Faisal St, +6 min.", ar: "نفق المجاز مغلق. استخدم شارع الملك فيصل، +6 دقائق." };
    const [c] = checkChannels([v], [closedFact], "x");
    expect(c.consistent).toBe(true);
    expect(c.published).toBe(true);
  });
  it("fails a variant that says the road is open or drops a number from one language", () => {
    const open: ChannelVariant = { channel: "web", en: "Al Majaz Road is open.", ar: "طريق المجاز مفتوح." };
    const [c] = checkChannels([open], [closedFact], "x");
    expect(c.consistent).toBe(false);
    expect(c.checks.find((k) => k.name.startsWith("States"))?.pass).toBe(false);
    const parity: ChannelVariant = { channel: "sms", en: "Al Majaz CLOSED, +6 min", ar: "المجاز مغلق" };
    expect(checkChannels([parity], [closedFact], "x")[0].checks.find((k) => k.name.startsWith("Arabic"))?.pass).toBe(false);
  });
  it("enforces signage line limits", () => {
    const long: ChannelVariant = { channel: "signage", en: "AL MAJAZ UNDERPASS CLOSED AHEAD USE KING FAISAL", ar: "نفق المجاز مغلق" };
    expect(checkChannels([long], [closedFact], "x")[0].checks.find((k) => k.name.startsWith("Within"))?.pass).toBe(false);
  });
  it("marks a stale web page unpublished and inconsistent", () => {
    const web: ChannelVariant = { channel: "web", en: "Al Majaz underpass CLOSED", ar: "نفق المجاز مغلق" };
    const [c] = checkChannels([web], [closedFact], "x", { webStale: true });
    expect(c.published).toBe(false);
    expect(c.consistent).toBe(false);
  });
});

describe("scenario channel checks", () => {
  it("is fully consistent once every channel is published", () => {
    for (const s of [5, 6, 7, 8]) {
      const st = buildScenario(s);
      expect(st.channelChecks.length).toBeGreaterThanOrEqual(6);
      expect(st.channelChecks.every((c) => c.consistent && c.published), `step ${s}`).toBe(true);
      expect(st.kpis.consistency).toBe(1);
    }
  });
  it("flags the stale portal before the web team corrects it", () => {
    const st = buildScenario(2);
    const web = st.channelChecks.find((c) => c.channel === "web")!;
    expect(web.consistent).toBe(false);
    expect(web.lastSync).toMatch(/stale/);
    expect(consistencyScore(st.channelChecks)).toBeLessThan(1);
  });
});

describe("checkChannels — bilingual rigour", () => {
  it("fails an Arabic variant that contradicts the verified closure", () => {
    const v: ChannelVariant = { channel: "sms", en: "Al Majaz underpass CLOSED.", ar: "نفق المجاز مفتوح." };
    expect(checkChannels([v], [closedFact], "x")[0].consistent).toBe(false);
  });
  it("measures signage limits in both languages", () => {
    const v: ChannelVariant = { channel: "signage", en: "AL MAJAZ RD CLOSED\nFLOODING AHEAD\nUSE KING FAISAL ST", ar: "طريق المجاز مغلق\nتجمّع مياه أمامك\nاستخدم شارع الملك فيصل" };
    expect(checkChannels([v], [closedFact], "x")[0].checks.find((k) => k.name.startsWith("Within"))?.pass).toBe(false);
  });
});
