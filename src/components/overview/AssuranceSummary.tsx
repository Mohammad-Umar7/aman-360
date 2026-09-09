"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDashed, GitCompareArrows, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Ring } from "@/components/ui/Kpi";
import { Kv } from "@/components/ui/Misc";
import { SOURCES, sourceById } from "@/lib/data/sources";
import { overallAssurance } from "@/lib/simulation/scenario";
import type { ScenarioState } from "@/lib/types";

export function AssuranceSummary({ state }: { state: ScenarioState }) {
  const road = state.facts.find((f) => f.subject === "road:al-majaz-underpass");
  const ctr = state.contradictions[0];
  const step = state.step.index;
  return (
    <Panel
      title="Communication assurance"
      layer="deterministic"
      actions={
        <Link href="/command/assurance" className="text-[11.5px] text-brand-2 hover:underline flex items-center gap-0.5">
          Details <ArrowUpRight size={12} />
        </Link>
      }
    >
      <div className="flex items-center gap-4">
        <Ring value={state.facts.length ? overallAssurance(state) : 0} tone="teal" size={72} label={state.facts.length ? "Assurance" : "Not yet verified"} sub={state.facts.length ? `${state.facts.length} verified facts` : `${state.claims.length} claims received`} />
        <div className="flex-1">
          <Ring value={state.channelChecks.length ? state.kpis.consistency : 0} tone={state.kpis.consistency >= 0.99 ? "safe" : state.channelChecks.length ? "warn" : "neutral"} size={72} label="Channel consistency" sub={state.channelChecks.length ? `${state.channelChecks.filter((c) => c.published).length} channels checked` : "no channels published"} />
        </div>
      </div>
      <div className="mt-3">
        <Kv k="Sources checked" v={`${step >= 1 ? SOURCES.length : SOURCES.length} feeds · ${state.claims.length} claims`} />
        <Kv
          k="Contradictions"
          v={
            ctr ? (
              <span className="flex items-center gap-1.5 text-warn">
                <GitCompareArrows size={13} /> 1 detected · resolved
              </span>
            ) : step >= 1 ? (
              <span className="text-ink-3">scanning…</span>
            ) : (
              "none"
            )
          }
        />
        <Kv
          k="Al Majaz underpass"
          v={
            road ? (
              <span className="flex items-center gap-1.5 text-teal-2">
                <ShieldCheck size={13} /> {road.value} · {sourceById(road.sourceId).org.split(" — ")[0]}
              </span>
            ) : step >= 1 ? (
              <span className="flex items-center gap-1.5 text-ink-3">
                <CircleDashed size={13} /> unverified
              </span>
            ) : (
              "open"
            )
          }
        />
        <Kv k="Verified at" v={road ? <span className="mono">{road.verifiedAt}</span> : "—"} />
      </div>
      {ctr && (
        <div className="mt-3 rounded-lg border border-warn/25 bg-warn/[0.07] px-3 py-2 text-[12px] leading-4.5">
          <div className="flex items-center gap-1.5 font-medium text-[#ffd27a] mb-0.5">
            <GitCompareArrows size={13} /> Public portal said OPEN — Police Operations said CLOSED
          </div>
          <div className="text-ink-2">Resolved by source hierarchy (rank 1 beats rank 4; portal stale 14 days). Correction notice queued.</div>
        </div>
      )}
      {step >= 5 && state.kpis.consistency >= 0.99 && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#7fe0a8]">
          <CheckCircle2 size={13} /> All published channels match the verified statement
        </div>
      )}
      {step === 0 && <Badge tone="safe" dot className="mt-3">All feeds nominal</Badge>}
    </Panel>
  );
}
