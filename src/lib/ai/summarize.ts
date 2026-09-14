/**
 * AI Communication Intelligence — operator situation summary (simulated model).
 */

import { trace } from "@/lib/ai/provider";
import { fmtInt, pct } from "@/lib/format";
import type { Kpis, OperatorSummary, PersonState, TriageItem } from "@/lib/types";

export function operatorSummary(step: number, kpis: Kpis, triage: TriageItem[], people: PersonState[], at: string): OperatorSummary | null {
  if (step < 3) return null;
  // Counts quoted from the deterministic state (the 12 registered profiles), never estimated.
  const affected = people.filter((p) => p.impact?.affected);
  const accessibility = affected.filter((p) => p.impact?.rules.some((r) => r.rule === "R-06" && r.fired)).length;
  const noSmartphone = affected.filter((p) => !p.person.accessibility.smartphone).length;
  const rerouted = affected.filter((p) => p.impact?.action === "REROUTE").length;
  const vulnerableSilent = people.filter((p) => p.person.vulnerableRegistry && p.status === "no_response").length;
  const openHelp = triage.filter((t) => t.category === "help" && t.status !== "resolved").length;
  const share = (n: number) => (kpis.affected > 0 ? pct(n / kpis.affected) : "—");
  const bullets: string[] = [];
  let headline = "";
  if (step === 3) {
    headline = `${fmtInt(kpis.affected)} people identified as affected by the Al Majaz underpass flood; no messages issued yet.`;
    bullets.push("Affected set = residents of 4 buildings inside FZ-0912 + registered daytime occupants + eastbound road users approaching the closure.");
    bullets.push(`${accessibility} registered profiles carry accessibility flags; ${noSmartphone} have no smartphone — SMS + voice path selected.`);
    bullets.push(`${rerouted} registered road user${rerouted === 1 ? "" : "s"} on Al Majaz Road require rerouting; alternative via King Faisal Street verified (+6 min).`);
  } else if (step === 4) {
    headline = `Messages composed for ${fmtInt(kpis.affected)} recipients in Arabic and English; 1 outdoor instruction awaits operator confirmation.`;
    bullets.push("All wording locked to SOP-FF-03 approved actions; verified facts referenced with source and timestamp.");
    bullets.push("Public website banner and VMS-07 signage prepared from the same verified statement.");
  } else if (step === 5) {
    headline = `${fmtInt(kpis.reached)} of ${fmtInt(kpis.affected)} recipients reached (${share(kpis.reached)}); average delivery ${kpis.avgDeliverySec.toFixed(1)} s.`;
    bullets.push(`${fmtInt(kpis.read)} confirmed reads so far; ${fmtInt(kpis.affected - kpis.reached)} not yet reached — retry via next channel is scheduled (E-01).`);
    bullets.push("Channel consistency 100%: every published variant matches the verified closure statement.");
  } else if (step === 6) {
    headline = `${fmtInt(kpis.safe)} confirmed safe; ${kpis.help} assistance requests and ${kpis.clarification} clarification requests need attention; ${fmtInt(kpis.noResponse)} silent.`;
    bullets.push("Two highest-urgency requests are ground-floor residents reporting water entering the building (one wheelchair user).");
    bullets.push("One resident reports a situation different from the modelled context (outdoors at the bus stop) — operator reply drafted.");
    bullets.push(`${fmtInt(kpis.noResponse)} recipients have not responded; ${vulnerableSilent} registered vulnerable-persons profile${vulnerableSilent === 1 ? " is" : "s are"} silent and being escalated (E-01 → E-03).`);
  } else if (step === 7) {
    headline = `${kpis.help} assistance requests in triage (${openHelp} registered profile${openHelp === 1 ? "" : "s"} still open) — ${kpis.unitsDispatched} units dispatched; escalations running for unresponsive vulnerable residents.`;
    bullets.push("Ambulance A-07 (accessible) en route to Building C; Civil Defence CD-3 to Corniche View ground floor.");
    bullets.push("Clarification requests answered with approved guidance; no resident advised to travel.");
    bullets.push("Welfare check requested for Tower B resident with no response after voice attempts.");
  } else {
    headline = `Incident stabilising: ${share(kpis.safe)} confirmed safe, all assistance cases assigned or resolved, ${fmtInt(kpis.noResponse)} still unconfirmed.`;
    bullets.push("Both high-urgency residents assisted; Tower B resident confirmed safe by building management.");
    bullets.push("Stale public webpage corrected; all six channels consistent with the verified closure statement.");
    bullets.push("Remaining unconfirmed recipients are outside the vulnerable registry; passive monitoring continues until the road reopens.");
  }
  return {
    headline,
    bullets,
    generatedAt: at,
    ai: trace({
      task: "Summarise operational picture for the duty operator",
      inputs: ["Aggregate KPIs", "Open triage items", "Escalation log", "Verified facts"],
      constraints: ["Facts and counts copied from the deterministic state — never estimated", "No recommendations that change an approved action", "Refreshes on every state change"],
      rationale: "Ordered by operator relevance: people needing help first, then reach/coverage, then housekeeping.",
      confidence: 0.93,
    }),
  };
}
