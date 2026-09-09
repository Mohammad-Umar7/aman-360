"use client";

import { Panel } from "@/components/ui/Panel";
import { fmtInt, fmtSec, pct } from "@/lib/format";
import type { Kpis } from "@/lib/types";
import { Kv } from "@/components/ui/Misc";

const SEG = [
  { key: "safe", label: "Confirmed safe", color: "#34c77b" },
  { key: "help", label: "Need help", color: "#f0554f" },
  { key: "clarification", label: "Clarification", color: "#f2b544" },
  { key: "different", label: "Situation differs", color: "#9b8cff" },
  { key: "noResponse", label: "No response", color: "#4b5870" },
] as const;

export function ResponseBreakdown({ kpis, className }: { kpis: Kpis; className?: string }) {
  const responded = kpis.safe + kpis.help + kpis.clarification + kpis.different + kpis.noResponse;
  const pending = Math.max(0, kpis.reached - responded);
  const total = kpis.reached || 1;
  return (
    <Panel title="Response picture" eyebrow="Citizen loop" className={className}>
      <div className="h-3 w-full rounded-full overflow-hidden bg-white/[0.06] flex">
        {SEG.map((s) => (
          <div key={s.key} style={{ width: `${(kpis[s.key] / total) * 100}%`, background: s.color }} className="h-full transition-[width] duration-700" title={s.label} />
        ))}
        {pending > 0 && <div style={{ width: `${(pending / total) * 100}%` }} className="h-full bg-white/[0.04]" />}
      </div>
      <div className="grid grid-cols-2 gap-x-4 mt-3">
        {SEG.map((s) => (
          <div key={s.key} className="flex items-center justify-between py-1 text-[12.5px]">
            <span className="flex items-center gap-2 text-ink-2">
              <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="num text-ink">
              {fmtInt(kpis[s.key])}
              <span className="text-ink-4 ml-1 text-[11px]">{kpis.reached ? pct(kpis[s.key] / kpis.reached) : "—"}</span>
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between py-1 text-[12.5px]">
          <span className="flex items-center gap-2 text-ink-3">
            <span className="h-2 w-2 rounded-sm bg-white/[0.12]" />
            Read, not yet replied
          </span>
          <span className="num text-ink-2">{fmtInt(pending)}</span>
        </div>
      </div>
      <div className="mt-3 border-t border-line pt-1">
        <Kv k="Average delivery" v={kpis.avgDeliverySec ? fmtSec(kpis.avgDeliverySec) : "—"} />
        <Kv k="Median triage time" v={kpis.triageMinutes ? `${kpis.triageMinutes.toFixed(1)} min` : "—"} />
        <Kv k="Operator review required" v={kpis.operatorReview} />
      </div>
    </Panel>
  );
}
