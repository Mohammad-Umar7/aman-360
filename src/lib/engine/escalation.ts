/**
 * Deterministic safety layer — escalation rules for unresponsive or vulnerable recipients.
 *
 *  E-01 no read within 5 min                 -> resend via next available channel
 *  E-02 no response within 10 min (in zone)  -> automated voice call
 *  E-03 still no response, vulnerable registry -> welfare check via building management / field unit
 *  E-04 help request                          -> triage priority and unit assignment
 */

import type { Channel, EscalationStep, Person } from "@/lib/types";

export interface EscalationInput {
  person: Person;
  sentAtSec: number;
  nowSec: number;
  readAtSec?: number;
  respondedAtSec?: number;
  channels: Channel[];
}

export interface PlannedEscalation {
  rule: string;
  dueSec: number;
  action: string;
  channel?: Channel;
}

export function planEscalation(input: EscalationInput): PlannedEscalation[] {
  const { person, sentAtSec, nowSec, readAtSec, respondedAtSec, channels } = input;
  const plan: PlannedEscalation[] = [];
  const unread = readAtSec === undefined;
  const unresponsive = respondedAtSec === undefined;

  if (unread && nowSec - sentAtSec >= 300) {
    const next = channels.find((c) => c !== "app" && c !== "sms") ?? channels[channels.length - 1];
    plan.push({ rule: "E-01", dueSec: sentAtSec + 300, action: "No read after 5 min — resend via next channel", channel: next });
  }
  if (unresponsive && nowSec - sentAtSec >= 600) {
    plan.push({ rule: "E-02", dueSec: sentAtSec + 600, action: "No response after 10 min — automated voice call", channel: "voice" });
  }
  if (unresponsive && person.vulnerableRegistry && nowSec - sentAtSec >= 900) {
    plan.push({ rule: "E-03", dueSec: sentAtSec + 900, action: "Vulnerable-registry resident unresponsive — welfare check via building management / field unit" });
  }
  return plan;
}

export const escalationStep = (p: PlannedEscalation, at: string, outcome: string): EscalationStep => ({
  rule: p.rule,
  at,
  action: p.action,
  channel: p.channel,
  outcome,
});

/** Priority score for assistance triage (higher = more urgent). Deterministic and explainable. */
export function triageScore(opts: { urgency: number; vulnerable: boolean; mobility: string; inZone: boolean; noResponse?: boolean }): { score: number; reasons: string[] } {
  let score = opts.urgency * 15;
  const reasons: string[] = [`Urgency ${opts.urgency}/5 from response classification (+${opts.urgency * 15})`];
  if (opts.vulnerable) {
    score += 15;
    reasons.push("Listed on vulnerable-persons registry (+15)");
  }
  if (opts.mobility !== "standard") {
    score += 8;
    reasons.push(`Mobility profile: ${opts.mobility} (+8)`);
  }
  if (opts.inZone) {
    score += 5;
    reasons.push("Inside active hazard polygon (+5)");
  }
  if (opts.noResponse) {
    score += 10;
    reasons.push("No response after escalation (+10)");
  }
  return { score: Math.min(100, score), reasons };
}
