/**
 * Official source feeds and the claims they produce during the flash-flood scenario.
 * Timestamps are seconds after incident T0 (14:02:00). Synthetic data.
 */

import type { SourceClaim, SourceFeed } from "@/lib/types";

export const SOURCES: SourceFeed[] = [
  {
    id: "src-police",
    name: "Police Operations — Road Closure Feed",
    nameAr: "عمليات الشرطة — بث إغلاق الطرق",
    org: "Abu Dhabi Police Operations Room",
    kind: "police",
    authorityRank: 1,
    domains: ["road_status", "incident_command"],
    protocol: "CAP 1.2 over secure API",
    latencySec: 4,
  },
  {
    id: "src-gis",
    name: "Municipality GIS — Flood Hazard Layer",
    nameAr: "نظام المعلومات الجغرافية البلدي — طبقة مخاطر الفيضان",
    org: "Abu Dhabi Municipality — GIS Centre",
    kind: "municipality_gis",
    authorityRank: 1,
    domains: ["hazard_area"],
    protocol: "OGC WFS / GeoJSON",
    latencySec: 9,
  },
  {
    id: "src-ncm",
    name: "National Center of Meteorology — Alerts",
    nameAr: "المركز الوطني للأرصاد — التنبيهات",
    org: "NCM",
    kind: "meteorology",
    authorityRank: 1,
    domains: ["weather"],
    protocol: "CAP 1.2 feed",
    latencySec: 12,
  },
  {
    id: "src-rta",
    name: "Roads & Transport — Traffic Status",
    nameAr: "الطرق والمواصلات — حالة المرور",
    org: "Integrated Transport Centre",
    kind: "transport",
    authorityRank: 2,
    domains: ["road_status", "traffic"],
    protocol: "DATEX II",
    latencySec: 30,
  },
  {
    id: "src-web",
    name: "Public Website — Roadworks & Closures Page",
    nameAr: "الموقع العام — صفحة أعمال الطرق والإغلاقات",
    org: "Municipality web portal",
    kind: "public_web",
    authorityRank: 4,
    domains: ["road_status"],
    protocol: "HTML crawl (read-only)",
    latencySec: 120,
  },
  {
    id: "src-cd",
    name: "Civil Defence — Response SOP Registry",
    nameAr: "الدفاع المدني — سجل إجراءات الاستجابة",
    org: "Abu Dhabi Civil Defence",
    kind: "civil_defence",
    authorityRank: 1,
    domains: ["approved_actions"],
    protocol: "Signed SOP catalogue",
    latencySec: 0,
  },
];

export const SUBJECTS: Record<string, { label: string; labelAr: string; domain: string }> = {
  "road:al-majaz-underpass": { label: "Al Majaz Road — underpass section", labelAr: "طريق المجاز — قسم النفق", domain: "road_status" },
  "hazard:FZ-0912": { label: "Flood hazard polygon FZ-0912", labelAr: "مضلع مخاطر الفيضان FZ-0912", domain: "hazard_area" },
  "weather:sharjah-central": { label: "Weather alert — Abu Dhabi central", labelAr: "تنبيه الطقس — وسط أبوظبي", domain: "weather" },
  "sop:flash-flood": { label: "Approved flash-flood actions", labelAr: "إجراءات السيول المعتمدة", domain: "approved_actions" },
};

/** Claims with the offset (seconds after T0) at which AMAN received them. */
export const CLAIMS: (SourceClaim & { receivedSec: number })[] = [
  {
    id: "clm-ncm-1",
    sourceId: "src-ncm",
    subject: "weather:sharjah-central",
    value: "alert_orange",
    text: "Orange alert: convective rain 40–60 mm/h expected over Abu Dhabi central districts until 16:00.",
    textAr: "تنبيه برتقالي: أمطار رعدية بمعدل 40–60 ملم/ساعة متوقعة على المناطق الوسطى في أبوظبي حتى الساعة 16:00.",
    observedAt: "13:50:00",
    receivedAt: "14:04:10",
    receivedSec: 130,
  },
  {
    id: "clm-rta-1",
    sourceId: "src-rta",
    subject: "road:al-majaz-underpass",
    value: "congested",
    text: "Al Majaz Road eastbound: heavy congestion, average speed 9 km/h.",
    textAr: "طريق المجاز باتجاه الشرق: ازدحام شديد، متوسط السرعة 9 كم/ساعة.",
    observedAt: "14:05:00",
    receivedAt: "14:05:30",
    receivedSec: 210,
  },
  {
    id: "clm-gis-1",
    sourceId: "src-gis",
    subject: "hazard:FZ-0912",
    value: "hazard_active",
    text: "Flood hazard polygon FZ-0912 ACTIVE — severity SEVERE. Model: 1-in-25-year surface-water event, underpass depth > 1.5 m.",
    textAr: "مضلع مخاطر الفيضان FZ-0912 نشط — الشدة: شديدة. النموذج: حدث مياه سطحية بتكرار 25 سنة، عمق النفق أكثر من 1.5 م.",
    observedAt: "14:05:10",
    receivedAt: "14:05:19",
    receivedSec: 199,
  },
  {
    id: "clm-police-1",
    sourceId: "src-police",
    subject: "road:al-majaz-underpass",
    value: "closed",
    text: "Al Majaz Road underpass CLOSED both directions — patrol 4-12 on site, barriers deployed.",
    textAr: "نفق طريق المجاز مغلق في الاتجاهين — الدورية 4-12 في الموقع، وتم نشر الحواجز.",
    observedAt: "14:05:25",
    receivedAt: "14:05:29",
    receivedSec: 209,
  },
  {
    id: "clm-web-1",
    sourceId: "src-web",
    subject: "road:al-majaz-underpass",
    value: "open",
    text: "Al Majaz Road: OPEN — no planned works. (Page last updated 26 Aug 2026)",
    textAr: "طريق المجاز: مفتوح — لا توجد أعمال مخططة. (آخر تحديث للصفحة 26 أغسطس 2026)",
    observedAt: "2026-08-26",
    receivedAt: "14:05:40",
    receivedSec: 220,
    stale: true,
  },
  {
    id: "clm-cd-1",
    sourceId: "src-cd",
    subject: "sop:flash-flood",
    value: "sop_ref",
    text: "SOP-FF-03 (Flash flood — urban underpass) v4.1 applies. Approved actions: reroute, shelter in place, accessible assistance, avoid area.",
    textAr: "ينطبق الإجراء SOP-FF-03 (سيول — نفق حضري) الإصدار 4.1. الإجراءات المعتمدة: تغيير المسار، البقاء في المكان، المساعدة الميسّرة، تجنّب المنطقة.",
    observedAt: "14:05:45",
    receivedAt: "14:05:45",
    receivedSec: 225,
  },
];

export const sourceById = (id: string): SourceFeed => {
  const s = SOURCES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown source ${id}`);
  return s;
};
