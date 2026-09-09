/**
 * Synthetic district used by the AMAN 360 demo.
 *
 * Coordinates are shared with the Blender scene (blender/build_district.py):
 *   X = east, Y = north, metres (schematic). The 3D twin converts to three.js Y-up.
 *
 * Every location here is synthetic. No real address, person or asset is represented.
 */

import type { AssemblyPoint, Building, HazardEvent, Point, Road, RoadEdge, RoadNode } from "@/lib/types";

export const MAP_EXTENT = 150;
/** metres of "real" distance per schematic unit — used only to derive human-scale ETAs. */
export const REAL_SCALE = 8;
/** Average speed reported by the live traffic feed during the event (rain, congestion). */
export const URBAN_SPEED_KMH = 10;

export const ROADS: Road[] = [
  { id: "al-majaz", name: "Al Majaz Road", nameAr: "طريق المجاز", axis: "ew", offset: 0, width: 16 },
  { id: "king-faisal", name: "King Faisal Street", nameAr: "شارع الملك فيصل", axis: "ew", offset: 64, width: 14 },
  { id: "corniche", name: "Corniche Street", nameAr: "شارع الكورنيش", axis: "ew", offset: -64, width: 14 },
  { id: "al-wahda", name: "Al Wahda Street", nameAr: "شارع الوحدة", axis: "ns", offset: -72, width: 12 },
  { id: "al-arouba", name: "Al Arouba Street", nameAr: "شارع العروبة", axis: "ns", offset: 72, width: 12 },
];

export const NODES: RoadNode[] = [
  { id: "AW", p: { x: -150, y: 0 } },
  { id: "A1", p: { x: -72, y: 0 } },
  { id: "AU1", p: { x: -46, y: 0 } },
  { id: "AU2", p: { x: 56, y: 0 } },
  { id: "A2", p: { x: 72, y: 0 } },
  { id: "AE", p: { x: 150, y: 0 } },
  { id: "KW", p: { x: -150, y: 64 } },
  { id: "K1", p: { x: -72, y: 64 } },
  { id: "K2", p: { x: 72, y: 64 } },
  { id: "KE", p: { x: 150, y: 64 } },
  { id: "CW", p: { x: -150, y: -64 } },
  { id: "C1", p: { x: -72, y: -64 } },
  { id: "C2", p: { x: 72, y: -64 } },
  { id: "CE", p: { x: 150, y: -64 } },
  { id: "WN", p: { x: -72, y: 150 } },
  { id: "WS", p: { x: -72, y: -150 } },
  { id: "RN", p: { x: 72, y: 150 } },
  { id: "RS", p: { x: 72, y: -150 } },
];

export const EDGES: RoadEdge[] = [
  { id: "am-w", from: "AW", to: "A1", road: "al-majaz" },
  { id: "am-approach-w", from: "A1", to: "AU1", road: "al-majaz" },
  { id: "al-majaz-underpass", from: "AU1", to: "AU2", road: "al-majaz", closable: true },
  { id: "am-approach-e", from: "AU2", to: "A2", road: "al-majaz" },
  { id: "am-e", from: "A2", to: "AE", road: "al-majaz" },
  { id: "kf-w", from: "KW", to: "K1", road: "king-faisal" },
  { id: "kf-mid", from: "K1", to: "K2", road: "king-faisal" },
  { id: "kf-e", from: "K2", to: "KE", road: "king-faisal" },
  { id: "co-w", from: "CW", to: "C1", road: "corniche" },
  { id: "co-mid", from: "C1", to: "C2", road: "corniche" },
  { id: "co-e", from: "C2", to: "CE", road: "corniche" },
  { id: "wa-n", from: "WN", to: "K1", road: "al-wahda" },
  { id: "wa-mid-n", from: "K1", to: "A1", road: "al-wahda" },
  { id: "wa-mid-s", from: "A1", to: "C1", road: "al-wahda" },
  { id: "wa-s", from: "C1", to: "WS", road: "al-wahda" },
  { id: "ar-n", from: "RN", to: "K2", road: "al-arouba" },
  { id: "ar-mid-n", from: "K2", to: "A2", road: "al-arouba" },
  { id: "ar-mid-s", from: "A2", to: "C2", road: "al-arouba" },
  { id: "ar-s", from: "C2", to: "RS", road: "al-arouba" },
];

export const BUILDINGS: Building[] = [
  { id: "Bldg_Fatima", name: "Al Majaz Residence — Tower A", nameAr: "مساكن المجاز — البرج أ", p: { x: 16, y: 32 }, w: 22, d: 18, floors: 9, kind: "residential", occupants: 190, registry: "building_management" },
  { id: "Bldg_Yusuf", name: "Al Majaz Residence — Tower B", nameAr: "مساكن المجاز — البرج ب", p: { x: -18, y: 32 }, w: 20, d: 18, floors: 7, kind: "residential", occupants: 160, registry: "building_management" },
  { id: "Bldg_Sara", name: "Al Majaz Residence — Building C", nameAr: "مساكن المجاز — المبنى ج", p: { x: -18, y: -32 }, w: 22, d: 18, floors: 6, kind: "residential", occupants: 150, registry: "building_management" },
  { id: "Bldg_S2", name: "Corniche View Apartments", nameAr: "شقق إطلالة الكورنيش", p: { x: 18, y: -34 }, w: 18, d: 18, floors: 8, kind: "residential", occupants: 170, registry: "building_management" },
  { id: "Bldg_N3", name: "Al Khan Apartments", nameAr: "شقق الخان", p: { x: -50, y: 34 }, w: 14, d: 14, floors: 5, kind: "residential", occupants: 70, registry: "building_management" },
  { id: "Bldg_N4", name: "Buhaira Court", nameAr: "بحيرة كورت", p: { x: 50, y: 34 }, w: 16, d: 16, floors: 6, kind: "residential", occupants: 90, registry: "building_management" },
  { id: "Bldg_S3", name: "Al Majaz Community Hall", nameAr: "قاعة مجتمع المجاز", p: { x: -50, y: -36 }, w: 14, d: 14, floors: 4, kind: "community", occupants: 40, registry: "public" },
  { id: "Bldg_S4", name: "Al Arouba Residence", nameAr: "مساكن العروبة", p: { x: 50, y: -36 }, w: 16, d: 16, floors: 5, kind: "residential", occupants: 80, registry: "building_management" },
  { id: "Bldg_Omar", name: "Sharjah Business Tower", nameAr: "برج الشارقة للأعمال", p: { x: 112, y: 34 }, w: 26, d: 24, floors: 14, kind: "office", occupants: 620, registry: "employer" },
  { id: "Bldg_NE2", name: "Community Clinic", nameAr: "العيادة المجتمعية", p: { x: 88, y: 40 }, w: 12, d: 12, floors: 4, kind: "clinic", occupants: 35, registry: "public" },
  { id: "Hospital", name: "Al Majaz Medical Centre", nameAr: "مركز المجاز الطبي", p: { x: 110, y: -34 }, w: 40, d: 26, floors: 5, kind: "hospital", occupants: 310, registry: "public" },
  { id: "Mosque", name: "Al Wahda Mosque", nameAr: "مسجد الوحدة", p: { x: -110, y: -34 }, w: 30, d: 24, floors: 2, kind: "mosque", occupants: 60, registry: "public" },
  { id: "Bldg_NW1", name: "Al Wahda Residence", nameAr: "مساكن الوحدة", p: { x: -112, y: 34 }, w: 22, d: 18, floors: 6, kind: "residential", occupants: 120, registry: "building_management" },
  { id: "Bldg_NW2", name: "Al Wahda Retail Centre", nameAr: "مركز الوحدة التجاري", p: { x: -112, y: 12 }, w: 16, d: 10, floors: 3, kind: "retail", occupants: 45, registry: "public" },
];

export const ASSEMBLY_POINTS: AssemblyPoint[] = [
  { id: "ap-mosque", name: "Al Wahda Assembly Point (Mosque courtyard)", nameAr: "نقطة تجمّع الوحدة (ساحة المسجد)", p: { x: -92, y: -22 }, accessible: true },
  { id: "ap-hall", name: "Al Majaz Community Hall", nameAr: "قاعة مجتمع المجاز", p: { x: -50, y: -46 }, accessible: true },
  { id: "ap-clinic", name: "Community Clinic forecourt", nameAr: "ساحة العيادة المجتمعية", p: { x: 88, y: 50 }, accessible: true },
];

/** Flood hazard polygon FZ-0912 — produced by the municipality GIS flood model (synthetic). */
export const FLOOD_POLYGON: Point[] = [
  { x: -46, y: -40 },
  { x: -20, y: -46 },
  { x: 30, y: -44 },
  { x: 56, y: -30 },
  { x: 60, y: 10 },
  { x: 40, y: 44 },
  { x: 0, y: 48 },
  { x: -40, y: 42 },
  { x: -58, y: 12 },
];

export const HAZARD: HazardEvent = {
  id: "FF-2026-0912",
  type: "flash_flood",
  name: "Al Majaz underpass flash flood",
  nameAr: "سيول نفق المجاز",
  polygon: FLOOD_POLYGON,
  severity: "severe",
  issuedAt: "T+03:10",
  sourceId: "src-gis",
};

/** The underpass segment (sunken section) of Al Majaz Road. */
export const UNDERPASS = { x0: -48, x1: 58, y: 0, depth: 2.2 };

/** Lane offsets (right-hand traffic) used to draw vehicles on the correct side. */
export const LANE = 3.6;

/** Points of interest used by the twin and the map. */
export const POI = {
  busStop: { x: -40, y: -13.5 },
  vms: { x: -104, y: -11 },
  hospitalBay: { x: 84, y: -30 },
  closureWest: { x: -54, y: 0 },
  closureEast: { x: 64, y: 0 },
};

export const nodeById = (id: string): RoadNode => {
  const n = NODES.find((x) => x.id === id);
  if (!n) throw new Error(`Unknown node ${id}`);
  return n;
};

export const edgeById = (id: string): RoadEdge => {
  const e = EDGES.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown edge ${id}`);
  return e;
};

export const roadById = (id: string): Road => {
  const r = ROADS.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown road ${id}`);
  return r;
};

export const buildingById = (id?: string): Building | undefined => BUILDINGS.find((b) => b.id === id);
