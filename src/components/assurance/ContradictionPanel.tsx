"use client";

import { ArrowDown, GitCompareArrows, ShieldCheck, Sparkles, Trophy, XCircle } from "lucide-react";
import { explainContradiction } from "@/lib/ai/explain";
import { Badge, LayerTag } from "@/components/ui/Badge";
import { Arabic, EmptyState } from "@/components/ui/Misc";
import { Panel } from "@/components/ui/Panel";
import { SOURCES, SUBJECTS, sourceById } from "@/lib/data/sources";
import type { Contradiction, Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ContradictionPanel({ ctr, lang, step, className }: { ctr?: Contradiction; lang: Lang; step: number; className?: string }) {
  if (!ctr) {
    return (
      <Panel title="Contradiction resolution" layer="deterministic" className={className}>
        <EmptyState icon={<GitCompareArrows size={22} />} title={step >= 1 ? "Scanning claims for conflicts" : "No conflicting claims"} hint={step >= 1 ? "Definitive claims about the same subject are compared as they arrive." : "Sources are compared subject by subject as claims arrive."} />
      </Panel>
    );
  }
  const winner = ctr.claims.find((c) => c.id === ctr.winningClaimId)!;
  const losers = ctr.claims.filter((c) => c.id !== ctr.winningClaimId);
  const explanation = explainContradiction(ctr);
  const ranks = [...SOURCES].filter((s) => s.domains.includes(SUBJECTS[ctr.subject]?.domain ?? "")).sort((a, b) => a.authorityRank - b.authorityRank);
  return (
    <Panel
      title="Contradiction resolution"
      layer="deterministic"
      className={className}
      actions={
        <Badge tone="safe" dot>
          resolved {ctr.resolvedAt}
        </Badge>
      }
    >
      <div className="text-[12px] text-ink-3 mb-2">
        Subject · <span className="text-ink-2">{SUBJECTS[ctr.subject]?.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[winner, ...losers].map((c) => {
          const src = sourceById(c.sourceId);
          const win = c.id === winner.id;
          return (
            <div key={c.id} className={cn("rounded-lg border px-3 py-2.5", win ? "border-teal/40 bg-teal/[0.06]" : "border-alert/30 bg-alert/[0.05]")}>
              <div className="flex items-center gap-1.5 text-[11.5px] mb-1">
                {win ? <Trophy size={12} className="text-teal-2" /> : <XCircle size={12} className="text-alert" />}
                <span className={cn("font-semibold", win ? "text-teal-2" : "text-[#ff9b96]")}>{win ? "Authoritative" : "Overridden"}</span>
                <Badge tone="neutral" className="ml-auto">
                  rank {src.authorityRank}
                </Badge>
              </div>
              <div className="text-[12.5px] font-medium truncate">{src.name.split(" — ")[0]}</div>
              <div className="text-[18px] font-semibold num tracking-tight mt-0.5">{c.value.toUpperCase()}</div>
              <div className="mono text-[11px] text-ink-3">observed {c.observedAt}</div>
              {c.stale && <div className="text-[11px] text-warn mt-0.5">stale content</div>}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <div className="eyebrow mb-1.5">Approved source hierarchy · {SUBJECTS[ctr.subject]?.domain.replace("_", " ")}</div>
        <ol className="flex items-stretch gap-1.5">
          {ranks.map((s, i) => {
            const isWinner = s.id === winner.sourceId;
            const isLoser = losers.some((l) => l.sourceId === s.id);
            return (
              <li key={s.id} className={cn("flex-1 rounded-md border px-2 py-1.5 text-[11.5px] leading-4 relative", isWinner ? "border-teal/40 bg-teal/[0.08] text-ink" : isLoser ? "border-alert/30 bg-alert/[0.05] text-ink-2" : "border-line text-ink-3")}>
                <div className="num text-[10.5px] text-ink-4">#{i + 1} · rank {s.authorityRank}</div>
                <div className="truncate">{s.org.split(" — ")[0]}</div>
                {isWinner && <ShieldCheck size={12} className="absolute right-1.5 top-1.5 text-teal-2" />}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-3">
        <div className="eyebrow mb-1.5">Resolution trace</div>
        <ol className="space-y-1.5">
          {ctr.rationale.map((r, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] text-ink-2 leading-4.5">
              <span className="mono text-[11px] text-teal-2 mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              {r}
            </li>
          ))}
        </ol>
        <div className="mt-2 flex items-start gap-2 text-[12.5px] text-ink-2 rounded-md bg-white/[0.03] border border-line px-2.5 py-2">
          <ArrowDown size={13} className="text-ink-3 mt-0.5 shrink-0" />
          <span>
            <span className="text-ink font-medium">Action · </span>
            {ctr.action}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-violet/25 bg-violet/[0.05] px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={13} className="text-violet-2" />
          <span className="text-[12.5px] font-semibold text-violet-2">Plain-language brief for the operator</span>
          <LayerTag layer="ai" />
        </div>
        {lang === "ar" ? <Arabic className="text-[13.5px] text-ink leading-6">{explanation.textAr}</Arabic> : <p className="text-[13px] text-ink leading-5">{explanation.text}</p>}
        <div className="text-[11px] text-ink-4 mt-1.5">Explanation only — the decision above was made by the deterministic layer.</div>
      </div>
    </Panel>
  );
}
