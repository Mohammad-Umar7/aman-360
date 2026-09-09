"use client";

import { Check, Minus } from "lucide-react";
import type { RuleTrace } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RuleTraceList({ rules, compact }: { rules: RuleTrace[]; compact?: boolean }) {
  return (
    <ol className="divide-y divide-line">
      {rules.map((r) => (
        <li key={r.rule} className={cn("flex gap-3", compact ? "py-1.5" : "py-2")}>
          <span className={cn("mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0", r.fired ? "bg-teal/15 border-teal/30 text-teal-2" : "bg-white/[0.03] border-line text-ink-4")}>
            {r.fired ? <Check size={12} /> : <Minus size={12} />}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="mono text-[10.5px] text-ink-3">{r.rule}</span>
              <span className={cn("text-[12px] font-medium", r.fired ? "text-ink" : "text-ink-3")}>{r.title}</span>
            </div>
            {!compact && <div className="text-[11.5px] text-ink-3 leading-4 mt-0.5">{r.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
