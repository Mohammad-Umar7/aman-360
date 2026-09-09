"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CloudRain, GitCompareArrows, ListChecks, MessageSquareText, Radio, Send, ShieldCheck, Sparkles, UserRound, Cpu } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/types";

const ICON: Record<TimelineEvent["kind"], React.ComponentType<{ size?: number; className?: string }>> = {
  hazard: CloudRain,
  source: Radio,
  assurance: GitCompareArrows,
  impact: ShieldCheck,
  message: MessageSquareText,
  delivery: Send,
  response: UserRound,
  triage: ListChecks,
  operator: AlertTriangle,
  system: Cpu,
};

const LAYER_COLOR = { deterministic: "text-teal", ai: "text-violet", system: "text-ink-3" } as const;

export function TimelineFeed({ events, className, limit }: { events: TimelineEvent[]; className?: string; limit?: number }) {
  const list = [...events].reverse().slice(0, limit ?? events.length);
  return (
    <Panel title="Incident timeline" eyebrow="Live" className={className} padded={false} bodyClassName="overflow-y-auto">
      <ol className="divide-y divide-line">
        <AnimatePresence initial={false}>
          {list.map((e, i) => {
            const Icon = ICON[e.kind];
            return (
              <motion.li key={e.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.03 }} className="flex gap-3 px-4 py-2.5">
                <div className={cn("mt-0.5 h-6 w-6 rounded-md bg-white/[0.05] border border-line flex items-center justify-center shrink-0", LAYER_COLOR[e.layer])}>
                  <Icon size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="mono text-[11px] text-ink-4 shrink-0">{e.at}</span>
                    <span className="text-[13px] text-ink leading-4.5">{e.title}</span>
                  </div>
                  {e.detail && <div className="text-[12px] text-ink-3 leading-4 mt-0.5">{e.detail}</div>}
                </div>
                {e.layer === "ai" && <Sparkles size={12} className="text-violet/70 mt-1 shrink-0" />}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </Panel>
  );
}
