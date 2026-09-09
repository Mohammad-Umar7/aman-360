/**
 * AMAN 360 — shared domain model.
 *
 * Two intelligence layers are visible throughout the product:
 *  - "deterministic": rule-based / geospatial safety logic (never an LLM)
 *  - "ai": communication intelligence (wording, language, summarisation, classification)
 */

export type Lang = "en" | "ar";
export type Layer = "deterministic" | "ai" | "system";

export interface Point {
  x: number;
  y: number;
}
export type Polygon = Point[];

/* ------------------------------------------------------------------ */
/* Geography                                                           */
/* ------------------------------------------------------------------ */

export interface RoadNode {
  id: string;
  p: Point;
}

export interface RoadEdge {
  id: string;
  from: string;
  to: string;
  road: string; // road id
  closable?: boolean;
}

export interface Road {
  id: string;
  name: string;
  nameAr: string;
  axis: "ew" | "ns";
  offset: number; // y for ew roads, x for ns roads
  width: number;
}

export type BuildingKind = "residential" | "office" | "hospital" | "mosque" | "community" | "retail" | "clinic";

export interface Building {
  id: string; // matches the Blender object name
  name: string;
  nameAr: string;
  p: Point;
  w: number;
  d: number;
  floors: number;
  kind: BuildingKind;
  occupants: number;
  registry: "building_management" | "employer" | "public";
}

export interface AssemblyPoint {
  id: string;
  name: string;
  nameAr: string;
  p: Point;
  accessible: boolean;
}

export interface HazardEvent {
  id: string;
  type: "flash_flood";
  name: string;
  nameAr: string;
  polygon: Polygon;
  severity: "moderate" | "severe";
  issuedAt: string;
  sourceId: string;
}

/* ------------------------------------------------------------------ */
/* Sources & assurance                                                 */
/* ------------------------------------------------------------------ */

export type SourceKind = "police" | "municipality_gis" | "meteorology" | "transport" | "public_web" | "civil_defence";

export interface SourceFeed {
  id: string;
  name: string;
  nameAr: string;
  org: string;
  kind: SourceKind;
  authorityRank: number; // 1 = highest authority for its subject domain
  domains: string[]; // subjects this source is authoritative for
  protocol: string;
  latencySec: number;
}

export type ClaimValue = "closed" | "open" | "congested" | "hazard_active" | "alert_orange" | "sop_ref";

export interface SourceClaim {
  id: string;
  sourceId: string;
  subject: string; // e.g. road:al-majaz-underpass
  value: ClaimValue;
  text: string;
  textAr: string;
  observedAt: string;
  receivedAt: string;
  stale?: boolean;
}

export interface Contradiction {
  id: string;
  subject: string;
  claims: SourceClaim[];
  winningClaimId: string;
  resolvedAt: string;
  rationale: string[];
  action: string;
}

export interface VerifiedFact {
  subject: string;
  label: string;
  value: string;
  valueAr: string;
  sourceId: string;
  verifiedAt: string;
  assurance: number; // 0..1
}

/* ------------------------------------------------------------------ */
/* People (synthetic)                                                  */
/* ------------------------------------------------------------------ */

export type Context = "driving" | "home" | "walking" | "office";
export type Mobility = "standard" | "wheelchair" | "limited";
export type Channel = "sms" | "app" | "voice" | "web" | "signage" | "operator";
export type Consent = "app_opt_in" | "building_registry" | "vulnerable_registry" | "cell_broadcast";

export interface Person {
  id: string;
  name: string;
  nameAr: string;
  initials: string;
  age: number;
  context: Context;
  contextNote: string;
  location: Point;
  buildingId?: string;
  route?: string[]; // node ids
  destination?: string;
  language: Lang;
  channels: Channel[];
  accessibility: {
    mobility: Mobility;
    hearing?: boolean;
    vision?: boolean;
    smartphone: boolean;
  };
  consent: Consent;
  vulnerableRegistry?: boolean;
  spotlight: boolean;
}

/* ------------------------------------------------------------------ */
/* Deterministic decisions                                             */
/* ------------------------------------------------------------------ */

export type ActionCode = "REROUTE" | "SHELTER_IN_PLACE" | "OFFER_ASSISTANCE" | "AVOID_AREA" | "NO_ACTION";

export interface ApprovedAction {
  code: ActionCode;
  sop: string;
  title: string;
  titleAr: string;
  summary: string;
  approvedBy: string;
}

export interface RuleTrace {
  rule: string;
  title: string;
  fired: boolean;
  detail: string;
}

export interface RouteResult {
  original: Point[];
  alternative?: Point[];
  blockedEdgeId?: string;
  viaRoads: string[];
  delayMinutes: number;
  originalKm: number;
  alternativeKm?: number;
}

export type Severity = "high" | "medium" | "low" | "none";

export interface ImpactAssessment {
  personId: string;
  affected: boolean;
  severity: Severity;
  action: ActionCode;
  rules: RuleTrace[];
  route?: RouteResult;
  assemblyPointId?: string;
  channels: Channel[];
  reason: string;
}

/* ------------------------------------------------------------------ */
/* Communication                                                       */
/* ------------------------------------------------------------------ */

export interface AiTrace {
  model: string;
  task: string;
  inputs: string[];
  constraints: string[];
  rationale: string;
  confidence: number;
  reviewRequired: boolean;
  reviewReason?: string;
}

export interface ChannelVariant {
  channel: Channel;
  en: string;
  ar: string;
  title?: string;
  titleAr?: string;
  cta?: string[];
  ctaAr?: string[];
  meta?: string;
}

export interface Message {
  id: string;
  personId: string;
  action: ActionCode;
  sop: string;
  en: string;
  ar: string;
  variants: ChannelVariant[];
  ai: AiTrace;
  approval: "auto" | "operator";
  createdAt: string;
}

export type DeliveryStatus = "queued" | "sent" | "delivered" | "read" | "acknowledged" | "failed";

export interface DeliveryRecord {
  messageId: string;
  personId: string;
  channel: Channel;
  status: DeliveryStatus;
  at: string;
  latencyMs: number;
  attempt: number;
}

export type ResponseCategory = "safe" | "help" | "clarification" | "different" | "none";

export interface Classification {
  category: ResponseCategory;
  confidence: number;
  urgency: 1 | 2 | 3 | 4 | 5;
  entities: string[];
  summary: string;
}

export interface CitizenResponse {
  id: string;
  personId: string;
  channel: Channel;
  text: string;
  lang: Lang;
  at: string;
  classification: Classification;
}

export interface EscalationStep {
  rule: string;
  at: string;
  action: string;
  channel?: Channel;
  outcome: string;
}

export type TriageStatus = "open" | "assigned" | "in_progress" | "resolved" | "monitoring";

export interface TriageItem {
  id: string;
  personId: string;
  category: ResponseCategory;
  priority: number; // 1 highest
  score: number;
  reasons: string[];
  recommended: string;
  unit?: string;
  eta?: string;
  status: TriageStatus;
  resolution?: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  step: number;
  layer: Layer;
  kind: "hazard" | "source" | "assurance" | "impact" | "message" | "delivery" | "response" | "triage" | "operator" | "system";
  title: string;
  detail?: string;
}

/* ------------------------------------------------------------------ */
/* Aggregate KPIs (prototype figures)                                   */
/* ------------------------------------------------------------------ */

export interface Kpis {
  affected: number;
  reached: number;
  read: number;
  safe: number;
  help: number;
  clarification: number;
  different: number;
  noResponse: number;
  contradictions: number;
  contradictionsResolved: number;
  consistency: number; // 0..1
  avgDeliverySec: number;
  triageMinutes: number;
  operatorReview: number;
  unitsDispatched: number;
}

export type PersonStatus =
  | "normal"
  | "assessing"
  | "affected"
  | "message_ready"
  | "sent"
  | "delivered"
  | "read"
  | "safe"
  | "help"
  | "clarification"
  | "different"
  | "no_response"
  | "assistance_assigned"
  | "resolved"
  | "no_alert";

export interface PersonState {
  person: Person;
  impact?: ImpactAssessment;
  message?: Message;
  deliveries: DeliveryRecord[];
  response?: CitizenResponse;
  escalation: EscalationStep[];
  triage?: TriageItem;
  status: PersonStatus;
}

export interface StepMeta {
  index: number;
  id: string;
  title: string;
  short: string;
  caption: string;
  offsetSec: number; // seconds after incident T0
  durationSec: number; // autoplay duration
  layer: Layer;
}

export interface ScenarioState {
  step: StepMeta;
  clock: string;
  incidentStatus: "normal" | "monitoring" | "active" | "response" | "stabilising";
  hazard?: HazardEvent;
  closures: string[]; // closed edge ids
  claims: SourceClaim[];
  contradictions: Contradiction[];
  facts: VerifiedFact[];
  people: PersonState[];
  responses: CitizenResponse[];
  triage: TriageItem[];
  timeline: TimelineEvent[];
  kpis: Kpis;
  operatorQueue: OperatorItem[];
  summary: OperatorSummary | null;
  channelChecks: ChannelCheck[];
}

export interface OperatorItem {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  layer: Layer;
  personId?: string;
  action?: string;
}

export interface OperatorSummary {
  headline: string;
  bullets: string[];
  generatedAt: string;
  ai: AiTrace;
}

export interface ChannelCheck {
  channel: Channel;
  label: string;
  published: boolean;
  consistent: boolean;
  checks: { name: string; pass: boolean }[];
  lastSync: string;
}
