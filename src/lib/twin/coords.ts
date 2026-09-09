/**
 * Shared coordinate helpers for the 3D twin.
 * District/Blender: X east, Y north, Z up. three.js: X east, Y up, Z south (= -north).
 */

import * as THREE from "three";
import { BUILDINGS, buildingById } from "@/lib/data/district";
import type { Point } from "@/lib/types";

export const toWorld = (p: Point, h = 0): [number, number, number] => [p.x, h, -p.y];
export const toVec3 = (p: Point, h = 0) => new THREE.Vector3(p.x, h, -p.y);
export const headingToRotY = (heading: number) => heading;

export const FLOOR_H = 3.3;
export const BASE_H = 0.18 + 0.25;

export function buildingTop(id?: string): number {
  const b = buildingById(id);
  if (!b) return 8;
  if (b.kind === "office") return BASE_H + 12.6 + b.floors * 3.6 + 6; // glass tower on a podium
  if (b.kind === "hospital") return BASE_H + b.floors * 3.6 + 2;
  if (b.kind === "mosque") return 28;
  return BASE_H + 4.6 + (b.floors - 1) * FLOOR_H + 2.2;
}

export interface CamPose {
  pos: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: Record<string, CamPose> = {
  overview: { pos: [-150, 92, 200], target: [10, 6, -5] },
  impact: { pos: [-70, 128, 150], target: [4, 0, 4] },
  underpass: { pos: [-98, 20, 24], target: [12, -2, 0] },
  closure: { pos: [44, 9, 19], target: [-24, -1, -2] },
  residence: { pos: [-52, 34, 78], target: [-4, 12, -12] },
  hospital: { pos: [52, 42, 108], target: [104, 10, 30] },
};

export const ZONE_BUILDINGS = BUILDINGS.filter((b) => ["Bldg_Fatima", "Bldg_Yusuf", "Bldg_Sara", "Bldg_S2"].includes(b.id)).map((b) => b.id);
