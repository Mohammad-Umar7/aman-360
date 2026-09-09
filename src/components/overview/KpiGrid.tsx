"use client";

import { KpiTile } from "@/components/ui/Kpi";
import { fmtInt, pct } from "@/lib/format";
import type { Kpis } from "@/lib/types";

export function KpiGrid({ kpis, step }: { kpis: Kpis; step: number }) {
  const reachedPct = kpis.affected ? kpis.reached / kpis.affected : 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiTile label="Affected" value={kpis.affected} tone={kpis.affected ? "warn" : "neutral"} sub={step >= 3 ? "identified by deterministic checks" : "no impact analysis yet"} />
      <KpiTile label="Reached" value={kpis.reached} tone={kpis.reached ? "brand" : "neutral"} sub={kpis.reached ? `${pct(reachedPct)} of affected · read ${fmtInt(kpis.read)}` : "no messages sent"} />
      <KpiTile label="Confirmed safe" value={kpis.safe} tone={kpis.safe ? "safe" : "neutral"} sub={kpis.safe ? `${pct(kpis.safe / kpis.affected)} of affected` : "awaiting responses"} />
      <KpiTile label="Assistance requests" value={kpis.help} tone={kpis.help ? "alert" : "neutral"} sub={kpis.unitsDispatched ? `${kpis.unitsDispatched} units dispatched` : kpis.help ? "triage pending" : "none"} />
      <KpiTile label="Clarification" value={kpis.clarification} tone={kpis.clarification ? "warn" : "neutral"} sub={kpis.different ? `+${kpis.different} situation differs` : "none"} />
      <KpiTile label="No response" value={kpis.noResponse} tone={kpis.noResponse ? "alert" : "neutral"} sub={kpis.noResponse ? "escalation rules running" : "—"} />
    </div>
  );
}
