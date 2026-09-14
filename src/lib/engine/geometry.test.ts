import { describe, expect, it } from "vitest";
import { clamp, lerp, pointAlong, pointInPolygon, polylineEntersPolygon, polylineLength, polylineTouchesSegment, segmentsIntersect, smoothstep } from "@/lib/engine/geometry";

const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

describe("pointInPolygon", () => {
  it("detects interior and exterior points", () => {
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    expect(pointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
    expect(pointInPolygon({ x: -1, y: -1 }, square)).toBe(false);
  });
  it("counts boundary points and vertices as inside", () => {
    expect(pointInPolygon({ x: 0, y: 5 }, square)).toBe(true);
    expect(pointInPolygon({ x: 10, y: 10 }, square)).toBe(true);
  });
  it("handles a horizontal ray through a vertex", () => {
    const diamond = [
      { x: 5, y: 0 },
      { x: 10, y: 5 },
      { x: 5, y: 10 },
      { x: 0, y: 5 },
    ];
    expect(pointInPolygon({ x: 5, y: 5 }, diamond)).toBe(true);
    expect(pointInPolygon({ x: 12, y: 5 }, diamond)).toBe(false);
    expect(pointInPolygon({ x: -2, y: 5 }, diamond)).toBe(false);
  });
  it("is false for an empty polygon", () => {
    expect(pointInPolygon({ x: 0, y: 0 }, [])).toBe(false);
  });
});

describe("segmentsIntersect", () => {
  it("detects proper crossings", () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(true);
  });
  it("detects touching endpoints and collinear overlap", () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 5, y: 5 }, { x: 9, y: 1 })).toBe(true);
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, { x: 20, y: 0 })).toBe(true);
  });
  it("rejects parallel and disjoint segments", () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 1 }, { x: 10, y: 1 })).toBe(false);
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 })).toBe(false);
  });
});

describe("polyline helpers", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];
  it("measures length", () => {
    expect(polylineLength(path)).toBe(20);
    expect(polylineLength([])).toBe(0);
  });
  it("detects contact with a segment and entry into a polygon", () => {
    expect(polylineTouchesSegment(path, { x: 5, y: -5 }, { x: 5, y: 5 })).toBe(true);
    expect(polylineTouchesSegment(path, { x: 20, y: -5 }, { x: 20, y: 5 })).toBe(false);
    expect(polylineEntersPolygon(path, square)).toBe(true);
    expect(polylineEntersPolygon([{ x: 20, y: 20 }, { x: 30, y: 30 }], square)).toBe(false);
  });
  it("walks a point along the path with a heading", () => {
    expect(pointAlong(path, 0).p).toEqual({ x: 0, y: 0 });
    expect(pointAlong(path, 0.25).p).toEqual({ x: 5, y: 0 });
    expect(pointAlong(path, 0.75).p).toEqual({ x: 10, y: 5 });
    expect(pointAlong(path, 0.75).heading).toBeCloseTo(Math.PI / 2);
    expect(pointAlong(path, 1).p).toEqual({ x: 10, y: 10 });
  });
  it("clamps the parameter and tolerates degenerate paths", () => {
    expect(pointAlong(path, -1).p).toEqual({ x: 0, y: 0 });
    expect(pointAlong(path, 2).p).toEqual({ x: 10, y: 10 });
    expect(pointAlong([{ x: 3, y: 4 }], 0.5).p).toEqual({ x: 3, y: 4 });
    expect(pointAlong([], 0.5).p).toEqual({ x: 0, y: 0 });
    expect(Number.isFinite(pointAlong([{ x: 1, y: 1 }, { x: 1, y: 1 }], 0.5).heading)).toBe(true);
  });
});

describe("scalar helpers", () => {
  it("clamps, lerps and smoothsteps", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(0.5)).toBe(0.5);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(7)).toBe(1);
  });
});
