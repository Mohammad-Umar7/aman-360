"use client";

import { useState } from "react";
import { ContradictionPanel } from "@/components/assurance/ContradictionPanel";
import { SourceCard } from "@/components/assurance/SourceCard";
import { ChannelConsistency, VerifiedFacts } from "@/components/assurance/VerifiedFacts";
import { KpiTile } from "@/components/ui/Kpi";
import { Panel } from "@/components/ui/Panel";
import { SOURCES } from "@/lib/data/sources";
import { overallAssurance } from "@/lib/simulation/scenario";
import { useScenario, useSim } from "@/lib/simulation/store";
import { pct } from "@/lib/format";

export default function AssurancePage() {
  const state = useScenario();
  const lang = useSim((s) => s.lang);
  const [selected, setSelected] = useState<string | null>(null);
  const ctr = state.contradictions[0];
  const contradictedSources = new Set(ctr?.claims.map((c) => c.sourceId) ?? []);
  const step = state.step.index;
  return (
    <div className="p-5 flex flex-col gap-4 min-w-[1100px]">
      <div className="grid grid-cols-5 gap-3">
        <KpiTile label="Sources connected" value={SOURCES.length} tone="teal" sub="institutional feeds, read-only" compact />
        <KpiTile label="Claims received" value={state.claims.length} tone={state.claims.length ? "brand" : "neutral"} sub={step >= 1 ? "within 90 s of onset" : "nominal"} compact />
        <KpiTile label="Contradictions" value={state.contradictions.length} tone={state.contradictions.length ? "warn" : "neutral"} sub={state.contradictions.length ? "resolved by hierarchy" : "none detected"} compact />
        <KpiTile label="Verified facts" value={state.facts.length} tone={state.facts.length ? "safe" : "neutral"} sub={state.facts.length ? `assurance ${pct(overallAssurance(state))}` : "—"} compact />
        <KpiTile label="Channel consistency" value={state.channelChecks.length ? state.kpis.consistency * 100 : 0} format={(n) => `${Math.round(n)}%`} tone={state.kpis.consistency >= 0.99 && state.channelChecks.length ? "safe" : state.channelChecks.length ? "warn" : "neutral"} sub={state.channelChecks.length ? `${state.channelChecks.filter((c) => c.published).length} published channels` : "no channels yet"} compact />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Incoming official sources" eyebrow="Inputs" className="col-span-12 xl:col-span-4" padded={false} bodyClassName="p-3 space-y-2">
          {SOURCES.map((src) => {
            const claim = [...state.claims].reverse().find((c) => c.sourceId === src.id);
            return <SourceCard key={src.id} source={src} claim={claim} lang={lang} contradicted={contradictedSources.has(src.id)} selected={selected === src.id} onClick={() => setSelected(selected === src.id ? null : src.id)} />;
          })}
          <p className="text-[11px] text-ink-4 px-1 pt-1">Sources are ranked per subject domain. A source can be authoritative for road status and merely informative for weather.</p>
        </Panel>

        <ContradictionPanel ctr={ctr} lang={lang} step={step} className="col-span-12 xl:col-span-5" />

        <div className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          <VerifiedFacts facts={state.facts} lang={lang} />
          <ChannelConsistency checks={state.channelChecks} dense />
        </div>
      </div>
    </div>
  );
}
