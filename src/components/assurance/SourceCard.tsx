"use client";

import { AlertTriangle, Clock, Radio } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Arabic } from "@/components/ui/Misc";
import type { Lang, SourceClaim, SourceFeed } from "@/lib/types";
import { cn } from "@/lib/utils";

const VALUE_TONE: Record<SourceClaim["value"], Tone> = {
  closed: "alert",
  open: "safe",
  congested: "warn",
  hazard_active: "alert",
  alert_orange: "warn",
  sop_ref: "teal",
};
const VALUE_LABEL: Record<SourceClaim["value"], string> = {
  closed: "CLOSED",
  open: "OPEN",
  congested: "CONGESTED",
  hazard_active: "HAZARD ACTIVE",
  alert_orange: "ORANGE ALERT",
  sop_ref: "SOP LOADED",
};

export function SourceCard({ source, claim, lang, contradicted, selected, onClick }: { source: SourceFeed; claim?: SourceClaim; lang: Lang; contradicted?: boolean; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left panel-raised px-3.5 py-3 transition-colors hover:bg-white/[0.04]",
        contradicted && "border-warn/40",
        selected && "ring-1 ring-brand/50",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 h-7 w-7 rounded-md flex items-center justify-center shrink-0 border", claim ? "bg-teal/10 border-teal/25 text-teal-2" : "bg-white/[0.04] border-line text-ink-4")}>
          <Radio size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium truncate">{source.name}</span>
            <Badge tone={source.authorityRank === 1 ? "teal" : source.authorityRank === 2 ? "brand" : "neutral"} className="shrink-0">
              rank {source.authorityRank}
            </Badge>
          </div>
          <div className="text-[11.5px] text-ink-3 truncate">
            {source.org} · {source.protocol} · ~{source.latencySec}s
          </div>
          {claim ? (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge tone={VALUE_TONE[claim.value]}>{VALUE_LABEL[claim.value]}</Badge>
                <span className="mono text-[11px] text-ink-3 flex items-center gap-1">
                  <Clock size={10} /> observed {claim.observedAt}
                </span>
                {claim.stale && (
                  <Badge tone="warn">
                    <AlertTriangle size={10} /> stale
                  </Badge>
                )}
                {contradicted && !claim.stale && <Badge tone="warn">contradicted</Badge>}
              </div>
              {lang === "ar" ? <Arabic className="text-[13px] text-ink-2 leading-5">{claim.textAr}</Arabic> : <p className="text-[12.5px] text-ink-2 leading-4.5">{claim.text}</p>}
            </div>
          ) : (
            <div className="mt-2 text-[12px] text-ink-4">No claims received · nominal</div>
          )}
        </div>
      </div>
    </button>
  );
}
