import type { StepMeta } from "@/lib/types";

export const STEPS: StepMeta[] = [
  { index: 0, id: "normal", title: "Normal operations", short: "Normal", caption: "Calm district. All feeds nominal. No active incident.", offsetSec: 0, durationSec: 7, layer: "system" },
  { index: 1, id: "onset", title: "Flash flood onset", short: "Onset", caption: "Convective rain over the district. Water accumulates in the Al Majaz underpass. Hazard feeds arrive.", offsetSec: 230, durationSec: 16, layer: "system" },
  { index: 2, id: "assurance", title: "Communication assurance", short: "Verify", caption: "Sources disagree on the road status. AMAN resolves the contradiction through the approved source hierarchy.", offsetSec: 262, durationSec: 12, layer: "deterministic" },
  { index: 3, id: "impact", title: "Impact analysis", short: "Impact", caption: "Who is actually affected? Deterministic checks for every registered person and active route.", offsetSec: 300, durationSec: 12, layer: "deterministic" },
  { index: 4, id: "compose", title: "Personalised communication", short: "Compose", caption: "Approved actions become clear, bilingual, accessible instructions.", offsetSec: 350, durationSec: 12, layer: "ai" },
  { index: 5, id: "deliver", title: "Multi-channel delivery", short: "Deliver", caption: "One verified truth, adapted to every channel and delivered.", offsetSec: 420, durationSec: 12, layer: "ai" },
  { index: 6, id: "respond", title: "Citizen response loop", short: "Respond", caption: "Residents confirm they are safe, ask questions, or request help. Silence is tracked too.", offsetSec: 900, durationSec: 14, layer: "ai" },
  { index: 7, id: "triage", title: "Triage & government intelligence", short: "Triage", caption: "Responses grouped and prioritised. Assistance dispatched. Escalations run for the unresponsive.", offsetSec: 1320, durationSec: 14, layer: "deterministic" },
  { index: 8, id: "final", title: "Operational picture", short: "Outcome", caption: "Government knows who was reached, who is safe, and who still needs help.", offsetSec: 2100, durationSec: 10, layer: "system" },
];

export const LAST_STEP = STEPS.length - 1;
