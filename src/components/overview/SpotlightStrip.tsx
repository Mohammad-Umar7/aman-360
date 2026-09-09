"use client";

import { Car, Home, Footprints, Building2, Accessibility, PhoneOff, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { ACTIONS } from "@/lib/data/sop";
import { useSim } from "@/lib/simulation/store";
import type { PersonState } from "@/lib/types";
import { cn } from "@/lib/utils";

const CTX = { driving: Car, home: Home, walking: Footprints, office: Building2 } as const;

export function SpotlightStrip({ people, className }: { people: PersonState[]; className?: string }) {
  const selectPerson = useSim((s) => s.selectPerson);
  const spot = people.filter((p) => p.person.spotlight);
  return (
    <Panel
      title="People in focus"
      eyebrow="Synthetic profiles"
      className={className}
      padded={false}
      actions={
        <Link href="/command/population" className="text-[12px] text-brand-2 hover:underline flex items-center gap-0.5">
          All people <ArrowUpRight size={12} />
        </Link>
      }
    >
      <ul className="divide-y divide-line">
        {spot.map((ps) => {
          const Icon = CTX[ps.person.context];
          const action = ps.impact ? ACTIONS[ps.impact.action] : undefined;
          return (
            <li key={ps.person.id}>
              <button onClick={() => selectPerson(ps.person.id)} className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                <Avatar person={ps.person} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium truncate">{ps.person.name}</span>
                    {ps.person.accessibility.mobility === "wheelchair" && <Accessibility size={12} className="text-info" />}
                    {!ps.person.accessibility.smartphone && <PhoneOff size={12} className="text-ink-3" />}
                  </div>
                  <div className="text-[11.5px] text-ink-3 flex items-center gap-1.5 truncate">
                    <Icon size={11} />
                    <span className="truncate">{action && action.code !== "NO_ACTION" ? action.title : ps.person.contextNote}</span>
                  </div>
                </div>
                <div className={cn("shrink-0")}>
                  <StatusPill status={ps.status} pulse />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
