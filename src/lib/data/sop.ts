/**
 * Approved response actions (Civil Defence SOP registry — synthetic references).
 * The AI layer may adapt wording; it may never change which action applies.
 */

import type { ActionCode, ApprovedAction } from "@/lib/types";

export const ACTIONS: Record<ActionCode, ApprovedAction> = {
  REROUTE: {
    code: "REROUTE",
    sop: "SOP-FF-03 §4.2",
    title: "Reroute via verified alternative",
    titleAr: "تغيير المسار عبر بديل موثّق",
    summary: "Road user is directed to a verified alternative route that avoids closed segments and the active hazard polygon.",
    approvedBy: "Abu Dhabi Civil Defence",
  },
  SHELTER_IN_PLACE: {
    code: "SHELTER_IN_PLACE",
    sop: "SOP-FF-03 §4.4",
    title: "Shelter in place",
    titleAr: "البقاء في المكان",
    summary: "Person indoors within the hazard polygon remains inside and avoids driving until roads are reopened.",
    approvedBy: "Abu Dhabi Civil Defence",
  },
  OFFER_ASSISTANCE: {
    code: "OFFER_ASSISTANCE",
    sop: "SOP-FF-03 §4.6",
    title: "Offer accessible assistance",
    titleAr: "تقديم مساعدة ميسّرة",
    summary: "Person with mobility or communication needs inside the hazard polygon is offered assistance with a one-tap request path.",
    approvedBy: "Abu Dhabi Civil Defence",
  },
  AVOID_AREA: {
    code: "AVOID_AREA",
    sop: "SOP-FF-03 §4.3",
    title: "Move away to a safe assembly point",
    titleAr: "الابتعاد إلى نقطة تجمّع آمنة",
    summary: "Person outdoors inside the hazard polygon moves to the nearest safe assembly point reachable without crossing a closed segment.",
    approvedBy: "Abu Dhabi Civil Defence",
  },
  NO_ACTION: {
    code: "NO_ACTION",
    sop: "SOP-FF-03 §3.1",
    title: "No alert",
    titleAr: "لا تنبيه",
    summary: "Not affected. No message is issued, avoiding alert fatigue and unnecessary concern.",
    approvedBy: "Policy",
  },
};
