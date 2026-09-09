"use client";

import { useMemo } from "react";
import { ASSEMBLY_POINTS, BUILDINGS, FLOOD_POLYGON, LANE, MAP_EXTENT, POI, ROADS, UNDERPASS, nodeById } from "@/lib/data/district";
import { pointAlong, pointInPolygon } from "@/lib/engine/geometry";
import { useSim } from "@/lib/simulation/store";
import { AMBULANCE_PATH, ahmedVehicle, ambulanceVehicle, closureVisible, hazardVisible, TRAFFIC_KF } from "@/lib/simulation/visual";
import type { PersonState, ScenarioState } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  normal: "#6f7e94",
  affected: "#f2b544",
  message_ready: "#9b8cff",
  sent: "#5aa9ff",
  delivered: "#5aa9ff",
  read: "#4f8df7",
  safe: "#34c77b",
  help: "#f0554f",
  clarification: "#f2b544",
  different: "#9b8cff",
  no_response: "#f0554f",
  assistance_assigned: "#4f8df7",
  resolved: "#34c77b",
  no_alert: "#4b5870",
};

interface Props {
  state: ScenarioState;
  className?: string;
  focusPersonId?: string | null;
  onSelectPerson?: (id: string) => void;
  compact?: boolean;
  zoom?: { cx: number; cy: number; size: number };
}

export function DistrictMap({ state, className, focusPersonId, onSelectPerson, compact, zoom }: Props) {
  const step = state.step.index;
  const t = useSim((s) => s.t);
  const hazardOn = hazardVisible(step, t);
  const closureOn = closureVisible(step, t);
  const E = MAP_EXTENT;
  const vb = zoom ? `${zoom.cx - zoom.size / 2} ${-zoom.cy - zoom.size / 2} ${zoom.size} ${zoom.size}` : `${-E} ${-E} ${2 * E} ${2 * E}`;

  const ahmed = ahmedVehicle(step, t);
  const ahmedPos = pointAlong(ahmed.path, ahmed.progress);
  const amb = ambulanceVehicle(step, t);
  const ambPos = pointAlong(amb.path, amb.progress);
  const hassanPos = pointAlong(TRAFFIC_KF.slice().reverse(), ((step * 0.11 + t * 0.1) % 1) * 0.9 + 0.05);

  const positions = useMemo(() => {
    const m = new Map<string, { x: number; y: number; heading?: number }>();
    for (const p of state.people) m.set(p.person.id, p.person.location);
    return m;
  }, [state.people]);
  positions.set("ahmed", { ...ahmedPos.p, heading: ahmedPos.heading });
  positions.set("hassan", { ...hassanPos.p, heading: hassanPos.heading });

  const ahmedState = state.people.find((p) => p.person.id === "ahmed");
  const showReroute = step >= 3 && !!ahmedState?.impact?.route?.alternative;
  const routeOriginal = ahmedState?.impact?.route?.original;
  const routeAlt = ahmedState?.impact?.route?.alternative;

  const polyPath = FLOOD_POLYGON.map((p, i) => `${i ? "L" : "M"}${p.x},${-p.y}`).join(" ") + " Z";
  const pathOf = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x},${-p.y}`).join(" ");

  return (
    <div className={cn("relative overflow-hidden rounded-[12px] bg-[#0a1120] border border-line", className)}>
      <svg viewBox={vb} className="w-full h-full block" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="mgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0 H0 V20" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="0.4" />
          </pattern>
          <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="4" fill="rgba(240,85,79,0.55)" />
          </pattern>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x={-E} y={-E} width={2 * E} height={2 * E} fill="#0a1120" />
        <rect x={-E} y={-E} width={2 * E} height={2 * E} fill="url(#mgrid)" />

        {/* blocks */}
        {BUILDINGS.map((b) => {
          const inZone = hazardOn && pointInPolygon(b.p, FLOOD_POLYGON);
          const isFocus = focusPersonId && state.people.find((p) => p.person.id === focusPersonId)?.person.buildingId === b.id;
          return (
            <g key={b.id}>
              <rect
                x={b.p.x - b.w / 2}
                y={-b.p.y - b.d / 2}
                width={b.w}
                height={b.d}
                rx={1.2}
                fill={b.kind === "hospital" ? "rgba(240,85,79,0.18)" : b.kind === "mosque" ? "rgba(43,184,166,0.16)" : inZone ? "rgba(242,181,68,0.16)" : "rgba(148,163,184,0.10)"}
                stroke={isFocus ? "#8ab8ff" : inZone ? "rgba(242,181,68,0.55)" : "rgba(148,163,184,0.25)"}
                strokeWidth={isFocus ? 1.2 : 0.6}
              />
              {!compact && (b.kind === "hospital" || b.kind === "mosque" || inZone) && (
                <text x={b.p.x} y={-b.p.y + 1.6} textAnchor="middle" fontSize={4} fill="rgba(232,238,247,0.75)" fontWeight={500}>
                  {b.kind === "hospital" ? "Medical Centre" : b.kind === "mosque" ? "Mosque" : b.name.replace("Al Majaz Residence — ", "").replace(" Apartments", "")}
                </text>
              )}
            </g>
          );
        })}

        {/* roads */}
        {ROADS.map((r) =>
          r.axis === "ew" ? (
            <g key={r.id}>
              <rect x={-E} y={-r.offset - r.width / 2} width={2 * E} height={r.width} fill="#1a2436" />
              <line x1={-E} x2={E} y1={-r.offset} y2={-r.offset} stroke="rgba(232,238,247,0.22)" strokeWidth={0.5} strokeDasharray="4 3" />
              {!compact && (
                <text x={-E + 6} y={-r.offset - r.width / 2 - 2} fontSize={4.2} fill="rgba(169,181,199,0.8)">
                  {r.name}
                </text>
              )}
            </g>
          ) : (
            <g key={r.id}>
              <rect x={r.offset - r.width / 2} y={-E} width={r.width} height={2 * E} fill="#1a2436" />
              <line x1={r.offset} x2={r.offset} y1={-E} y2={E} stroke="rgba(232,238,247,0.22)" strokeWidth={0.5} strokeDasharray="4 3" />
              {!compact && (
                <text x={r.offset + r.width / 2 + 2} y={E - 100} fontSize={4.2} fill="rgba(169,181,199,0.8)" transform={`rotate(-90 ${r.offset + r.width / 2 + 2} ${E - 100})`}>
                  {r.name}
                </text>
              )}
            </g>
          ),
        )}
        {/* underpass */}
        <rect x={UNDERPASS.x0} y={-UNDERPASS.y - 7} width={UNDERPASS.x1 - UNDERPASS.x0} height={14} fill="rgba(0,0,0,0.25)" stroke="rgba(148,163,184,0.25)" strokeWidth={0.4} />

        {/* hazard polygon */}
        {hazardOn && (
          <g>
            <path d={polyPath} fill="rgba(240,85,79,0.10)" stroke="#f0554f" strokeWidth={0.9} strokeDasharray="3 2" className="animate-dash" />
            {!compact && (
              <text x={FLOOD_POLYGON[4].x - 2} y={-FLOOD_POLYGON[4].y + 6} fontSize={4.2} fill="#ff9b96" textAnchor="end" fontWeight={600}>
                FZ-0912 · severe
              </text>
            )}
          </g>
        )}

        {/* closure */}
        {closureOn && (
          <g>
            <rect x={UNDERPASS.x0 - 6} y={-8} width={UNDERPASS.x1 - UNDERPASS.x0 + 12} height={16} fill="url(#hatch)" />
            {[POI.closureWest, POI.closureEast].map((p, i) => (
              <g key={i}>
                <rect x={p.x - 1.2} y={-p.y - 8.5} width={2.4} height={17} fill="#f0554f" />
                <rect x={p.x - 1.2} y={-p.y - 8.5} width={2.4} height={17} fill="url(#hatch)" opacity={0.7} />
              </g>
            ))}
            {!compact && (
              <text x={(UNDERPASS.x0 + UNDERPASS.x1) / 2} y={-14} fontSize={4.6} textAnchor="middle" fill="#ff9b96" fontWeight={700} letterSpacing={0.6}>
                UNDERPASS CLOSED
              </text>
            )}
          </g>
        )}

        {/* routes */}
        {routeOriginal && step >= 3 && (
          <path d={pathOf(routeOriginal)} fill="none" stroke={showReroute && step >= 4 ? "rgba(240,85,79,0.5)" : "#f2b544"} strokeWidth={1.4} strokeDasharray={showReroute && step >= 4 ? "2 2" : undefined} />
        )}
        {routeAlt && step >= 4 && (
          <path d={pathOf(routeAlt)} fill="none" stroke="#4f8df7" strokeWidth={1.8} strokeLinejoin="round" strokeDasharray="6 3" className="animate-dash" filter="url(#glow)" />
        )}
        {step >= 7 && <path d={pathOf(AMBULANCE_PATH)} fill="none" stroke="#f0554f" strokeWidth={1.2} strokeDasharray="3 2" opacity={0.8} />}

        {/* assembly points */}
        {step >= 3 &&
          ASSEMBLY_POINTS.map((ap) => (
            <g key={ap.id} transform={`translate(${ap.p.x} ${-ap.p.y})`}>
              <path d="M0 -3.4 L3.4 0 L0 3.4 L-3.4 0 Z" fill="#2bb8a6" opacity={0.9} />
              {!compact && (
                <text x={4.5} y={1.5} fontSize={3.6} fill="#7fe0d2">
                  {ap.name.split(" (")[0]}
                </text>
              )}
            </g>
          ))}

        {/* VMS */}
        {step >= 5 && (
          <g transform={`translate(${POI.vms.x} ${-POI.vms.y})`}>
            <rect x={-1.5} y={-4} width={3} height={5} fill="#0b1220" stroke="#8ab8ff" strokeWidth={0.5} />
            {!compact && (
              <text x={4} y={-1} fontSize={3.4} fill="#8ab8ff">
                VMS-07
              </text>
            )}
          </g>
        )}

        {/* ambulance */}
        {step >= 7 && (
          <g transform={`translate(${ambPos.p.x} ${-ambPos.p.y}) rotate(${(-ambPos.heading * 180) / Math.PI})`}>
            <rect x={-3} y={-1.4} width={6} height={2.8} rx={0.5} fill="#f4f4f1" stroke="#f0554f" strokeWidth={0.5} />
            <circle r={4.5} fill="none" stroke="#f0554f" strokeWidth={0.5} opacity={0.6} className="animate-pulse" />
          </g>
        )}

        {/* people */}
        {state.people.map((ps) => (
          <PersonMarker key={ps.person.id} ps={ps} pos={positions.get(ps.person.id)!} focus={focusPersonId === ps.person.id} dim={!!focusPersonId && focusPersonId !== ps.person.id} onClick={onSelectPerson} compact={compact} step={step} />
        ))}

        {/* hospital + bus stop markers */}
        {!compact && (
          <g transform={`translate(${POI.busStop.x} ${-POI.busStop.y})`}>
            <rect x={-2} y={-1.2} width={4} height={2.4} fill="#1c4e9c" />
          </g>
        )}
      </svg>
      {!compact && (
        <div className="absolute left-3 bottom-3 glass rounded-lg px-3 py-2 text-[10.5px] text-ink-2 flex flex-wrap gap-x-4 gap-y-1">
          <Legend color="#f0554f" label="Hazard polygon" dashed />
          <Legend color="#f0554f" label="Closed segment" hatch />
          <Legend color="#4f8df7" label="Verified alternative route" />
          <Legend color="#2bb8a6" label="Assembly point" diamond />
          <Legend color="#34c77b" label="Confirmed safe" dot />
          <Legend color="#f0554f" label="Needs help / silent" dot />
        </div>
      )}
    </div>
  );
}

function Legend({ color, label, dashed, hatch, dot, diamond }: { color: string; label: string; dashed?: boolean; hatch?: boolean; dot?: boolean; diamond?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {dot ? (
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      ) : diamond ? (
        <span className="h-2 w-2 rotate-45" style={{ background: color }} />
      ) : (
        <span className="h-0 w-4 border-t-2" style={{ borderColor: color, borderStyle: dashed ? "dashed" : hatch ? "dotted" : "solid" }} />
      )}
      {label}
    </span>
  );
}

function PersonMarker({ ps, pos, focus, dim, onClick, compact, step }: { ps: PersonState; pos: { x: number; y: number; heading?: number }; focus: boolean; dim: boolean; onClick?: (id: string) => void; compact?: boolean; step: number }) {
  const color = STATUS_COLOR[ps.status] ?? "#6f7e94";
  const isVehicle = ps.person.context === "driving";
  const active = ps.status === "help" || ps.status === "no_response";
  const label = ps.person.spotlight && !compact;
  return (
    <g transform={`translate(${pos.x} ${-pos.y})`} opacity={dim ? 0.35 : 1} onClick={() => onClick?.(ps.person.id)} className={onClick ? "cursor-pointer" : undefined}>
      {active && <circle r={6} fill="none" stroke={color} strokeWidth={0.6} className="animate-ping" style={{ transformOrigin: "center" }} />}
      {focus && <circle r={7.5} fill="none" stroke="#8ab8ff" strokeWidth={0.7} strokeDasharray="2 1.5" />}
      {isVehicle ? (
        <g transform={`rotate(${(-(pos.heading ?? 0) * 180) / Math.PI})`}>
          <rect x={-3} y={-1.5} width={6} height={3} rx={0.7} fill={ps.person.id === "ahmed" ? "#2d7d8e" : "#213a5c"} stroke={color} strokeWidth={0.7} />
        </g>
      ) : (
        <>
          <circle r={2.6} fill="#0b1220" stroke={color} strokeWidth={1.1} />
          <circle r={1.1} fill={color} />
        </>
      )}
      {label && (
        <text x={4.5} y={-3.2} fontSize={4.2} fill={step >= 3 ? "#e8eef7" : "rgba(232,238,247,0.7)"} fontWeight={600} paintOrder="stroke" stroke="#0a1120" strokeWidth={1.2}>
          {ps.person.name.split(" ")[0]}
        </text>
      )}
    </g>
  );
}
