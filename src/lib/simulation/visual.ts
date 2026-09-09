/**
 * Visual progress helpers shared by the 3D twin and the 2D map.
 * All values are functions of (step, t) so the presentation is scrubbable.
 */

import { LANE, NODES, POI, nodeById } from "@/lib/data/district";
import { clamp, lerp, smoothstep } from "@/lib/engine/geometry";
import type { Point } from "@/lib/types";

/** 0 = dry underpass, 1 = fully flooded (matches the Blender "Water_Underpass" animation range). */
export function floodLevel(step: number, t: number): number {
  if (step <= 0) return 0;
  if (step === 1) return 0.62 * smoothstep(t);
  if (step === 2) return lerp(0.62, 0.8, smoothstep(t));
  if (step <= 7) return clamp(0.8 + 0.18 * ((step - 3 + t) / 5), 0.8, 0.98);
  return lerp(0.98, 0.7, smoothstep(t));
}

/** Rain intensity 0..1 */
export function rainIntensity(step: number, t: number): number {
  if (step <= 0) return 0;
  if (step === 1) return smoothstep(t * 1.6);
  if (step <= 6) return 1;
  if (step === 7) return lerp(1, 0.55, t);
  return lerp(0.55, 0.15, t);
}

/** Sky darkness 0 (clear) .. 1 (storm) */
export function overcast(step: number, t: number): number {
  if (step <= 0) return 0.05;
  if (step === 1) return lerp(0.05, 0.85, smoothstep(t * 1.3));
  if (step <= 7) return 0.85;
  return lerp(0.85, 0.5, t);
}

const P = (id: string): Point => nodeById(id).p;

/** Ahmed's car: eastbound approach, then the verified reroute via King Faisal Street (right-hand lanes). */
export const AHMED_ORIGINAL: Point[] = [
  { x: -142, y: -LANE },
  { x: P("A1").x, y: -LANE },
  { x: -66, y: -LANE },
];
export const AHMED_REROUTE: Point[] = [
  { x: -142, y: -LANE },
  { x: P("A1").x + LANE, y: -LANE },
  { x: P("A1").x + LANE, y: P("K1").y - LANE },
  { x: P("K2").x - LANE, y: P("K1").y - LANE },
  { x: P("K2").x - LANE, y: -LANE },
  { x: 146, y: -LANE },
];

/** Ambulance: hospital bay → Al Arouba St → Corniche St → Building C forecourt. */
export const AMBULANCE_PATH: Point[] = [
  { x: POI.hospitalBay.x, y: POI.hospitalBay.y },
  { x: P("A2").x - LANE, y: POI.hospitalBay.y },
  { x: P("A2").x - LANE, y: P("C2").y + LANE },
  { x: -18, y: P("C2").y + LANE },
  { x: -18, y: -50 },
];

/** Background traffic loop on King Faisal Street (westbound lane). */
export const TRAFFIC_KF: Point[] = [
  { x: 146, y: P("K1").y + LANE },
  { x: -146, y: P("K1").y + LANE },
];
export const TRAFFIC_CO: Point[] = [
  { x: -146, y: P("C1").y - LANE },
  { x: 146, y: P("C1").y - LANE },
];
export const TRAFFIC_KF_E: Point[] = [
  { x: -146, y: P("K1").y - LANE },
  { x: 146, y: P("K1").y - LANE },
];

export interface VehicleState {
  path: Point[];
  progress: number; // 0..1 along path
  visible: boolean;
  rerouted: boolean;
}

/** Where Ahmed's car is along the storyline. */
export function ahmedVehicle(step: number, t: number): VehicleState {
  if (step <= 2) {
    // creeping east in traffic: from -142 to about -104 over steps 0..2
    const p = clamp((step + t) / 3, 0, 1);
    return { path: AHMED_ORIGINAL, progress: lerp(0, 0.5, p), visible: true, rerouted: false };
  }
  if (step === 3) return { path: AHMED_ORIGINAL, progress: lerp(0.5, 0.62, t), visible: true, rerouted: false };
  if (step === 4) return { path: AHMED_REROUTE, progress: lerp(0.09, 0.14, t), visible: true, rerouted: true };
  if (step === 5) return { path: AHMED_REROUTE, progress: lerp(0.14, 0.3, smoothstep(t)), visible: true, rerouted: true };
  if (step === 6) return { path: AHMED_REROUTE, progress: lerp(0.3, 0.6, t), visible: true, rerouted: true };
  if (step === 7) return { path: AHMED_REROUTE, progress: lerp(0.6, 0.88, t), visible: true, rerouted: true };
  return { path: AHMED_REROUTE, progress: lerp(0.88, 1, t), visible: true, rerouted: true };
}

export function ambulanceVehicle(step: number, t: number): VehicleState {
  if (step < 7) return { path: AMBULANCE_PATH, progress: 0, visible: true, rerouted: false };
  if (step === 7) return { path: AMBULANCE_PATH, progress: smoothstep(t), visible: true, rerouted: false };
  return { path: AMBULANCE_PATH, progress: 1, visible: true, rerouted: false };
}

/** Civil Defence unit CD-3: Corniche Street eastbound → Corniche View forecourt (Aisha). */
export const CD_PATH: Point[] = [
  { x: -146, y: P("C1").y - LANE },
  { x: 18, y: P("C1").y - LANE },
  { x: 18, y: -50 },
];

export function cdVehicle(step: number, t: number): VehicleState {
  if (step < 7) return { path: CD_PATH, progress: 0, visible: false, rerouted: false };
  if (step === 7) return { path: CD_PATH, progress: smoothstep(clamp((t - 0.1) / 0.85, 0, 1)), visible: true, rerouted: false };
  return { path: CD_PATH, progress: 1, visible: true, rerouted: false };
}

/** Medevac helicopter: approaches from the sea and lands on the medical-centre helipad during dispatch. */
export interface HeliState {
  p: Point;
  alt: number;
  heading: number;
  rotor: number; // 0..1 spin speed
  visible: boolean;
}
export function helicopter(step: number, t: number): HeliState {
  const start = { x: 320, y: -190 };
  const pad = { x: 118, y: -34 };
  if (step < 7) return { p: start, alt: 95, heading: Math.PI, rotor: 0, visible: false };
  if (step === 7) {
    const u = smoothstep(clamp((t - 0.05) / 0.9, 0, 1));
    const p = { x: lerp(start.x, pad.x, u), y: lerp(start.y, pad.y, u) };
    const alt = lerp(95, 26.3, u * u);
    const heading = Math.atan2(pad.y - start.y, pad.x - start.x);
    return { p, alt, heading: lerp(heading, Math.PI * 0.75, smoothstep(clamp((u - 0.7) / 0.3, 0, 1))), rotor: 1, visible: true };
  }
  return { p: pad, alt: 26.3, heading: Math.PI * 0.75, rotor: lerp(1, 0.15, smoothstep(t * 2)), visible: true };
}

export const closureVisible = (step: number, t: number) => step >= 2 || (step === 1 && t > 0.75);
export const hazardVisible = (step: number, t: number) => step >= 2 || (step === 1 && t > 0.55);
export const policeVisible = (step: number, t: number) => step >= 2 || (step === 1 && t > 0.7);

export const allNodes = NODES;

