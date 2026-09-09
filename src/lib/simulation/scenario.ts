/**
 * Scenario builder — turns a step index into the complete AMAN 360 state.
 *
 * Deterministic engines compute assurance, impact, routing, consistency and
 * triage scores from the synthetic data; the AI layer (simulated) produces
 * wording, classifications and summaries; the script supplies human behaviour.
 * The result is pure and memoised, so every screen (dashboard, map, 3D twin)
 * renders from the same object.
 */

import { classifyResponse } from "@/lib/ai/classify";
import { channelVariants, composeMessage, coreMessage, publicVariants } from "@/lib/ai/personalize";
import { operatorSummary } from "@/lib/ai/summarize";
import { HAZARD } from "@/lib/data/district";
import { PEOPLE } from "@/lib/data/people";
import { CLAIMS } from "@/lib/data/sources";
import { assuranceScore, detectContradictions, verifyFacts } from "@/lib/engine/assurance";
import { checkChannels, consistencyScore } from "@/lib/engine/consistency";
import { triageScore } from "@/lib/engine/escalation";
import { clamp } from "@/lib/engine/geometry";
import { assessPerson } from "@/lib/engine/impact";
import { clockAt } from "@/lib/format";
import { KPI_BY_STEP, OPERATOR_QUEUE, SCRIPT, TIMELINE, type PersonScript } from "@/lib/simulation/script";
import { LAST_STEP, STEPS } from "@/lib/simulation/steps";
import type {
  ChannelCheck,
  ChannelVariant,
  CitizenResponse,
  DeliveryRecord,
  EscalationStep,
  ImpactAssessment,
  Message,
  Person,
  PersonState,
  ScenarioState,
  SourceClaim,
  TimelineEvent,
  TriageItem,
} from "@/lib/types";

export const CLOSED_EDGES = ["al-majaz-underpass"];
export const IMPACT_CONTEXT = { hazard: HAZARD, closedEdges: CLOSED_EDGES };

const cache = new Map<number, ScenarioState>();

export function buildScenario(stepIndex: number): ScenarioState {
  const s = clamp(Math.round(stepIndex), 0, LAST_STEP);
  const cached = cache.get(s);
  if (cached) return cached;

  const step = STEPS[s];
  const now = step.offsetSec;
  const clock = clockAt(now);

  const claims: SourceClaim[] = s >= 1 ? CLAIMS.map((c) => stripReceived(c)) : [];
  const contradictions = s >= 2 ? detectContradictions(claims, clockAt(232)) : [];
  const facts = s >= 2 ? verifyFacts(claims, contradictions, clockAt(235)) : [];
  const hazard = s >= 1 ? HAZARD : undefined;
  const closures = s >= 1 ? CLOSED_EDGES : [];

  let seq = 1;
  const people: PersonState[] = PEOPLE.map((person, idx) => {
    const sc = SCRIPT[person.id];
    const impact = s >= 3 && hazard ? assessPerson(person, IMPACT_CONTEXT) : undefined;
    const message = s >= 4 && impact?.affected ? composeMessage(person, impact, facts, 310 + idx * 0.4, seq++) : undefined;
    const deliveries = s >= 5 && message && impact ? buildDeliveries(person, impact, message, sc, s, now, idx) : [];
    const response = s >= 6 && sc.response && sc.response.sec <= now ? buildResponse(person, sc) : undefined;
    const escalation = buildEscalation(sc, s);
    const triage = sc.triage && s >= sc.triage.fromStep ? buildTriage(person, impact, response, sc, s) : undefined;
    return { person, impact, message, deliveries, response, escalation, triage, status: sc.status[s] };
  });

  // Rank triage items by score (deterministic, explainable).
  const triage = people
    .map((p) => p.triage)
    .filter((t): t is TriageItem => !!t)
    .sort((a, b) => b.score - a.score)
    .map((t, i) => ({ ...t, priority: i + 1 }));
  for (const p of people) if (p.triage) p.triage = triage.find((t) => t.personId === p.person.id);

  const responses = people
    .map((p) => p.response)
    .filter((r): r is CitizenResponse => !!r)
    .sort((a, b) => a.at.localeCompare(b.at));

  const channelChecks = buildChannelChecks(s, people, facts);
  const kpisBase = KPI_BY_STEP[s];
  const kpis = {
    ...kpisBase,
    contradictions: Math.max(kpisBase.contradictions, contradictions.length),
    contradictionsResolved: contradictions.filter((c) => !!c.winningClaimId).length,
    consistency: channelChecks.length ? consistencyScore(channelChecks.filter((c) => c.published)) : 1,
    unitsDispatched: s >= 7 ? kpisBase.unitsDispatched : 0,
  };

  const timeline: TimelineEvent[] = TIMELINE.filter((e) => e[1] <= s).map((e, i) => ({
    id: `tl-${i}`,
    at: clockAt(e[0]),
    step: e[1],
    layer: e[2],
    kind: e[3],
    title: e[4],
    detail: e[5],
  }));

  const state: ScenarioState = {
    step,
    clock,
    incidentStatus: s === 0 ? "normal" : s === 1 ? "monitoring" : s <= 5 ? "active" : s <= 7 ? "response" : "stabilising",
    hazard,
    closures,
    claims,
    contradictions,
    facts,
    people,
    responses,
    triage,
    timeline,
    kpis,
    operatorQueue: OPERATOR_QUEUE[s] ?? [],
    summary: operatorSummary(s, kpis, triage, clock),
    channelChecks,
  };
  cache.set(s, state);
  return state;
}

export const overallAssurance = (state: ScenarioState) => assuranceScore(state.facts, state.contradictions);

/* ------------------------------------------------------------------ */

function buildDeliveries(person: Person, impact: ImpactAssessment, message: Message, sc: PersonScript, s: number, now: number, idx: number): DeliveryRecord[] {
  const out: DeliveryRecord[] = [];
  const base = 355 + idx * 1.3;
  impact.channels.forEach((ch, i) => {
    if (ch === "voice" && person.accessibility.smartphone) return; // voice is a fallback for smartphone users
    const sentSec = base + i * 0.9;
    const latency = ch === "sms" ? 3900 + idx * 140 : ch === "app" ? 2600 + idx * 110 : 18000;
    out.push({ messageId: message.id, personId: person.id, channel: ch, status: "sent", at: clockAt(sentSec), latencyMs: 0, attempt: 1 });
    if (ch === "voice") {
      out.push({ messageId: message.id, personId: person.id, channel: ch, status: "failed", at: clockAt(sentSec + 26), latencyMs: 26000, attempt: 1 });
      return;
    }
    out.push({ messageId: message.id, personId: person.id, channel: ch, status: "delivered", at: clockAt(sentSec + latency / 1000), latencyMs: latency, attempt: 1 });
    if (sc.readSec !== undefined && sc.readChannel === ch && sc.readSec <= now) {
      out.push({ messageId: message.id, personId: person.id, channel: ch, status: "read", at: clockAt(sc.readSec), latencyMs: 0, attempt: 1 });
    }
    if (sc.response && sc.response.channel === ch && sc.response.sec <= now && s >= 6) {
      out.push({ messageId: message.id, personId: person.id, channel: ch, status: "acknowledged", at: clockAt(sc.response.sec), latencyMs: 0, attempt: 1 });
    }
  });
  sc.escalation
    ?.filter((e) => e.channel === "voice" && e.step <= s)
    .forEach((e, k) => out.push({ messageId: message.id, personId: person.id, channel: "voice", status: "failed", at: clockAt(e.sec), latencyMs: 24000, attempt: 2 + k }));
  return out;
}

function stripReceived(c: (typeof CLAIMS)[number]): SourceClaim {
  const copy: SourceClaim & { receivedSec?: number } = { ...c };
  delete copy.receivedSec;
  return copy;
}

function buildResponse(person: Person, sc: PersonScript): CitizenResponse {
  const r = sc.response!;
  const result = classifyResponse(r.text, r.lang, r.hint);
  const classification = { category: result.category, confidence: result.confidence, urgency: result.urgency, entities: result.entities, summary: result.summary };
  return {
    id: `rsp-${person.id}`,
    personId: person.id,
    channel: r.channel,
    text: r.text,
    lang: r.lang,
    at: clockAt(r.sec),
    classification,
  };
}

function buildEscalation(sc: PersonScript, s: number): EscalationStep[] {
  return (sc.escalation ?? [])
    .filter((e) => e.step <= s)
    .map((e) => ({
      rule: e.rule,
      at: clockAt(e.sec),
      action: e.rule === "E-01" ? "No read after 5 min — resend via next channel" : e.rule === "E-02" ? "No response after 10 min — automated voice call" : "Vulnerable-registry resident unresponsive — welfare check",
      channel: e.channel,
      outcome: e.outcome,
    }));
}

function buildTriage(person: Person, impact: ImpactAssessment | undefined, response: CitizenResponse | undefined, sc: PersonScript, s: number): TriageItem {
  const t = sc.triage!;
  const urgency = response?.classification.urgency ?? 2;
  const inZone = impact?.rules.find((r) => r.rule === "R-01")?.fired ?? false;
  const noResponse = !response && (sc.escalation?.length ?? 0) > 0;
  const { score, reasons } = triageScore({ urgency, vulnerable: !!person.vulnerableRegistry, mobility: person.accessibility.mobility, inZone, noResponse });
  const status = t.statusByStep[s] ?? "open";
  return {
    id: `tri-${person.id}`,
    personId: person.id,
    category: response?.classification.category ?? "none",
    priority: 0,
    score,
    reasons,
    recommended: t.recommended,
    unit: t.unit,
    eta: t.eta,
    status,
    resolution: status === "resolved" ? t.resolution : undefined,
  };
}

function buildChannelChecks(s: number, people: PersonState[], facts: ScenarioState["facts"]): ChannelCheck[] {
  if (s < 2) return [];
  const pub = publicVariants(facts);
  let variants: ChannelVariant[] = [];
  const ahmed = people.find((p) => p.person.id === "ahmed");
  if (s >= 4 && ahmed?.message) variants = [...ahmed.message.variants];
  else if (s >= 3 && ahmed?.impact) variants = channelVariants(ahmed.person, ahmed.impact, coreMessage(ahmed.person, ahmed.impact));
  const all = [...(s >= 3 ? variants : []), ...pub];
  const checks = checkChannels(all, facts, clockAt(s >= 5 ? 390 : 235), { webStale: s < 5 });
  return checks.map((c) => ({
    ...c,
    published: c.channel === "web" ? true : s >= 5,
    lastSync: c.channel === "web" && s < 5 ? "26 Aug 2026 (stale)" : c.lastSync,
  }));
}
