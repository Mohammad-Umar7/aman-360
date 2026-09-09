"use client";

import { CheckCircle2, ShieldCheck, XCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Meter } from "@/components/ui/Kpi";
import { Arabic, EmptyState } from "@/components/ui/Misc";
import { Panel } from "@/components/ui/Panel";
import { sourceById } from "@/lib/data/sources";
import type { ChannelCheck, Lang, VerifiedFact } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VerifiedFacts({ facts, lang, className }: { facts: VerifiedFact[]; lang: Lang; className?: string }) {
  return (
    <Panel title="Verified facts" eyebrow="Single source of truth" layer="deterministic" className={className} padded={false}>
      {facts.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={22} />} title="Nothing verified yet" hint="Facts are published once claims pass the hierarchy and contradiction checks." />
      ) : (
        <ul className="divide-y divide-line">
          {facts.map((f) => (
            <li key={f.subject} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-teal-2" />
                <span className="text-[12px] text-ink-2 truncate">{f.label}</span>
                <span className="mono text-[10.5px] text-ink-4 ml-auto">{f.verifiedAt}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                {lang === "ar" ? <Arabic className="text-[13.5px] font-semibold">{f.valueAr}</Arabic> : <span className="text-[13.5px] font-semibold">{f.value}</span>}
                <Badge tone="neutral" className="ml-auto">
                  {sourceById(f.sourceId).org.split(" — ")[0]}
                </Badge>
              </div>
              <Meter value={f.assurance} tone="teal" label="Assurance" className="mt-1.5" />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function ChannelConsistency({ checks, className, dense }: { checks: ChannelCheck[]; className?: string; dense?: boolean }) {
  const published = checks.filter((c) => c.published);
  const consistent = published.filter((c) => c.consistent).length;
  return (
    <Panel
      title="Channel consistency"
      eyebrow="One truth, many channels"
      layer="deterministic"
      className={className}
      padded={false}
      actions={
        checks.length ? (
          <Badge tone={consistent === published.length ? "safe" : "warn"} dot>
            {consistent}/{published.length} consistent
          </Badge>
        ) : undefined
      }
    >
      {checks.length === 0 ? (
        <EmptyState icon={<MinusCircle size={22} />} title="No channels to check" hint="Published content is compared against the verified facts continuously." />
      ) : (
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-ink-4 text-[10.5px] uppercase tracking-wider">
              <th className="px-4 py-2 font-medium">Channel</th>
              {!dense && <th className="px-2 py-2 font-medium">Checks</th>}
              <th className="px-2 py-2 font-medium">Last sync</th>
              <th className="px-4 py-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {checks.map((c) => (
              <tr key={c.channel} className={cn(!c.published && "opacity-60")}>
                <td className="px-4 py-2 font-medium text-ink">{c.label}</td>
                {!dense && (
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      {c.checks.map((k) => (
                        <span key={k.name} title={k.name} className={cn("h-2 w-2 rounded-sm", k.pass ? "bg-safe" : "bg-alert")} />
                      ))}
                    </div>
                  </td>
                )}
                <td className="px-2 py-2 mono text-[11px] text-ink-3">{c.lastSync}</td>
                <td className="px-4 py-2 text-right">
                  {!c.published ? (
                    <Badge tone="neutral">prepared</Badge>
                  ) : c.consistent ? (
                    <Badge tone="safe">
                      <CheckCircle2 size={11} /> consistent
                    </Badge>
                  ) : (
                    <Badge tone="alert">
                      <XCircle size={11} /> inconsistent
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
