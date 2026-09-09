"use client";

import { KpiTile } from "@/components/ui/Kpi";
import { fmtInt, pct } from "@/lib/format";
import { KPI_BY_STEP } from "@/lib/simulation/script";
import type { Kpis } from "@/lib/types";

function Delta({ now, before, invert }: { now: number; before: number; invert?: boolean }) {
  const d = now - before;
  if (!d) return null;
  const good = invert ? d < 0 : d > 0;
  return (
    <span className={`num ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${good ? "bg-safe/15 text-[#7fe0a8]" : "bg-alert/15 text-[#ff9b96]"}`}>
      {d > 0 ? "+" : ""}
      {fmtInt(d)}
    </span>
  );
}

export function KpiGrid({ kpis, step }: { kpis: Kpis; step: number }) {
  const prev = KPI_BY_STEP[Math.max(0, step - 1)];
  const reachedPct = kpis.affected ? kpis.reached / kpis.affected : 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <KpiTile label="Affected" value={kpis.affected} tone={kpis.affected ? "warn" : "neutral"} sub={step >= 3 ? <>identified by deterministic checks<Delta now={kpis.affected} before={prev.affected} /></> : "no impact analysis yet"} />
      <KpiTile label="Reached" value={kpis.reached} tone={kpis.reached ? "brand" : "neutral"} sub={kpis.reached ? <>{pct(reachedPct)} of affected · read {fmtInt(kpis.read)}<Delta now={kpis.reached} before={prev.reached} /></> : "no messages sent"} />
      <KpiTile label="Confirmed safe" value={kpis.safe} tone={kpis.safe ? "safe" : "neutral"} sub={kpis.safe ? <>{pct(kpis.safe / kpis.affected)} of affected<Delta now={kpis.safe} before={prev.safe} /></> : "awaiting responses"} />
      <KpiTile label="Assistance requests" value={kpis.help} tone={kpis.help ? "alert" : "neutral"} sub={kpis.unitsDispatched ? `${kpis.unitsDispatched} units dispatched` : kpis.help ? "triage pending" : "none"} />
      <KpiTile label="Clarification" value={kpis.clarification} tone={kpis.clarification ? "warn" : "neutral"} sub={kpis.different ? `+${kpis.different} situation differs` : "none"} />
      <KpiTile label="No response" value={kpis.noResponse} tone={kpis.noResponse ? "alert" : "neutral"} sub={kpis.noResponse ? <>escalation rules running<Delta now={kpis.noResponse} before={prev.noResponse} invert /></> : "—"} />
    </div>
  );
}
