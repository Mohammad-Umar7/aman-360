/**
 * AI Communication Intelligence — operator situation summary (simulated model).
 */

import { trace } from "@/lib/ai/provider";
import { fmtInt, pct } from "@/lib/format";
import type { Kpis, OperatorSummary, TriageItem } from "@/lib/types";

export function operatorSummary(step: number, kpis: Kpis, triage: TriageItem[], at: string): OperatorSummary | null {
  if (step < 3) return null;
  const open = triage.filter((t) => t.status !== "resolved");
  const bullets: string[] = [];
  let headline = "";
  if (step === 3) {
    headline = `${fmtInt(kpis.affected)} people identified as affected by the Al Majaz underpass flood; no messages issued yet.`;
    bullets.push("Affected set = residents of 4 buildings inside FZ-0912 + registered daytime occupants + eastbound road users approaching the closure.");
    bullets.push("3 profiles carry accessibility flags; 1 has no smartphone — SMS + voice path selected.");
    bullets.push("2 road users on Al Majaz Road require rerouting; alternative via King Faisal Street verified (+6 min).");
  } else if (step === 4) {
    headline = `Messages composed for ${fmtInt(kpis.affected)} recipients in Arabic and English; 1 outdoor instruction awaits operator confirmation.`;
    bullets.push("All wording locked to SOP-FF-03 approved actions; verified facts referenced with source and timestamp.");
    bullets.push("Public website banner and VMS-07 signage prepared from the same verified statement.");
  } else if (step === 5) {
    headline = `${fmtInt(kpis.reached)} of ${fmtInt(kpis.affected)} recipients reached (${pct(kpis.reached / kpis.affected)}); average delivery ${kpis.avgDeliverySec.toFixed(1)} s.`;
    bullets.push(`${fmtInt(kpis.read)} confirmed reads so far; ${fmtInt(kpis.affected - kpis.reached)} not yet reached — retry via next channel is scheduled (E-01).`);
    bullets.push("Channel consistency 100%: every published variant matches the verified closure statement.");
  } else if (step === 6) {
    headline = `${fmtInt(kpis.safe)} confirmed safe; ${kpis.help} assistance requests and ${kpis.clarification} clarification requests need attention; ${fmtInt(kpis.noResponse)} silent.`;
    bullets.push("Two highest-urgency requests are ground-floor residents reporting water entering the building (one wheelchair user).");
    bullets.push("One resident reports a situation different from the modelled context (outdoors at the bus stop) — operator reply drafted.");
    bullets.push(`${fmtInt(kpis.noResponse)} recipients have not responded; ${kpis.operatorReview} are on the vulnerable-persons registry and are being escalated.`);
  } else if (step === 7) {
    headline = `${open.length} assistance cases active — ${kpis.unitsDispatched} units dispatched; escalations running for unresponsive vulnerable residents.`;
    bullets.push("Ambulance A-07 (accessible) en route to Building C; Civil Defence CD-3 to Corniche View ground floor.");
    bullets.push("Clarification requests answered with approved guidance; no resident advised to travel.");
    bullets.push("Welfare check requested for Tower B resident with no response after voice attempts.");
  } else {
    headline = `Incident stabilising: ${pct(kpis.safe / kpis.affected)} confirmed safe, all assistance cases assigned or resolved, ${fmtInt(kpis.noResponse)} still unconfirmed.`;
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
