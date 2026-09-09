"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/format";
import { DOT, type Tone } from "@/components/ui/Badge";

/** Animates numeric changes so KPI tiles "count" when the scenario advances. */
export function useCountUp(value: number, ms = 700): number {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const b = value;
    if (a === b) return;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(a + (b - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = b;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return display;
}

interface KpiTileProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  sub?: ReactNode;
  tone?: Tone;
  hint?: string;
  compact?: boolean;
  className?: string;
}

export function KpiTile({ label, value, format = fmtInt, sub, tone = "neutral", hint, compact, className }: KpiTileProps) {
  const v = useCountUp(value);
  return (
    <div className={cn("panel-raised relative overflow-hidden", compact ? "px-3 py-2.5" : "px-4 py-3.5", className)}>
      <div className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-r", DOT[tone], tone === "neutral" && "bg-ink-4")} />
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow truncate">{label}</div>
        {hint && <span className="text-[10px] text-ink-4 truncate">{hint}</span>}
      </div>
      <div className={cn("num font-semibold tracking-tight text-ink mt-1", compact ? "text-[22px] leading-7" : "text-[28px] leading-8")}>{format(v)}</div>
      {sub && <div className="text-[11.5px] text-ink-3 mt-0.5 leading-4">{sub}</div>}
    </div>
  );
}

export function Meter({ value, tone = "brand", className, label }: { value: number; tone?: Tone; className?: string; label?: string }) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between text-[11px] text-ink-3 mb-1">
          <span>{label}</span>
          <span className="num">{Math.round(value * 100)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", DOT[tone])} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
      </div>
    </div>
  );
}

export function Ring({ value, size = 76, stroke = 6, tone = "teal", label, sub }: { value: number; size?: number; stroke?: number; tone?: Tone; label?: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = useCountUp(value, 900);
  const color = { neutral: "#6f7e94", brand: "#4f8df7", teal: "#2bb8a6", violet: "#9b8cff", safe: "#34c77b", warn: "#f2b544", alert: "#f0554f", info: "#5aa9ff" }[tone];
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(148,163,184,0.12)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, v)))}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="rotate-90 origin-center" fill="#e8eef7" fontSize={size * 0.22} fontWeight={600} style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>
          {Math.round(v * 100)}%
        </text>
      </svg>
      {(label || sub) && (
        <div className="min-w-0">
          {label && <div className="text-[13px] font-medium text-ink leading-5">{label}</div>}
          {sub && <div className="text-[11.5px] text-ink-3 leading-4">{sub}</div>}
        </div>
      )}
    </div>
  );
}

export function Sparkline({ points, tone = "brand", width = 96, height = 28 }: { points: number[]; tone?: Tone; width?: number; height?: number }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const dx = width / (points.length - 1);
  const y = (v: number) => height - 2 - ((v - min) / (max - min || 1)) * (height - 4);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i * dx).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const color = { neutral: "#6f7e94", brand: "#4f8df7", teal: "#2bb8a6", violet: "#9b8cff", safe: "#34c77b", warn: "#f2b544", alert: "#f0554f", info: "#5aa9ff" }[tone];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={`${d} L${width},${height} L0,${height} Z`} fill={color} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
