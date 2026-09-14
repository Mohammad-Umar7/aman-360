"use client";

import { ShieldCheck, Sparkles } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import type { ScenarioState } from "@/lib/types";
import { cn } from "@/lib/utils";

function Row({ label, on, count }: { label: string; on: boolean; count?: string }) {
  return (
    <li className={cn("flex items-center justify-between text-[12.5px] py-1.5", on ? "text-ink" : "text-ink-4")}>
      <span className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-current" : "bg-ink-4/50")} />
        {label}
      </span>
      {count && <span className="num text-[11.5px] text-ink-3">{count}</span>}
    </li>
  );
}

export function LayerActivity({ state, className }: { state: ScenarioState; className?: string }) {
  const s = state.step.index;
  const affected = state.people.filter((p) => p.impact?.affected).length;
  const msgs = state.people.filter((p) => p.message).length;
  const routes = state.people.filter((p) => p.person.route).length;
  const accessible = state.people.filter((p) => p.impact?.rules.some((r) => r.rule === "R-06" && r.fired)).length;
  const adapted = state.people.filter((p) => p.message && p.impact?.rules.some((r) => r.rule === "R-06" && r.fired)).length;
  const checks = state.channelChecks.flatMap((c) => c.checks);
  const failing = checks.filter((c) => !c.pass).length;
  const channels = state.channelChecks.length;
  const resolved = state.kpis.contradictionsResolved;
  return (
    <Panel title="Two intelligence layers" eyebrow="Architecture" className={className}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-teal-2 mb-1">
            <ShieldCheck size={13} /> Deterministic safety
          </div>
          <ul className="divide-y divide-line">
            <Row label="Source hierarchy & contradictions" on={s >= 2} count={s >= 2 ? `${resolved}/${state.contradictions.length} resolved` : undefined} />
            <Row label="Hazard polygon checks" on={s >= 3} count={s >= 3 ? `${state.people.length} profiles` : undefined} />
            <Row label="Route × closure intersection" on={s >= 3} count={s >= 3 ? `${routes} routes` : undefined} />
            <Row label="Approved action selection" on={s >= 3} count={s >= 3 ? `${affected} actions` : undefined} />
            <Row label="Accessibility-safe filtering" on={s >= 3} count={s >= 3 ? `${accessible} profiles` : undefined} />
            <Row label="Channel consistency checks" on={s >= 2} count={s >= 2 ? (failing ? `${failing} fail · ${channels} channels` : `${checks.length}/${checks.length} pass`) : undefined} />
            <Row label="Escalation rules E-01…E-03" on={s >= 6} count={s >= 6 ? "running" : undefined} />
            <Row label="Triage scoring" on={s >= 6} count={s >= 6 ? `${state.triage.length} ranked` : undefined} />
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-violet-2 mb-1">
            <Sparkles size={13} /> AI communication
          </div>
          <ul className="divide-y divide-line">
            <Row label="Contradiction explanation" on={s >= 2} />
            <Row label="Personalised wording (EN/AR)" on={s >= 4} count={s >= 4 ? `${msgs} messages` : undefined} />
            <Row label="Accessibility-aware phrasing" on={s >= 4} count={s >= 4 ? `${adapted} adapted` : undefined} />
            <Row label="Multi-channel adaptation" on={s >= 4} count={s >= 4 ? `${channels} channels` : undefined} />
            <Row label="Response classification" on={s >= 6} count={s >= 6 ? `${state.responses.length} classified` : undefined} />
            <Row label="Grouping & prioritisation hints" on={s >= 6} />
            <Row label="Operator summaries" on={s >= 3} count={s >= 3 ? "refreshing" : undefined} />
            <Row label="Reply drafting (approved)" on={s >= 7} count={s >= 7 ? "2 drafts" : undefined} />
          </ul>
        </div>
      </div>
      <p className="mt-3 text-[11.5px] text-ink-4 leading-4">The AI layer never decides who is affected or what action applies. It adapts wording, language and channels, and summarises for operators.</p>
    </Panel>
  );
}
