"use client";

import { AnimatePresence, motion } from "motion/react";
import { BellRing, CheckCheck } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Badge, LayerTag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Misc";
import { useSim } from "@/lib/simulation/store";
import type { OperatorItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const P = { high: "alert", medium: "warn", low: "neutral" } as const;

export function OperatorQueue({ items, className }: { items: OperatorItem[]; className?: string }) {
  const selectPerson = useSim((s) => s.selectPerson);
  return (
    <Panel
      title="Operator attention"
      eyebrow="Queue"
      className={className}
      padded={false}
      actions={
        <Badge tone={items.some((i) => i.priority === "high") ? "alert" : items.length ? "warn" : "safe"} dot pulse={items.some((i) => i.priority === "high")}>
          {items.length ? `${items.length} open` : "clear"}
        </Badge>
      }
      bodyClassName="overflow-y-auto"
    >
      {items.length === 0 ? (
        <EmptyState icon={<CheckCheck size={22} />} title="Nothing needs your attention" hint="Automated rules and the AI layer are operating within policy." />
      ) : (
        <ul className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {items.map((it, i) => (
              <motion.li key={it.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }} className="px-4 py-3 flex gap-3">
                <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", it.priority === "high" ? "bg-alert" : it.priority === "medium" ? "bg-warn" : "bg-ink-4")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-medium text-ink leading-4.5 truncate">{it.title}</span>
                    <LayerTag layer={it.layer} />
                  </div>
                  <div className="text-[11.5px] text-ink-3 mt-0.5 leading-4">{it.detail}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge tone={P[it.priority]}>{it.priority}</Badge>
                  {it.action && (
                    <Button size="xs" variant="ghost" onClick={() => it.personId && selectPerson(it.personId)} className="text-brand-2">
                      {it.action}
                    </Button>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {items.length > 0 && (
        <div className="px-4 py-2 border-t border-line text-[11px] text-ink-4 flex items-center gap-1.5">
          <BellRing size={11} /> Items clear automatically when the underlying rule or request is resolved.
        </div>
      )}
    </Panel>
  );
}
