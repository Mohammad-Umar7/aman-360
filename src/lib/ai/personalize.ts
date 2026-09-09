/**
 * AI Communication Intelligence — personalised, bilingual, channel-adapted messaging.
 *
 * The approved action and the verified facts come from the deterministic layer.
 * This module only decides *how* to say it: language, tone, accessibility,
 * channel constraints (SMS length, push title, IVR script, signage lines).
 */

import { ASSEMBLY_POINTS, REAL_SCALE, ROADS } from "@/lib/data/district";
import { ACTIONS } from "@/lib/data/sop";
import { dist } from "@/lib/engine/geometry";
import { trace } from "@/lib/ai/provider";
import { clockAt } from "@/lib/format";
import type { ActionCode, Channel, ChannelVariant, ImpactAssessment, Message, Person, VerifiedFact } from "@/lib/types";

const ROAD = { en: "Al Majaz Road", ar: "طريق المجاز" };

function altRoad(impact: ImpactAssessment): { en: string; ar: string } {
  // The alternative worth naming is the parallel road that replaces the closed section.
  const closed = ROADS.find((r) => r.name === ROAD.en) ?? ROADS[0];
  const candidates = (impact.route?.viaRoads ?? []).map((name) => ROADS.find((r) => r.name === name)).filter((r): r is (typeof ROADS)[number] => !!r);
  const road = candidates.find((r) => r.axis === closed.axis && r.id !== closed.id) ?? candidates.find((r) => r.id !== closed.id) ?? ROADS[1];
  return { en: road.name, ar: road.nameAr };
}

function compass(dx: number, dy: number): { en: string; ar: string } {
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const dirs: [string, string][] = [
    ["east", "شرقاً"], ["north-east", "شمال شرق"], ["north", "شمالاً"], ["north-west", "شمال غرب"],
    ["west", "غرباً"], ["south-west", "جنوب غرب"], ["south", "جنوباً"], ["south-east", "جنوب شرق"],
  ];
  const idx = Math.round(((ang + 360) % 360) / 45) % 8;
  return { en: dirs[idx][0], ar: dirs[idx][1] };
}

const feminine = (p: Person) => ["fatima", "sara", "layla", "mariam", "noura", "aisha"].includes(p.id);

export function coreMessage(person: Person, impact: ImpactAssessment): { en: string; ar: string } {
  switch (impact.action) {
    case "REROUTE": {
      const alt = altRoad(impact);
      const n = impact.route?.delayMinutes ?? 0;
      return {
        en: `${ROAD.en} is closed due to flooding. Use ${alt.en} instead. Estimated delay: ${n} minutes.`,
        ar: `${ROAD.ar} مغلق بسبب تجمّع مياه الأمطار. يُرجى استخدام ${alt.ar} بدلاً منه. التأخير المتوقع: ${n} دقائق.`,
      };
    }
    case "SHELTER_IN_PLACE":
      if (!person.accessibility.smartphone) {
        return {
          en: "Official notice: roads around your building are affected by flooding. Please remain inside the building. For assistance call 800-AMAN.",
          ar: "إشعار رسمي: الطرق المحيطة بمبناك متأثرة بتجمّع مياه الأمطار. يُرجى البقاء داخل المبنى. للمساعدة اتصل على 800-AMAN.",
        };
      }
      return {
        en: "Flooding has affected roads around your area. Please remain indoors and avoid driving until authorities reopen the roads.",
        ar: "تأثرت الطرق المحيطة بمنطقتك بتجمّع مياه الأمطار. يُرجى البقاء في المنزل وتجنّب القيادة حتى تعيد الجهات المختصة فتح الطرق.",
      };
    case "OFFER_ASSISTANCE":
      if (!person.accessibility.smartphone) {
        return {
          en: "Your area is affected by flooding. Accessible assistance is available. Reply HELP if you need support.",
          ar: "منطقتك متأثرة بتجمّع مياه الأمطار. تتوفر مساعدة ميسّرة. أرسل «مساعدة» إذا كنت بحاجة إلى دعم.",
        };
      }
      return {
        en: "Your area is affected by flooding. Accessible assistance is available. Select Request Assistance if you need support.",
        ar: `منطقتك متأثرة بتجمّع مياه الأمطار. تتوفر مساعدة ميسّرة. ${feminine(person) ? "اختاري" : "اختر"} «طلب المساعدة» إذا كنت بحاجة إلى دعم.`,
      };
    case "AVOID_AREA": {
      const ap = ASSEMBLY_POINTS.find((a) => a.id === impact.assemblyPointId) ?? ASSEMBLY_POINTS[0];
      const m = Math.round((dist(ap.p, person.location) * REAL_SCALE) / 10) * 10;
      const dir = compass(ap.p.x - person.location.x, ap.p.y - person.location.y);
      const f = feminine(person);
      return {
        en: `Flood water is rising on ${ROAD.en} near you. Move away from the underpass to higher ground and stay off the road. Nearest safe point: ${ap.name}, ${m} m ${dir.en}.`,
        ar: `مياه الأمطار ترتفع على ${ROAD.ar} بالقرب منك. ${f ? "ابتعدي" : "ابتعد"} عن النفق إلى مكان مرتفع و${f ? "لا تسيري" : "لا تسر"} على الطريق. أقرب نقطة آمنة: ${ap.nameAr}، على بعد ${m} متراً ${dir.ar}.`,
      };
    }
    case "NO_ACTION":
      return { en: "", ar: "" };
  }
}

const APP_TITLES: Record<ActionCode, { en: string; ar: string; cta: string[]; ctaAr: string[] }> = {
  REROUTE: { en: "Road closed ahead", ar: "الطريق مغلق أمامك", cta: ["Open safe route", "I'm safe"], ctaAr: ["فتح المسار الآمن", "أنا بخير"] },
  SHELTER_IN_PLACE: { en: "Stay indoors — flooding nearby", ar: "ابقَ في المنزل — تجمّع مياه بالقرب منك", cta: ["I'm safe", "I need help"], ctaAr: ["أنا بخير", "أحتاج مساعدة"] },
  OFFER_ASSISTANCE: { en: "Assistance available — flooding in your area", ar: "المساعدة متاحة — تجمّع مياه في منطقتك", cta: ["Request assistance", "I'm safe"], ctaAr: ["طلب المساعدة", "أنا بخير"] },
  AVOID_AREA: { en: "Move to safety now", ar: "انتقل إلى مكان آمن الآن", cta: ["Show safe point", "I'm safe"], ctaAr: ["عرض النقطة الآمنة", "أنا بخير"] },
  NO_ACTION: { en: "", ar: "", cta: [], ctaAr: [] },
};

export function channelVariants(person: Person, impact: ImpactAssessment, core: { en: string; ar: string }): ChannelVariant[] {
  const t = APP_TITLES[impact.action];
  const interactive = impact.action !== "REROUTE";
  const smsTail = interactive ? { en: " Reply SAFE or HELP.", ar: " أرسل «بخير» أو «مساعدة»." } : { en: "", ar: "" };
  const variants: ChannelVariant[] = [
    {
      channel: "sms",
      en: `AMAN: ${core.en}${smsTail.en}`,
      ar: `أمان: ${core.ar}${smsTail.ar}`,
      meta: "Sender ID AMAN-UAE · concatenated if > 160 GSM chars",
    },
    {
      channel: "app",
      title: t.en,
      titleAr: t.ar,
      en: core.en,
      ar: core.ar,
      cta: t.cta,
      ctaAr: t.ctaAr,
      meta: "Critical alert channel · bypasses Do Not Disturb (consented)",
    },
    {
      channel: "voice",
      en: `This is an official message from the Emergency Communication Service. ${core.en} To confirm you are safe, press 1. If you need help, press 2. To hear this message again, press 9.`,
      ar: `هذه رسالة رسمية من خدمة الاتصال في حالات الطوارئ. ${core.ar} لتأكيد أنك بخير اضغط 1. إذا كنت بحاجة إلى مساعدة اضغط 2. لإعادة سماع الرسالة اضغط 9.`,
      meta: "Automated call (IVR) · slow pace · repeats on request",
    },
    {
      channel: "operator",
      en: `1. Confirm the caller's location and whether they are driving.\n2. Verified status (14:05:29, Police Operations): Al Majaz Road underpass is CLOSED in both directions.\n3. Advise: ${core.en}\n4. Ask: "Are you safe? Do you need assistance?" — log the answer.`,
      ar: `1. تأكد من موقع المتصل وما إذا كان يقود.\n2. الحالة الموثّقة (14:05:29، عمليات الشرطة): نفق طريق المجاز مغلق في الاتجاهين.\n3. التوجيه: ${core.ar}\n4. اسأل: «هل أنت بخير؟ هل تحتاج إلى مساعدة؟» — سجّل الإجابة.`,
      meta: "Call-centre script · 800-AMAN",
    },
  ];
  return variants;
}

/** Public channels are derived once from the verified facts, not per person. */
export function publicVariants(facts: VerifiedFact[]): ChannelVariant[] {
  const road = facts.find((f) => f.subject === "road:al-majaz-underpass");
  const verified = road ? `Verified ${road.verifiedAt} · Police Operations` : "";
  return [
    {
      channel: "web",
      title: "Al Majaz Road underpass closed — flooding",
      titleAr: "إغلاق نفق طريق المجاز — تجمّع مياه الأمطار",
      en: `Al Majaz Road (underpass section) is closed in both directions due to flooding. Use King Faisal Street or Corniche Street. Residents in the affected blocks should remain indoors until roads reopen. ${verified}.`,
      ar: `طريق المجاز (قسم النفق) مغلق في الاتجاهين بسبب تجمّع مياه الأمطار. يُرجى استخدام شارع الملك فيصل أو شارع الكورنيش. على سكان المباني المتأثرة البقاء في منازلهم حتى إعادة فتح الطرق. موثّق ${road?.verifiedAt ?? ""} · عمليات الشرطة.`,
      meta: "Public portal banner · replaces stale roadworks page content",
    },
    {
      channel: "signage",
      en: "AL MAJAZ RD CLOSED\nFLOODING AHEAD\nUSE KING FAISAL ST",
      ar: "طريق المجاز مغلق\nتجمّع مياه أمامك\nاستخدم شارع الملك فيصل",
      meta: "VMS-07 westbound approach · 3 lines × 20 chars",
    },
  ];
}

export function composeMessage(person: Person, impact: ImpactAssessment, facts: VerifiedFact[], createdAtSec: number, seq: number): Message {
  const core = coreMessage(person, impact);
  const variants = channelVariants(person, impact, core);
  const action = ACTIONS[impact.action];
  const road = facts.find((f) => f.subject === "road:al-majaz-underpass");
  const review = impact.action === "AVOID_AREA";
  const rationale = rationaleFor(person, impact);
  return {
    id: `msg-${String(seq).padStart(3, "0")}`,
    personId: person.id,
    action: impact.action,
    sop: action.sop,
    en: core.en,
    ar: core.ar,
    variants,
    approval: review ? "operator" : "auto",
    createdAt: clockAt(createdAtSec),
    ai: trace({
      task: "Personalise approved action into bilingual, channel-ready instructions",
      inputs: [
        `Approved action: ${action.title} (${action.sop})`,
        road ? `Verified fact: ${road.label} — ${road.value} (${road.verifiedAt})` : "Verified facts: none",
        impact.route?.alternative ? `Route engine: alternative via ${impact.route.viaRoads.join(" → ")}, +${impact.route.delayMinutes} min` : `Context: ${person.contextNote}`,
        `Profile: ${person.language.toUpperCase()} preferred · ${impact.channels.join(", ")} · mobility ${person.accessibility.mobility}${person.accessibility.hearing ? " · hearing" : ""}${person.accessibility.smartphone ? "" : " · no smartphone"}`,
      ],
      rationale,
      confidence: review ? 0.88 : 0.97,
      reviewRequired: review,
      reviewReason: review ? "Outdoor movement instruction — policy requires operator confirmation before send" : undefined,
    }),
  };
}

function rationaleFor(person: Person, impact: ImpactAssessment): string {
  switch (impact.action) {
    case "REROUTE":
      return "Driver context: lead with the closure and the alternative in the first sentence; state the delay explicitly to discourage risky improvised detours. Numbers kept identical across languages.";
    case "SHELTER_IN_PLACE":
      return person.accessibility.smartphone
        ? "Resident indoors: calm, reassuring tone; single instruction (remain indoors) plus the one thing to avoid (driving). No cause speculation beyond the verified flooding."
        : "No smartphone and limited mobility: shortest possible SMS, formal Arabic first, call-back number included; a voice call is scheduled in parallel.";
    case "OFFER_ASSISTANCE":
      return person.accessibility.hearing
        ? "Hearing impairment: voice channel suppressed; SMS carries a keyword reply path (HELP) so no call is required. Arabic first per profile."
        : "Wheelchair user: standard self-evacuation not assumed. Message offers assistance with a one-tap request path and avoids implying urgency to move. Arabic imperative agrees with the recipient's registered form of address.";
    case "AVOID_AREA":
      return "Outdoors beside the underpass: imperative, direction-first wording with a concrete, measured destination. Flagged for operator confirmation because the instruction asks the recipient to move.";
    case "NO_ACTION":
      return "No message generated.";
  }
}

export const channelName = (c: Channel) => ({ sms: "SMS", app: "App notification", voice: "Voice call", web: "Public website", signage: "Digital signage", operator: "Call-centre script" })[c];
