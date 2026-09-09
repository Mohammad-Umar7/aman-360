"use client";

import { useMemo, useState } from "react";
import { Accessibility, Car, Building2, Footprints, Home, PhoneOff, Ear, Search } from "lucide-react";
import { PersonDrawer } from "@/components/population/PersonDrawer";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, PERSON_STATUS, SeverityDot, StatusPill } from "@/components/ui/Badge";
import { KpiTile } from "@/components/ui/Kpi";
import { Arabic, Segmented } from "@/components/ui/Misc";
import { Panel } from "@/components/ui/Panel";
import { ACTIONS } from "@/lib/data/sop";
import { channelLabel } from "@/lib/engine/impact";
import { fmtInt } from "@/lib/format";
import { AFFECTED_BREAKDOWN } from "@/lib/simulation/script";
import { useScenario, useSim } from "@/lib/simulation/store";
import type { PersonState } from "@/lib/types";
import { cn } from "@/lib/utils";

const CTX = { driving: Car, home: Home, walking: Footprints, office: Building2 } as const;
type Filter = "all" | "affected" | "attention" | "safe" | "no_alert";

export default function PopulationPage() {
  const state = useScenario();
  const selectPerson = useSim((s) => s.selectPerson);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const step = state.step.index;

  const rows = useMemo(() => {
    let list = state.people;
    if (filter === "affected") list = list.filter((p) => p.impact?.affected);
    if (filter === "attention") list = list.filter((p) => ["help", "no_response", "clarification", "different", "assistance_assigned"].includes(p.status));
    if (filter === "safe") list = list.filter((p) => ["safe", "resolved"].includes(p.status));
    if (filter === "no_alert") list = list.filter((p) => p.status === "no_alert");
    if (q) list = list.filter((p) => p.person.name.toLowerCase().includes(q.toLowerCase()) || p.person.nameAr.includes(q));
    return [...list].sort((a, b) => Number(b.person.spotlight) - Number(a.person.spotlight) || (b.impact?.severity === "high" ? 1 : 0) - (a.impact?.severity === "high" ? 1 : 0));
  }, [state.people, filter, q]);

  const affected = state.people.filter((p) => p.impact?.affected).length;
  const accessibility = state.people.filter((p) => p.impact?.affected && (p.person.accessibility.mobility !== "standard" || p.person.accessibility.hearing || !p.person.accessibility.smartphone)).length;
  const attention = state.people.filter((p) => ["help", "no_response", "clarification", "different"].includes(p.status)).length;

  return (
    <div className="p-5 flex flex-col gap-4 min-w-[1100px]">
      <div className="grid grid-cols-6 gap-3">
        <KpiTile label="Affected population" value={state.kpis.affected} tone={state.kpis.affected ? "warn" : "neutral"} sub="aggregate estimate (institutional)" compact />
        <KpiTile label="Profiles evaluated" value={step >= 3 ? state.people.length : 0} tone="teal" sub="synthetic demo profiles" compact />
        <KpiTile label="Affected profiles" value={affected} tone={affected ? "warn" : "neutral"} sub="rules R-01 / R-02 fired" compact />
        <KpiTile label="Accessibility-adapted" value={accessibility} tone={accessibility ? "info" : "neutral"} sub="mobility, hearing, no smartphone" compact />
        <KpiTile label="Need attention" value={attention} tone={attention ? "alert" : "neutral"} sub="help, questions, silence" compact />
        <KpiTile label="Alerts suppressed" value={state.people.filter((p) => p.status === "no_alert").length} tone="neutral" sub="outside impact area (R-05)" compact />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel
          className="col-span-12 xl:col-span-9"
          title="Person-level view"
          eyebrow="Who is actually affected"
          padded={false}
          actions={
            <>
              <div className="flex items-center gap-1.5 h-7 px-2 rounded-md bg-white/[0.05] border border-line text-ink-3">
                <Search size={12} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="bg-transparent outline-none text-[12px] text-ink w-28 placeholder:text-ink-4" />
              </div>
              <Segmented
                size="xs"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "affected", label: "Affected" },
                  { value: "attention", label: "Attention" },
                  { value: "safe", label: "Safe" },
                  { value: "no_alert", label: "No alert" },
                ]}
              />
            </>
          }
        >
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-ink-4 text-[10.5px] uppercase tracking-wider border-b border-line">
                <th className="px-4 py-2.5 font-medium">Person</th>
                <th className="px-3 py-2.5 font-medium">Context</th>
                <th className="px-3 py-2.5 font-medium">Why affected</th>
                <th className="px-3 py-2.5 font-medium">Approved action</th>
                <th className="px-3 py-2.5 font-medium">Channels</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Last event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((ps) => (
                <Row key={ps.person.id} ps={ps} onClick={() => selectPerson(ps.person.id)} step={step} />
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="px-4 py-8 text-center text-[12px] text-ink-3">No people match this filter.</div>}
        </Panel>

        <div className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          <Panel title="Affected population" eyebrow="How the number is built">
            {step >= 3 ? (
              <ul className="space-y-2">
                {AFFECTED_BREAKDOWN.map((b) => (
                  <li key={b.label} className="text-[12px]">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-ink-2">{b.label}</span>
                      <span className="num font-medium">{fmtInt(b.value)}</span>
                    </div>
                    <div className="text-[10.5px] text-ink-4">{b.source}</div>
                  </li>
                ))}
                <li className="flex items-baseline justify-between border-t border-line pt-2 text-[12.5px] font-semibold">
                  <span>Total affected</span>
                  <span className="num">{fmtInt(state.kpis.affected)}</span>
                </li>
              </ul>
            ) : (
              <div className="text-[12px] text-ink-3">Computed at step 3 once the hazard polygon and the closure are verified.</div>
            )}
          </Panel>
          <Panel title="Data & privacy" eyebrow="Prototype">
            <ul className="text-[11.5px] text-ink-2 space-y-1.5 leading-4.5">
              <li>• All user profiles and locations shown in this prototype are synthetic.</li>
              <li>• Real deployment would rely only on authorised institutional data (building registries, vulnerable-persons registries, cell broadcast) and/or user-consented app data.</li>
              <li>• No continuous individual tracking: road users are matched by consented navigation session or cell-broadcast segment, never by identity.</li>
              <li>• Every decision above carries a rule trace so it can be audited.</li>
            </ul>
          </Panel>
        </div>
      </div>
      <PersonDrawer />
    </div>
  );
}

function Row({ ps, onClick, step }: { ps: PersonState; onClick: () => void; step: number }) {
  const { person, impact } = ps;
  const Icon = CTX[person.context];
  const action = impact ? ACTIONS[impact.action] : undefined;
  const last = [...ps.deliveries].reverse()[0]?.at ?? ps.message?.createdAt;
  const lastLabel = ps.response ? `${ps.response.at} reply` : ps.escalation.length ? `${ps.escalation[ps.escalation.length - 1].at} ${ps.escalation[ps.escalation.length - 1].rule}` : last ? `${last}` : "—";
  return (
    <tr onClick={onClick} className={cn("cursor-pointer hover:bg-white/[0.03] transition-colors", person.spotlight && "bg-white/[0.012]")}>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar person={person} size={28} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium truncate">{person.name}</span>
              {person.accessibility.mobility === "wheelchair" && <Accessibility size={12} className="text-info" />}
              {person.accessibility.hearing && <Ear size={12} className="text-info" />}
              {!person.accessibility.smartphone && <PhoneOff size={12} className="text-ink-3" />}
            </div>
            <Arabic className="text-[11px] text-ink-3 text-left">{person.nameAr}</Arabic>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 text-ink-2">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-ink-3 shrink-0" />
          <span className="truncate max-w-[220px]">{person.contextNote}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-ink-2">
        {impact ? (
          <div className="flex items-center gap-1.5">
            <SeverityDot severity={impact.severity} />
            <span className="truncate max-w-[220px]">{impact.reason}</span>
          </div>
        ) : (
          <span className="text-ink-4">{step >= 1 ? "awaiting analysis" : "—"}</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        {action ? (
          action.code === "NO_ACTION" ? (
            <span className="text-ink-4">No alert</span>
          ) : (
            <Badge tone="teal">{action.title}</Badge>
          )
        ) : (
          <span className="text-ink-4">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-ink-3 text-[11.5px]">{impact?.affected ? impact.channels.map(channelLabel).join(" · ") : person.channels.map(channelLabel).join(" · ")}</td>
      <td className="px-3 py-2.5">
        <StatusPill status={ps.status} pulse />
      </td>
      <td className="px-4 py-2.5 text-right mono text-[11px] text-ink-3">{lastLabel}</td>
    </tr>
  );
}

export const STATUS_LABELS = PERSON_STATUS;
