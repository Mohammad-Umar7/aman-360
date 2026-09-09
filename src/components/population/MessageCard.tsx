"use client";

import { Sparkles, ShieldCheck, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Arabic } from "@/components/ui/Misc";
import { ACTIONS } from "@/lib/data/sop";
import type { Lang, Message } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MessageCard({ message, lang, showBoth = true, className }: { message: Message; lang: Lang; showBoth?: boolean; className?: string }) {
  const action = ACTIONS[message.action];
  const primaryAr = lang === "ar";
  return (
    <div className={cn("rounded-xl border border-line overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-line">
        <Badge tone="teal">
          <ShieldCheck size={11} /> {action.title}
        </Badge>
        <span className="mono text-[11px] text-ink-3">{action.sop}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-ink-3">
          {message.approval === "operator" ? (
            <>
              <UserCheck size={11} className="text-warn" /> operator confirmed
            </>
          ) : (
            <>
              <Sparkles size={11} className="text-violet" /> auto-approved template
            </>
          )}
        </span>
      </div>
      <div className="px-3 py-3 space-y-3">
        {(primaryAr ? ["ar", "en"] : ["en", "ar"]).filter((l, i) => showBoth || i === 0).map((l) =>
          l === "ar" ? (
            <Arabic key="ar" className="text-[14px] leading-7 text-ink">
              {message.ar}
            </Arabic>
          ) : (
            <p key="en" className="text-[13.5px] leading-6 text-ink">
              {message.en}
            </p>
          ),
        )}
      </div>
    </div>
  );
}

export function AiTracePanel({ ai, className }: { ai: Message["ai"]; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-violet/20 bg-violet/[0.05] px-3 py-3 text-[12.5px]", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={13} className="text-violet-2" />
        <span className="font-semibold text-violet-2">AI trace</span>
        <span className="mono text-[11px] text-ink-3">{ai.model}</span>
        <span className="ml-auto num text-[11.5px] text-ink-3">confidence {Math.round(ai.confidence * 100)}%</span>
      </div>
      <div className="text-ink-2 mb-2">
        <span className="text-ink-3">Task · </span>
        {ai.task}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="eyebrow mb-1">Inputs (from deterministic layer)</div>
          <ul className="space-y-1 text-ink-2">
            {ai.inputs.map((i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-teal shrink-0">▸</span>
                <span className="leading-4">{i}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-1">Constraints enforced</div>
          <ul className="space-y-1 text-ink-2">
            {ai.constraints.map((c) => (
              <li key={c} className="flex gap-1.5">
                <span className="text-violet shrink-0">▸</span>
                <span className="leading-4">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-violet/15 text-ink-2 leading-4.5">
        <span className="text-ink-3">Rationale · </span>
        {ai.rationale}
      </div>
      {ai.reviewRequired && (
        <div className="mt-2 rounded-md bg-warn/10 border border-warn/25 px-2.5 py-1.5 text-[#ffd27a] flex items-center gap-1.5">
          <UserCheck size={12} /> {ai.reviewReason}
        </div>
      )}
    </div>
  );
}
