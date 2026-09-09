/**
 * Deterministic safety layer — "one truth, many channels" consistency check.
 * Every published variant must carry the verified facts and must not contradict them.
 */

import type { Channel, ChannelCheck, ChannelVariant, VerifiedFact } from "@/lib/types";

const LABEL: Record<Channel, string> = {
  sms: "SMS",
  app: "Mobile app",
  voice: "Voice / IVR",
  web: "Public website",
  signage: "Digital signage",
  operator: "Call centre",
};

export function checkChannels(variants: ChannelVariant[], facts: VerifiedFact[], lastSync: string, opts?: { webStale?: boolean }): ChannelCheck[] {
  const roadFact = facts.find((f) => f.subject === "road:al-majaz-underpass");
  const closed = roadFact?.value.toLowerCase().startsWith("closed") ?? false;
  return variants.map((v) => {
    const en = (v.title ? `${v.title} ` : "") + v.en;
    const ar = (v.titleAr ? `${v.titleAr} ` : "") + v.ar;
    const checks = [
      { name: "Names the verified road", pass: /al majaz/i.test(en) && /المجاز/.test(ar) },
      { name: "States the verified status (closed)", pass: !closed || (/closed/i.test(en) && /مغلق|مغلقة/.test(ar)) },
      { name: "Does not contradict the verified status", pass: !closed || !/\bopen\b/i.test(en.replace(/open (safe|the) route/i, "")) },
      { name: "Arabic and English carry the same facts", pass: parity(en, ar) },
      { name: "Within channel limits", pass: withinLimits(v) },
    ];
    if (v.channel === "web" && opts?.webStale) {
      checks[1] = { name: "States the verified status (closed)", pass: false };
      checks[2] = { name: "Does not contradict the verified status", pass: false };
    }
    return {
      channel: v.channel,
      label: LABEL[v.channel],
      published: !(v.channel === "web" && opts?.webStale),
      consistent: checks.every((c) => c.pass),
      checks,
      lastSync,
    };
  });
}

function parity(en: string, ar: string): boolean {
  const nums = (s: string) => (s.match(/\d+/g) ?? []).map((n) => Number(n)).filter((n) => n < 1000).sort().join(",");
  return nums(en) === nums(ar);
}

function withinLimits(v: ChannelVariant): boolean {
  if (v.channel === "signage") return v.en.split("\n").every((l) => l.length <= 20) && v.en.split("\n").length <= 3;
  if (v.channel === "app") return (v.title?.length ?? 0) <= 60;
  return true;
}

export function consistencyScore(checks: ChannelCheck[]): number {
  const all = checks.flatMap((c) => c.checks);
  if (all.length === 0) return 1;
  return Number((all.filter((c) => c.pass).length / all.length).toFixed(3));
}
