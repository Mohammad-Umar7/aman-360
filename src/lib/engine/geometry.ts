/**
 * Deterministic safety layer — geometry primitives.
 * Pure functions, no randomness, no model calls.
 */

import type { Point, Polygon } from "@/lib/types";

export const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

export const polylineLength = (pts: Point[]): number => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
};

/** Ray-casting point-in-polygon (even-odd rule). Boundary points count as inside. */
export function pointInPolygon(p: Point, poly: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (onSegment(p, a, b)) return true;
    const intersects = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

function onSegment(p: Point, a: Point, b: Point): boolean {
  if (Math.abs(cross(a, b, p)) > 1e-9) return false;
  return (
    Math.min(a.x, b.x) - 1e-9 <= p.x && p.x <= Math.max(a.x, b.x) + 1e-9 && Math.min(a.y, b.y) - 1e-9 <= p.y && p.y <= Math.max(a.y, b.y) + 1e-9
  );
}

/** Proper or touching intersection of two segments. */
export function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  if (Math.abs(d1) < 1e-9 && onSegment(p1, p3, p4)) return true;
  if (Math.abs(d2) < 1e-9 && onSegment(p2, p3, p4)) return true;
  if (Math.abs(d3) < 1e-9 && onSegment(p3, p1, p2)) return true;
  if (Math.abs(d4) < 1e-9 && onSegment(p4, p1, p2)) return true;
  return false;
}

/** Whether a polyline shares any part with a segment (collinear overlap or crossing). */
export function polylineTouchesSegment(pts: Point[], a: Point, b: Point): boolean {
  for (let i = 1; i < pts.length; i++) {
    if (segmentsIntersect(pts[i - 1], pts[i], a, b)) return true;
  }
  return false;
}

export function polylineEntersPolygon(pts: Point[], poly: Polygon): boolean {
  for (const p of pts) if (pointInPolygon(p, poly)) return true;
  for (let i = 1; i < pts.length; i++) {
    for (let j = 0, k = poly.length - 1; j < poly.length; k = j++) {
      if (segmentsIntersect(pts[i - 1], pts[i], poly[j], poly[k])) return true;
    }
  }
  return false;
}

/** Point at normalised parameter t (0..1) along a polyline, with heading (radians). */
export function pointAlong(pts: Point[], t: number): { p: Point; heading: number } {
  const total = polylineLength(pts);
  if (pts.length === 1 || total === 0) return { p: pts[0], heading: 0 };
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i]);
    if (target <= seg || i === pts.length - 1) {
      const u = seg === 0 ? 0 : target / seg;
      const p = { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u };
      const heading = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
      return { p, heading };
    }
    target -= seg;
  }
  return { p: pts[pts.length - 1], heading: 0 };
}

export const polygonCentroid = (poly: Polygon): Point => {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  return { x: x / poly.length, y: y / poly.length };
};

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
