/**
 * Deterministic safety layer — communication assurance.
 *
 * Detects contradictions between official sources and resolves them through the
 * approved source hierarchy (authority for the subject's domain, then recency,
 * with stale content penalised). Produces verified facts with an assurance score.
 */

import { SUBJECTS, sourceById } from "@/lib/data/sources";
import type { Contradiction, SourceClaim, VerifiedFact } from "@/lib/types";

const ROAD_STATUS_VALUES = new Set(["closed", "open", "congested"]);

/** Two claims contradict when both make a definitive road-status statement that cannot both be true. */
function contradicts(a: SourceClaim, b: SourceClaim): boolean {
  if (a.subject !== b.subject) return false;
  const definitive = new Set(["closed", "open"]);
  return definitive.has(a.value) && definitive.has(b.value) && a.value !== b.value;
}

/** Observation time as seconds of the incident day; date-only stamps (a page last updated weeks ago) rank oldest. */
export function observedSec(c: SourceClaim): number {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(c.observedAt.trim());
  if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] ?? 0);
  return Number.NEGATIVE_INFINITY;
}

/** Hierarchy first (authority, domain, staleness), then the most recent observation. */
export const compareClaims = (a: SourceClaim, b: SourceClaim): number => rankClaim(b) - rankClaim(a) || observedSec(b) - observedSec(a);

function rankClaim(c: SourceClaim): number {
  const src = sourceById(c.sourceId);
  const domain = SUBJECTS[c.subject]?.domain;
  const authoritative = domain ? src.domains.includes(domain) : false;
  let score = (10 - src.authorityRank) * 10; // 90 for rank 1, 60 for rank 4
  if (!authoritative) score -= 30;
  if (c.stale) score -= 40;
  return score;
}

export function detectContradictions(claims: SourceClaim[], nowLabel: string): Contradiction[] {
  const out: Contradiction[] = [];
  const bySubject = new Map<string, SourceClaim[]>();
  for (const c of claims) {
    if (!ROAD_STATUS_VALUES.has(c.value)) continue;
    bySubject.set(c.subject, [...(bySubject.get(c.subject) ?? []), c]);
  }
  for (const [subject, list] of bySubject) {
    const conflicting = list.filter((c) => list.some((o) => o !== c && contradicts(c, o)));
    if (conflicting.length < 2) continue;
    const ranked = [...conflicting].sort(compareClaims);
    const winner = ranked[0];
    const runnerUp = ranked[1];
    const loser = ranked[ranked.length - 1];
    // An exact tie (same authority, same observation time, different values) cannot be resolved automatically.
    const resolved = compareClaims(winner, runnerUp) !== 0;
    const ws = sourceById(winner.sourceId);
    const ls = sourceById(loser.sourceId);
    const domain = SUBJECTS[subject]?.domain.replace(/_/g, " ") ?? subject;
    const corroborating = claims.filter((c) => c.subject !== subject && !c.stale).map((c) => sourceById(c.sourceId).org);
    out.push({
      id: `ctr-${subject.replace(/[^a-z0-9]/gi, "-")}`,
      subject,
      claims: conflicting,
      winningClaimId: resolved ? winner.id : undefined,
      resolvedAt: resolved ? nowLabel : undefined,
      rationale: resolved
        ? [
            `${ws.org} holds authority rank ${ws.authorityRank} for ${domain}; ${ls.org} holds rank ${ls.authorityRank}.`,
            loser.stale
              ? `${ls.name} content is stale (last updated ${loser.observedAt}); the ${ws.org} observation is ${winner.observedAt}.`
              : `Most recent authoritative observation wins (${winner.observedAt}).`,
            corroborating.length ? `Corroborated by ${corroborating.length} other live feed${corroborating.length === 1 ? "" : "s"}: ${Array.from(new Set(corroborating)).join(", ")}.` : "No corroborating feeds yet.",
          ]
        : [
            `${ws.org} and ${sourceById(runnerUp.sourceId).org} hold equal authority for ${domain} and observed at the same time (${winner.observedAt}).`,
            "No automatic resolution — escalated to the duty operator; no fact published for this subject.",
          ],
      action: resolved
        ? `${ls.name} flagged for correction — correction notice queued to the web content team; page auto-annotated with the verified status until updated.`
        : "Operator decision required before any channel may publish this subject.",
    });
  }
  return out;
}

export function verifyFacts(claims: SourceClaim[], contradictions: Contradiction[], nowLabel: string): VerifiedFact[] {
  const facts: VerifiedFact[] = [];
  const subjects = Array.from(new Set(claims.map((c) => c.subject)));
  for (const subject of subjects) {
    const list = claims.filter((c) => c.subject === subject);
    const ctr = contradictions.find((c) => c.subject === subject);
    // An unresolved contradiction publishes nothing: no channel may state a fact the hierarchy could not verify.
    if (ctr && !ctr.winningClaimId) continue;
    const chosen = ctr ? list.find((c) => c.id === ctr.winningClaimId) : [...list].sort(compareClaims)[0];
    if (!chosen) continue;
    const src = sourceById(chosen.sourceId);
    const corroborating = claims.filter((c) => c.subject !== subject && !c.stale).length;
    const base = src.authorityRank === 1 ? 0.96 : src.authorityRank === 2 ? 0.9 : 0.75;
    const assurance = Math.min(0.99, base + Math.min(0.03, corroborating * 0.006) + (ctr ? 0.0 : 0.005));
    facts.push({
      subject,
      label: SUBJECTS[subject]?.label ?? subject,
      value: describe(chosen),
      valueAr: describeAr(chosen),
      sourceId: chosen.sourceId,
      verifiedAt: nowLabel,
      assurance: Number(assurance.toFixed(3)),
    });
  }
  return facts;
}

function describe(c: SourceClaim): string {
  switch (c.value) {
    case "closed":
      return "CLOSED — both directions";
    case "open":
      return "OPEN";
    case "congested":
      return "CONGESTED";
    case "hazard_active":
      return "ACTIVE — severe";
    case "alert_orange":
      return "ORANGE ALERT — convective rain";
    case "sop_ref":
      return "SOP-FF-03 v4.1 in force";
  }
}

function describeAr(c: SourceClaim): string {
  switch (c.value) {
    case "closed":
      return "مغلق — في الاتجاهين";
    case "open":
      return "مفتوح";
    case "congested":
      return "مزدحم";
    case "hazard_active":
      return "نشط — شدة عالية";
    case "alert_orange":
      return "تنبيه برتقالي — أمطار رعدية";
    case "sop_ref":
      return "الإجراء SOP-FF-03 الإصدار 4.1 ساري";
  }
}

/** Overall communication assurance score (0..1) from verified facts and contradiction state. */
export function assuranceScore(facts: VerifiedFact[], contradictions: Contradiction[]): number {
  if (facts.length === 0) return 1;
  const avg = facts.reduce((s, f) => s + f.assurance, 0) / facts.length;
  const unresolved = contradictions.filter((c) => !c.winningClaimId).length;
  return Number(Math.max(0, avg - unresolved * 0.2).toFixed(3));
}
