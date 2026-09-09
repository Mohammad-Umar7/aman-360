/**
 * Deterministic safety layer — road-network routing.
 * Dijkstra over the district graph with closed edges and hazard-intersecting edges removed.
 */

import { EDGES, NODES, REAL_SCALE, URBAN_SPEED_KMH, nodeById, roadById } from "@/lib/data/district";
import { dist, polylineEntersPolygon, polylineLength } from "@/lib/engine/geometry";
import type { Point, Polygon, RoadEdge, RouteResult } from "@/lib/types";

const edgePoints = (e: RoadEdge): Point[] => [nodeById(e.from).p, nodeById(e.to).p];

export function edgeIsUsable(e: RoadEdge, closed: Set<string>, hazard?: Polygon): boolean {
  if (closed.has(e.id)) return false;
  if (hazard && polylineEntersPolygon(edgePoints(e), hazard)) return false;
  return true;
}

/** Shortest path between two nodes (node ids), or null if unreachable. */
export function shortestPath(from: string, to: string, closed: Set<string>, hazard?: Polygon): { nodes: string[]; edges: RoadEdge[] } | null {
  const distTo = new Map<string, number>();
  const prev = new Map<string, { node: string; edge: RoadEdge }>();
  const visited = new Set<string>();
  for (const n of NODES) distTo.set(n.id, Infinity);
  distTo.set(from, 0);

  while (true) {
    let current: string | null = null;
    let best = Infinity;
    for (const [id, d] of distTo) {
      if (!visited.has(id) && d < best) {
        best = d;
        current = id;
      }
    }
    if (current === null || best === Infinity) break;
    if (current === to) break;
    visited.add(current);
    for (const e of EDGES) {
      if (!edgeIsUsable(e, closed, hazard)) continue;
      const other = e.from === current ? e.to : e.to === current ? e.from : null;
      if (!other || visited.has(other)) continue;
      const nd = best + dist(nodeById(e.from).p, nodeById(e.to).p);
      if (nd < (distTo.get(other) ?? Infinity)) {
        distTo.set(other, nd);
        prev.set(other, { node: current, edge: e });
      }
    }
  }
  if ((distTo.get(to) ?? Infinity) === Infinity) return null;
  const nodes: string[] = [to];
  const edges: RoadEdge[] = [];
  let cur = to;
  while (cur !== from) {
    const p = prev.get(cur);
    if (!p) return null;
    edges.unshift(p.edge);
    nodes.unshift(p.node);
    cur = p.node;
  }
  return { nodes, edges };
}

export const routeToPoints = (nodeIds: string[]): Point[] => nodeIds.map((id) => nodeById(id).p);

export const routeEdges = (nodeIds: string[]): RoadEdge[] => {
  const out: RoadEdge[] = [];
  for (let i = 1; i < nodeIds.length; i++) {
    const a = nodeIds[i - 1];
    const b = nodeIds[i];
    const e = EDGES.find((x) => (x.from === a && x.to === b) || (x.from === b && x.to === a));
    if (e) out.push(e);
  }
  return out;
};

export const unitsToKm = (units: number) => (units * REAL_SCALE) / 1000;

export const minutesFor = (units: number) => (units * REAL_SCALE) / ((URBAN_SPEED_KMH * 1000) / 60);

/**
 * Evaluate a road user's planned route against closures and the hazard polygon.
 * `position` is where the vehicle currently is (on the first edge of the route).
 */
export function evaluateRoute(position: Point, plannedNodes: string[], closed: Set<string>, hazard?: Polygon): RouteResult {
  const planned = routeEdges(plannedNodes);
  const blocked = planned.find((e) => closed.has(e.id));
  const original = [position, ...routeToPoints(plannedNodes.slice(1))];
  const originalKm = unitsToKm(polylineLength(original));
  if (!blocked) {
    return { original, viaRoads: uniqueRoads(planned), delayMinutes: 0, originalKm };
  }
  // Re-plan from the next node ahead of the vehicle to the destination.
  const nextNode = plannedNodes[1];
  const destination = plannedNodes[plannedNodes.length - 1];
  const alt = shortestPath(nextNode, destination, closed, hazard);
  if (!alt) {
    return { original, blockedEdgeId: blocked.id, viaRoads: uniqueRoads(planned), delayMinutes: 0, originalKm };
  }
  const alternative = [position, ...routeToPoints(alt.nodes)];
  const altUnits = polylineLength(alternative);
  const origUnits = polylineLength(original);
  return {
    original,
    alternative,
    blockedEdgeId: blocked.id,
    viaRoads: uniqueRoads(alt.edges),
    delayMinutes: Math.round(minutesFor(Math.max(0, altUnits - origUnits))),
    originalKm,
    alternativeKm: unitsToKm(altUnits),
  };
}

function uniqueRoads(edges: RoadEdge[]): string[] {
  const seen: string[] = [];
  for (const e of edges) {
    const name = roadById(e.road).name;
    if (!seen.includes(name)) seen.push(name);
  }
  return seen;
}
