/**
 * Scripted (synthetic) outcomes for the flash-flood demo: what each person did,
 * when responses arrived, and what the timeline shows. Deterministic decisions
 * (impact, routing, assurance, triage scoring) are still computed by the engines;
 * this file only supplies the human behaviour the prototype cannot observe.
 */

import type { Channel, Kpis, Lang, Layer, OperatorItem, PersonStatus, ResponseCategory, TimelineEvent, TriageStatus } from "@/lib/types";

export interface PersonScript {
  status: PersonStatus[]; // index = step
  readSec?: number;
  readChannel?: Channel;
  response?: { sec: number; channel: Channel; text: string; lang: Lang; hint: ResponseCategory };
  escalation?: { rule: string; sec: number; step: number; outcome: string; channel?: Channel }[];
  triage?: { fromStep: number; unit?: string; eta?: string; recommended: string; statusByStep: Partial<Record<number, TriageStatus>>; resolution?: string };
  operatorReply?: { sec: number; text: string; textAr: string };
}

const N = "normal";
const A = "affected";
const M = "message_ready";

export const SCRIPT: Record<string, PersonScript> = {
  ahmed: {
    status: [N, N, N, A, M, "read", "safe", "safe", "safe"],
    readSec: 372,
    readChannel: "app",
    response: { sec: 401, channel: "app", text: "Got it, taking King Faisal St.", lang: "en", hint: "safe" },
  },
  fatima: {
    status: [N, N, N, A, M, "read", "safe", "safe", "safe"],
    readSec: 380,
    readChannel: "app",
    response: { sec: 415, channel: "app", text: "نحن بخير في المنزل، شكراً", lang: "ar", hint: "safe" },
  },
  sara: {
    status: [N, N, N, A, M, "read", "help", "assistance_assigned", "resolved"],
    readSec: 376,
    readChannel: "app",
    response: {
      sec: 422,
      channel: "app",
      text: "Request assistance — Water is coming under the lobby door and the ramp is flooded, I can't get out on my own.",
      lang: "en",
      hint: "help",
    },
    triage: {
      fromStep: 6,
      unit: "Ambulance A-07 (accessible)",
      eta: "6 min",
      recommended: "Dispatch accessible unit from Al Majaz Medical Centre; building management to meet at Building C entrance.",
      statusByStep: { 6: "open", 7: "assigned", 8: "resolved" },
      resolution: "A-07 on scene 14:29 — assisted to 2nd floor with building staff; ramp ingress sandbagged.",
    },
  },
  omar: { status: [N, N, N, "no_alert", "no_alert", "no_alert", "no_alert", "no_alert", "no_alert"] },
  layla: {
    status: [N, N, N, A, M, "read", "different", "different", "safe"],
    readSec: 384,
    readChannel: "app",
    response: {
      sec: 555,
      channel: "app",
      text: "أنا في محطة الحافلات والمياه ترتفع على الطريق. هل أعود إلى المنزل أم أنتظر الحافلة؟",
      lang: "ar",
      hint: "different",
    },
    triage: {
      fromStep: 6,
      recommended: "Operator reply: do not wait for the bus (service suspended on Al Majaz Road); walk to Al Majaz Community Hall via the south side of the block.",
      statusByStep: { 6: "open", 7: "in_progress", 8: "resolved" },
      resolution: "Confirmed arrival at Community Hall 14:29.",
    },
    operatorReply: {
      sec: 1020,
      text: "Please do not wait for the bus — buses are suspended on Al Majaz Road. Walk to Al Majaz Community Hall (270 m south) using the south side of the block. Reply when you arrive.",
      textAr: "يُرجى عدم انتظار الحافلة — خدمة الحافلات متوقفة على طريق المجاز. توجهي سيراً إلى قاعة مجتمع المجاز (270 متراً جنوباً) عبر الجانب الجنوبي من المبنى. أرسلي رسالة عند وصولك.",
    },
  },
  yusuf: {
    status: [N, N, N, A, M, "delivered", "no_response", "no_response", "resolved"],
    escalation: [
      { rule: "E-01", sec: 655, step: 6, outcome: "SMS unread after 5 min — automated voice call placed: no answer", channel: "voice" },
      { rule: "E-02", sec: 955, step: 7, outcome: "Second automated voice call: no answer", channel: "voice" },
      { rule: "E-03", sec: 1260, step: 7, outcome: "Welfare check requested via Tower B building management (vulnerable-persons registry)" },
      { rule: "E-03", sec: 1740, step: 8, outcome: "Building security confirmed resident safe in apartment 3-02 at 14:31 (phone switched off)" },
    ],
    triage: {
      fromStep: 7,
      unit: "Tower B building management",
      eta: "welfare check",
      recommended: "Welfare check by building management; field unit if unconfirmed by 14:40.",
      statusByStep: { 7: "in_progress", 8: "resolved" },
      resolution: "Confirmed safe by building security at 14:31.",
    },
  },
  mariam: {
    status: [N, N, N, A, M, "read", "safe", "safe", "safe"],
    readSec: 379,
    readChannel: "app",
    response: { sec: 430, channel: "app", text: "بخير", lang: "ar", hint: "safe" },
  },
  khalid: {
    status: [N, N, N, A, M, "read", "safe", "safe", "safe"],
    readSec: 388,
    readChannel: "app",
    response: { sec: 440, channel: "app", text: "Safe. Water on the street outside but nothing in the building.", lang: "en", hint: "safe" },
  },
  noura: {
    status: [N, N, N, A, M, "read", "clarification", "clarification", "safe"],
    readSec: 391,
    readChannel: "app",
    response: { sec: 605, channel: "app", text: "هل يمكنني الخروج لإحضار أطفالي من المدرسة في شارع الملك فيصل؟", lang: "ar", hint: "clarification" },
    triage: {
      fromStep: 6,
      recommended: "Reply with approved guidance: do not drive; schools on King Faisal Street are holding students until roads reopen.",
      statusByStep: { 6: "open", 7: "resolved", 8: "resolved" },
      resolution: "Approved reply sent 14:19; resident acknowledged.",
    },
    operatorReply: {
      sec: 1000,
      text: "Please do not drive. Schools on King Faisal Street are holding students safely until roads reopen; the school will contact you directly.",
      textAr: "يُرجى عدم القيادة. المدارس في شارع الملك فيصل تحتفظ بالطلاب بأمان حتى إعادة فتح الطرق، وستتواصل المدرسة معك مباشرة.",
    },
  },
  hassan: { status: [N, N, N, "no_alert", "no_alert", "no_alert", "no_alert", "no_alert", "no_alert"] },
  aisha: {
    status: [N, N, N, A, M, "delivered", "help", "assistance_assigned", "resolved"],
    readSec: 680,
    readChannel: "sms",
    response: { sec: 690, channel: "sms", text: "مساعدة — المياه تدخل الطابق الأرضي، ابني ليس هنا وأنا وحدي", lang: "ar", hint: "help" },
    triage: {
      fromStep: 6,
      unit: "Civil Defence CD-3",
      eta: "9 min",
      recommended: "Civil Defence unit with building management; text-only contact (hearing impairment).",
      statusByStep: { 6: "open", 7: "assigned", 8: "resolved" },
      resolution: "CD-3 on scene 14:31 — water ingress contained; resident relocated to 1st floor.",
    },
  },
  rashid: { status: [N, N, N, "no_alert", "no_alert", "no_alert", "no_alert", "no_alert", "no_alert"] },
};

export const AFFECTED_BREAKDOWN = [
  { label: "Residents of 4 buildings inside FZ-0912", labelAr: "سكان 4 مبانٍ داخل FZ-0912", value: 670, source: "Building registries" },
  { label: "Registered daytime occupants in zone", labelAr: "شاغلون نهاريون مسجّلون في المنطقة", value: 210, source: "Employer / facility registries" },
  { label: "Road users approaching the closure", labelAr: "مستخدمو الطريق المقتربون من الإغلاق", value: 404, source: "Cell-broadcast segment estimate" },
];

export const KPI_BY_STEP: Kpis[] = [
  { affected: 0, reached: 0, read: 0, safe: 0, help: 0, clarification: 0, different: 0, noResponse: 0, contradictions: 0, contradictionsResolved: 0, consistency: 1, avgDeliverySec: 0, triageMinutes: 0, operatorReview: 0, unitsDispatched: 0 },
  { affected: 0, reached: 0, read: 0, safe: 0, help: 0, clarification: 0, different: 0, noResponse: 0, contradictions: 0, contradictionsResolved: 0, consistency: 1, avgDeliverySec: 0, triageMinutes: 0, operatorReview: 0, unitsDispatched: 0 },
  { affected: 0, reached: 0, read: 0, safe: 0, help: 0, clarification: 0, different: 0, noResponse: 0, contradictions: 1, contradictionsResolved: 1, consistency: 0.93, avgDeliverySec: 0, triageMinutes: 0, operatorReview: 1, unitsDispatched: 0 },
  { affected: 1284, reached: 0, read: 0, safe: 0, help: 0, clarification: 0, different: 0, noResponse: 0, contradictions: 1, contradictionsResolved: 1, consistency: 0.93, avgDeliverySec: 0, triageMinutes: 0, operatorReview: 0, unitsDispatched: 0 },
  { affected: 1284, reached: 0, read: 0, safe: 0, help: 0, clarification: 0, different: 0, noResponse: 0, contradictions: 1, contradictionsResolved: 1, consistency: 0.93, avgDeliverySec: 0, triageMinutes: 0, operatorReview: 1, unitsDispatched: 0 },
  { affected: 1284, reached: 1197, read: 1044, safe: 0, help: 0, clarification: 0, different: 0, noResponse: 0, contradictions: 1, contradictionsResolved: 1, consistency: 1, avgDeliverySec: 4.8, triageMinutes: 0, operatorReview: 0, unitsDispatched: 0 },
  { affected: 1284, reached: 1211, read: 1102, safe: 611, help: 23, clarification: 41, different: 12, noResponse: 153, contradictions: 1, contradictionsResolved: 1, consistency: 1, avgDeliverySec: 4.8, triageMinutes: 0, operatorReview: 6, unitsDispatched: 0 },
  { affected: 1284, reached: 1231, read: 1140, safe: 702, help: 23, clarification: 41, different: 12, noResponse: 128, contradictions: 1, contradictionsResolved: 1, consistency: 1, avgDeliverySec: 4.8, triageMinutes: 2.4, operatorReview: 3, unitsDispatched: 5 },
  { affected: 1284, reached: 1247, read: 1188, safe: 803, help: 23, clarification: 41, different: 12, noResponse: 53, contradictions: 1, contradictionsResolved: 1, consistency: 1, avgDeliverySec: 4.8, triageMinutes: 2.1, operatorReview: 0, unitsDispatched: 5 },
];

type Ev = [sec: number, step: number, layer: Layer, kind: TimelineEvent["kind"], title: string, detail?: string];

export const TIMELINE: Ev[] = [
  [0, 0, "system", "system", "AMAN 360 online — 6 official feeds connected", "Police, Municipality GIS, NCM, RTA, public portal crawl, Civil Defence SOP registry. All nominal."],
  [45, 0, "system", "system", "NCM radar: convective cell approaching from the north-west", "No alert issued yet. Passive monitoring."],
  [130, 1, "system", "hazard", "NCM orange alert received — convective rain 40–60 mm/h", "Valid until 16:00 for Sharjah central districts."],
  [175, 1, "system", "hazard", "Drainage sensor UP-07: underpass water level 0.6 m and rising", "Pump capacity exceeded at 14:04."],
  [199, 1, "system", "source", "Municipality GIS: hazard polygon FZ-0912 ACTIVE (severe)", "1-in-25-year surface-water event; modelled underpass depth > 1.5 m."],
  [209, 1, "system", "source", "Police Operations: Al Majaz underpass CLOSED both directions", "Patrol 4-12 on site, barriers deployed."],
  [210, 1, "system", "source", "RTA traffic: Al Majaz Road eastbound heavy congestion (9 km/h)", "Superseded by the closure for routing purposes."],
  [220, 1, "system", "source", "Public portal crawl: roadworks page states Al Majaz Road OPEN", "Page last updated 26 Aug 2026 — stale."],
  [225, 1, "system", "source", "Civil Defence: SOP-FF-03 v4.1 applies", "Approved actions loaded: reroute, shelter in place, accessible assistance, avoid area."],
  [227, 2, "deterministic", "assurance", "Contradiction detected: Al Majaz underpass — Police CLOSED vs portal OPEN", "Subject road:al-majaz-underpass; two definitive claims cannot both be true."],
  [232, 2, "deterministic", "assurance", "Resolved via source hierarchy: Police Operations (rank 1) prevails", "Portal content stale by 14 days; corroborated by GIS polygon and NCM alert."],
  [235, 2, "deterministic", "assurance", "Verified fact published: Al Majaz underpass CLOSED — assurance 0.98", "Available to every downstream channel as the single source of truth."],
  [238, 2, "system", "operator", "Correction notice queued to web content team; portal banner override armed", "Stale page annotated with the verified status until corrected."],
  [241, 2, "ai", "assurance", "Operator brief: contradiction explained in plain language", "Why the portal disagreed, what was chosen, and what happens next."],
  [270, 3, "deterministic", "impact", "Impact analysis started — 1,284 people and active routes evaluated", "Against FZ-0912 and the verified closure. Runtime 1.2 s."],
  [271, 3, "deterministic", "impact", "Route check: active routes crossing the closed underpass identified", "Alternative via King Faisal Street verified: avoids closures and the hazard polygon, +6 min."],
  [272, 3, "deterministic", "impact", "Polygon check: 4 buildings inside FZ-0912 (670 residents)", "Tower A, Tower B, Building C, Corniche View."],
  [273, 3, "deterministic", "impact", "Accessibility: 3 registered profiles require accessible actions", "Wheelchair user, limited mobility (×2), one hearing impairment, one without smartphone."],
  [274, 3, "deterministic", "impact", "Suppressed: 3 nearby profiles outside the impact area — no alert (R-05)", "Sharjah Business Tower, Buhaira Court, King Faisal Street traffic."],
  [310, 4, "ai", "message", "Messages composed: 4 approved actions → Arabic + English, channel-ready", "Wording only; action and facts locked by the deterministic layer."],
  [312, 4, "ai", "message", "Layla Ahmed — outdoor movement instruction flagged for operator confirmation", "Policy: instructions that move a person outdoors require human approval."],
  [340, 4, "system", "operator", "Duty operator N. Al Hammadi confirmed message for Layla Ahmed", "Approved without edits."],
  [345, 4, "ai", "message", "Public channels prepared from the verified statement", "Portal banner, VMS-07 signage, call-centre script v2."],
  [355, 5, "system", "delivery", "Delivery started — 1,284 recipients across app, SMS and voice", "Critical-alert push first, SMS in parallel, IVR for no-smartphone profiles."],
  [360, 5, "system", "delivery", "VMS-07 updated · portal banner live · call-centre script pushed", "All derived from the same verified statement."],
  [372, 5, "system", "delivery", "1,197 delivered (93%) · average 4.8 s · 87 pending retry", "Retries scheduled via next channel (E-01)."],
  [390, 5, "deterministic", "delivery", "Channel consistency check: 6/6 channels consistent", "Every published variant names the road, the verified status and the alternative."],
  [401, 6, "ai", "response", "Ahmed Al Mansoori confirms safe", "\"Got it, taking King Faisal St.\" — classified safe (0.96)."],
  [415, 6, "ai", "response", "Fatima Al Zaabi confirms safe", "Arabic reply classified safe (0.95)."],
  [422, 6, "ai", "response", "Sara Hassan requests assistance — urgency 5", "Water entering lobby, ramp flooded, cannot self-evacuate."],
  [555, 6, "ai", "response", "Layla Ahmed reports a different situation", "Outdoors at the bus stop; asks whether to go home or wait. Flagged for operator."],
  [605, 6, "ai", "response", "Noura Abdullah asks for clarification", "Whether she may collect children from school on King Faisal Street."],
  [655, 6, "deterministic", "triage", "Yusuf Ibrahim: no read after 5 min — E-01 voice call placed, no answer", "Escalation continues per SOP."],
  [690, 6, "ai", "response", "Aisha Kamal requests assistance via SMS — urgency 4", "Water entering ground floor; alone; hearing impairment (text-only contact)."],
  [880, 6, "system", "system", "Response window: 611 safe · 23 help · 41 clarification · 12 different · 153 silent", "Aggregate across all recipients."],
  [955, 7, "deterministic", "triage", "Yusuf Ibrahim: E-02 second voice call — no answer", ""],
  [965, 7, "deterministic", "triage", "Triage queue built — 23 assistance requests scored", "Vulnerability, mobility, zone and silence weighted; scores are explainable."],
  [970, 7, "deterministic", "triage", "Priority 1: Sara Hassan — Ambulance A-07 (accessible) dispatched", "From Al Majaz Medical Centre via Corniche Street, ETA 6 min."],
  [975, 7, "deterministic", "triage", "Priority 2: Aisha Kamal — Civil Defence CD-3 dispatched", "With building management, ETA 9 min."],
  [1000, 7, "ai", "message", "Clarification replies drafted from approved guidance", "Operator approved; no resident advised to travel."],
  [1020, 7, "system", "operator", "Reply sent to Layla Ahmed: walk to Community Hall; buses suspended", ""],
  [1260, 7, "deterministic", "triage", "Yusuf Ibrahim: E-03 welfare check requested via Tower B building management", "Field unit if unconfirmed by 14:40."],
  [1300, 7, "ai", "system", "Operational summary refreshed for the duty officer", ""],
  [1620, 8, "system", "triage", "A-07 on scene — Sara Hassan assisted to 2nd floor", "Ramp ingress sandbagged."],
  [1625, 8, "system", "response", "Layla Ahmed confirmed arrival at Community Hall", ""],
  [1740, 8, "system", "triage", "CD-3 on scene — Aisha Kamal assisted; ingress contained", ""],
  [1745, 8, "deterministic", "triage", "Building security confirmed Yusuf Ibrahim safe (phone switched off)", "E-03 closed."],
  [1860, 8, "system", "assurance", "Public roadworks page corrected by web team — all channels consistent", ""],
  [2040, 8, "system", "hazard", "Underpass level falling (0.9 m) — Police to reassess reopening at 15:15", ""],
  [2100, 8, "system", "system", "Operational picture: 803 safe · 23 assisted · 53 unconfirmed (non-vulnerable)", "Passive monitoring continues until the road reopens."],
];

export const OPERATOR_QUEUE: Record<number, OperatorItem[]> = {
  0: [],
  1: [{ id: "oq-1", priority: "medium", title: "Hazard feeds arriving — awaiting verification", detail: "Police closure, GIS polygon and portal crawl received within 30 s.", layer: "system" }],
  2: [
    { id: "oq-2", priority: "low", title: "Contradiction resolved automatically — review rationale", detail: "Portal page stale (26 Aug). Correction notice queued.", layer: "deterministic", action: "Acknowledge" },
    { id: "oq-3", priority: "low", title: "Confirm barriers deployed with patrol 4-12", detail: "Police feed reports barriers in place at both approaches.", layer: "system", action: "Confirm" },
  ],
  3: [{ id: "oq-4", priority: "medium", title: "Impact set ready — 1,284 people", detail: "3 accessibility profiles, 1 without smartphone. Review before composing.", layer: "deterministic", action: "Review" }],
  4: [{ id: "oq-5", priority: "high", title: "Layla Ahmed — outdoor movement instruction needs confirmation", detail: "AI flagged: instruction asks the recipient to move. Approve or edit.", layer: "ai", personId: "layla", action: "Approve" }],
  5: [{ id: "oq-6", priority: "low", title: "87 recipients pending retry", detail: "E-01 retries via next channel scheduled at +5 min.", layer: "deterministic" }],
  6: [
    { id: "oq-7", priority: "high", title: "Sara Hassan — assistance request (urgency 5)", detail: "Water entering lobby, ramp flooded, cannot self-evacuate.", layer: "ai", personId: "sara", action: "Dispatch" },
    { id: "oq-8", priority: "high", title: "Aisha Kamal — assistance request (urgency 4)", detail: "Ground floor ingress; alone; text-only contact.", layer: "ai", personId: "aisha", action: "Dispatch" },
    { id: "oq-9", priority: "medium", title: "Layla Ahmed — situation differs from model", detail: "Outdoors at bus stop; reply drafted.", layer: "ai", personId: "layla", action: "Reply" },
    { id: "oq-10", priority: "medium", title: "Noura Abdullah — clarification request", detail: "Asks about collecting children from school.", layer: "ai", personId: "noura", action: "Reply" },
    { id: "oq-11", priority: "medium", title: "Yusuf Ibrahim — no read after 5 min", detail: "E-01 voice call placed, no answer. Vulnerable registry.", layer: "deterministic", personId: "yusuf" },
  ],
  7: [
    { id: "oq-12", priority: "high", title: "Yusuf Ibrahim — welfare check requested (E-03)", detail: "Tower B building management contacted 14:23. Field unit if unconfirmed by 14:40.", layer: "deterministic", personId: "yusuf" },
    { id: "oq-13", priority: "medium", title: "A-07 en route to Building C", detail: "ETA 6 min via Corniche Street. Building management notified.", layer: "system", personId: "sara" },
    { id: "oq-14", priority: "low", title: "CD-3 en route to Corniche View", detail: "ETA 9 min.", layer: "system", personId: "aisha" },
  ],
  8: [{ id: "oq-15", priority: "low", title: "53 unconfirmed recipients — passive monitoring", detail: "None on the vulnerable registry. Re-check at road reopening.", layer: "deterministic" }],
};
