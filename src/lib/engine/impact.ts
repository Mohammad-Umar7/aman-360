/**
 * Deterministic safety layer — person-level impact analysis.
 *
 * Every decision here is rule-based and traceable. Rules:
 *  R-01 location inside active hazard polygon            -> affected (in zone)
 *  R-02 planned route touches a CLOSED segment            -> affected (route)
 *  R-03 affected by route AND safe alternative exists     -> REROUTE (+ delay)
 *  R-04 in zone AND indoors                               -> SHELTER_IN_PLACE
 *  R-05 no impact                                         -> NO_ACTION (alert suppressed)
 *  R-06 affected AND accessibility need                   -> OFFER_ASSISTANCE
 *  R-07 in zone AND outdoors                              -> AVOID_AREA to nearest safe assembly point
 *  R-08 channel selection from consent, device and needs
 */

import { ASSEMBLY_POINTS, edgeById, nodeById, roadById } from "@/lib/data/district";
import { dist, pointInPolygon, polylineTouchesSegment } from "@/lib/engine/geometry";
import { evaluateRoute } from "@/lib/engine/routing";
import type { ActionCode, Channel, HazardEvent, ImpactAssessment, Person, RuleTrace, Severity } from "@/lib/types";

export interface ImpactContext {
  hazard: HazardEvent;
  closedEdges: string[];
}

export function assessPerson(person: Person, ctx: ImpactContext): ImpactAssessment {
  const rules: RuleTrace[] = [];
  const closed = new Set(ctx.closedEdges);

  // R-01 — location inside hazard polygon
  const inZone = pointInPolygon(person.location, ctx.hazard.polygon);
  rules.push({
    rule: "R-01",
    title: "Location inside active hazard polygon",
    fired: inZone,
    detail: inZone
      ? `Point (${person.location.x}, ${person.location.y}) is inside ${ctx.hazard.id} (ray-cast test).`
      : `Point (${person.location.x}, ${person.location.y}) is outside ${ctx.hazard.id}.`,
  });

  // R-02 — route intersects closed segment
  let routeHit = false;
  let route = person.route ? evaluateRoute(person.location, person.route, closed, ctx.hazard.polygon) : undefined;
  if (person.route) {
    for (const edgeId of ctx.closedEdges) {
      const e = edgeById(edgeId);
      if (polylineTouchesSegment(route!.original, nodeById(e.from).p, nodeById(e.to).p)) routeHit = true;
    }
  }
  rules.push({
    rule: "R-02",
    title: "Planned route touches a closed segment",
    fired: routeHit,
    detail: person.route
      ? routeHit
        ? `Route ${person.route.join(" → ")} crosses ${ctx.closedEdges.map((id) => roadById(edgeById(id).road).name).join(", ")} (closed).`
        : `Route ${person.route.join(" → ")} does not touch any closed segment.`
      : "No active route (not travelling).",
  });

  const affected = inZone || routeHit;
  let action: ActionCode = "NO_ACTION";
  let severity: Severity = "none";
  let assemblyPointId: string | undefined;

  // R-03 — reroute
  const canReroute = routeHit && !!route?.alternative;
  rules.push({
    rule: "R-03",
    title: "Safe alternative route exists",
    fired: canReroute,
    detail: routeHit
      ? canReroute
        ? `Alternative via ${route!.viaRoads.join(" → ")} avoids closed segments and ${ctx.hazard.id}; +${route!.delayMinutes} min.`
        : "No alternative avoiding closures and the hazard polygon — shelter guidance applies."
      : "Not applicable (route not affected).",
  });
  if (routeHit) {
    action = canReroute ? "REROUTE" : "SHELTER_IN_PLACE";
    severity = "medium";
  }

  // R-04 — shelter in place
  const indoors = person.context === "home" || person.context === "office";
  const shelter = inZone && indoors;
  rules.push({
    rule: "R-04",
    title: "In zone and indoors → shelter in place",
    fired: shelter,
    detail: shelter ? `${person.contextNote}. Building is above modelled water level; remaining indoors is the approved action.` : inZone ? "Person is outdoors." : "Not in zone.",
  });
  if (shelter) {
    action = "SHELTER_IN_PLACE";
    severity = "medium";
  }

  // R-07 — outdoors in zone → avoid area
  const outdoorsInZone = inZone && !indoors;
  if (outdoorsInZone) {
    const candidates = ASSEMBLY_POINTS.filter((ap) => !pointInPolygon(ap.p, ctx.hazard.polygon)).filter((ap) => person.accessibility.mobility === "standard" || ap.accessible);
    const nearest = candidates.sort((a, b) => dist(a.p, person.location) - dist(b.p, person.location))[0];
    assemblyPointId = nearest?.id;
    action = "AVOID_AREA";
    severity = "high";
  }
  rules.push({
    rule: "R-07",
    title: "In zone and outdoors → move to safe assembly point",
    fired: outdoorsInZone,
    detail: outdoorsInZone ? `Nearest assembly point outside ${ctx.hazard.id}: ${ASSEMBLY_POINTS.find((a) => a.id === assemblyPointId)?.name}.` : "Not applicable.",
  });

  // R-06 — accessibility need
  const needsAssist = affected && (person.accessibility.mobility !== "standard" || !!person.accessibility.hearing || !!person.accessibility.vision);
  rules.push({
    rule: "R-06",
    title: "Accessibility need → offer accessible assistance",
    fired: needsAssist,
    detail: needsAssist
      ? `Profile: ${person.accessibility.mobility}${person.accessibility.hearing ? ", hearing" : ""}${person.accessibility.vision ? ", vision" : ""} — standard self-evacuation not assumed; assistance offered with a one-tap request.`
      : "No registered accessibility need.",
  });
  if (needsAssist) {
    action = "OFFER_ASSISTANCE";
    severity = "high";
  }

  // R-05 — no impact
  rules.push({
    rule: "R-05",
    title: "No impact → suppress alert",
    fired: !affected,
    detail: !affected ? "Outside the hazard polygon and no route conflict. No message issued (alert-fatigue policy)." : "Not applicable (person is affected).",
  });

  // R-08 — channels
  const channels = selectChannels(person);
  rules.push({
    rule: "R-08",
    title: "Channel selection",
    fired: affected,
    detail: affected ? `Consent: ${consentLabel(person)}; device: ${person.accessibility.smartphone ? "smartphone" : "feature phone / landline"} → ${channels.map(channelLabel).join(" + ")}.` : "Not applicable.",
  });

  return {
    personId: person.id,
    affected,
    severity,
    action,
    rules,
    route,
    assemblyPointId,
    channels: affected ? channels : [],
    reason: reasonFor(person, { inZone, routeHit, action }),
  };
}

export function selectChannels(person: Person): Channel[] {
  let ch = [...person.channels];
  if (!person.accessibility.smartphone) {
    ch = ch.filter((c) => c !== "app");
    if (!ch.includes("sms")) ch.push("sms");
    if (!ch.includes("voice")) ch.push("voice");
  }
  if (person.accessibility.hearing) ch = ch.filter((c) => c !== "voice");
  if (person.accessibility.vision && !ch.includes("voice")) ch.unshift("voice");
  return ch;
}

function reasonFor(person: Person, r: { inZone: boolean; routeHit: boolean; action: ActionCode }): string {
  if (r.action === "NO_ACTION") return "Outside the impact area — no alert issued";
  if (r.action === "REROUTE") return "Active route crosses the closed underpass";
  if (r.action === "OFFER_ASSISTANCE") return `Inside the hazard polygon with ${person.accessibility.mobility === "wheelchair" ? "wheelchair" : "accessibility"} needs`;
  if (r.action === "AVOID_AREA") return "Outdoors inside the hazard polygon";
  return "Inside the hazard polygon (indoors)";
}

export const channelLabel = (c: Channel): string =>
  ({ sms: "SMS", app: "App push", voice: "Voice call", web: "Website", signage: "Digital signage", operator: "Call centre" })[c];

export const consentLabel = (p: Person): string =>
  ({ app_opt_in: "app opt-in", building_registry: "building registry", vulnerable_registry: "vulnerable-persons registry", cell_broadcast: "cell broadcast" })[p.consent];
