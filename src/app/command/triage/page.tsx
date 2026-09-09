"use client";

import { AnimatePresence, motion } from "motion/react";
import { Ambulance, Inbox, ListChecks, Sparkles, Siren } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, CATEGORY, LayerTag, TRIAGE_TONE } from "@/components/ui/Badge";
import { Meter } from "@/components/ui/Kpi";
import { Arabic, EmptyState } from "@/components/ui/Misc";
import { Panel } from "@/components/ui/Panel";
import { channelLabel } from "@/lib/engine/impact";
import { fmtInt } from "@/lib/format";
import { useScenario, useSim } from "@/lib/simulation/store";
import { SCRIPT } from "@/lib/simulation/script";
import { clockAt } from "@/lib/format";
import type { CitizenResponse, ResponseCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const ORDER: ResponseCategory[] = ["help", "different", "clarification", "safe", "none"];

export default function TriagePage() {
  const state = useScenario();
  const selectPerson = useSim((s) => s.selectPerson);
  const step = state.step.index;
  const k = state.kpis;
  const byPerson = (id: string) => state.people.find((p) => p.person.id === id)!;
  const silent = state.people.filter((p) => p.status === "no_response");

  if (step < 6) {
    return (
      <div className="p-5 min-w-[1100px]">
        <Panel title="Response triage" eyebrow="Citizen response loop" className="min-h-[520px]">
          <EmptyState icon={<Inbox size={26} />} title={step < 5 ? "No messages delivered yet" : "Waiting for citizen responses"} hint="Replies, help requests and silence are classified by the AI layer and prioritised by deterministic rules from step 6." />
        </Panel>
      </div>
    );
  }

  const counts: Record<ResponseCategory, number> = { safe: k.safe, help: k.help, clarification: k.clarification, different: k.different, none: k.noResponse };

  return (
    <div className="p-6 flex flex-col gap-5 min-w-[1100px]">
      <div className="grid grid-cols-12 gap-5">
        <Panel title="Incoming responses" eyebrow={`${state.responses.length} individual replies · ${fmtInt(k.safe + k.help + k.clarification + k.different)} aggregate`} className="col-span-12 xl:col-span-4 max-h-[820px]" padded={false} bodyClassName="overflow-y-auto">
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {[...state.responses].reverse().map((r, i) => (
                <motion.li key={r.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}>
                  <ResponseCard r={r} onOpen={() => selectPerson(r.personId)} />
                </motion.li>
              ))}
            </AnimatePresence>
            {silent.map((p) => (
              <li key={p.person.id} className="px-4 py-3 flex items-center gap-3 opacity-80">
                <Avatar person={p.person} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{p.person.name}</div>
                  <div className="text-[11.5px] text-ink-3">No response · {p.escalation[p.escalation.length - 1]?.outcome ?? "escalation pending"}</div>
                </div>
                <Badge tone="alert" dot pulse>
                  silent
                </Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Grouped by the AI layer" eyebrow="Operator keeps the original text" layer="ai" className="col-span-12 xl:col-span-4" padded={false} bodyClassName="p-3 space-y-3 overflow-y-auto max-h-[820px]">
          {ORDER.map((cat) => {
            const items = cat === "none" ? [] : state.responses.filter((r) => r.classification.category === cat);
            const meta = CATEGORY[cat];
            return (
              <div key={cat} className="rounded-lg border border-line bg-white/[0.02]">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
                  <Badge tone={meta.tone} dot>
                    {meta.label}
                  </Badge>
                  <span className="num text-[12.5px] text-ink ml-auto">{fmtInt(counts[cat])}</span>
                  <span className="text-[11px] text-ink-4">aggregate</span>
                </div>
                <ul className="divide-y divide-line">
                  {items.map((r) => {
                    const ps = byPerson(r.personId);
                    return (
                      <li key={r.id} className="px-3 py-2 flex items-center gap-2.5">
                        <Avatar person={ps.person} size={22} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-medium truncate">{ps.person.name}</div>
                          <div className="text-[11.5px] text-ink-3 truncate">{r.classification.summary}</div>
                        </div>
                        <span className="num text-[11px] text-ink-4">u{r.classification.urgency}</span>
                      </li>
                    );
                  })}
                  {cat === "none" &&
                    silent.map((p) => (
                      <li key={p.person.id} className="px-3 py-2 flex items-center gap-2.5">
                        <Avatar person={p.person} size={22} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-medium truncate">{p.person.name}</div>
                          <div className="text-[11.5px] text-ink-3 truncate">{p.person.vulnerableRegistry ? "Vulnerable registry — escalating" : "Monitoring"}</div>
                        </div>
                      </li>
                    ))}
                  {items.length === 0 && cat !== "none" && <li className="px-3 py-2 text-[11.5px] text-ink-4">No individual replies in this group among profiled residents.</li>}
                </ul>
              </div>
            );
          })}
        </Panel>

        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
          {state.summary && (
            <Panel title="Operational summary" eyebrow={`Generated ${state.summary.generatedAt}`} layer="ai">
              <p className="text-[13.5px] font-medium leading-5 text-ink">{state.summary.headline}</p>
              <ul className="mt-2.5 space-y-1.5">
                {state.summary.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-[12.5px] text-ink-2 leading-4.5">
                    <Sparkles size={12} className="text-violet mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-2.5 text-[11px] text-ink-4">Counts are copied from the deterministic state; the model only orders and phrases them.</div>
            </Panel>
          )}

          <Panel title="Priority queue" eyebrow="Deterministic scoring" layer="deterministic" padded={false}>
            {state.triage.length === 0 ? (
              <EmptyState icon={<ListChecks size={22} />} title="No cases yet" />
            ) : (
              <ul className="divide-y divide-line">
                {state.triage.map((t) => {
                  const ps = byPerson(t.personId);
                  return (
                    <li key={t.id} className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={cn("num h-6 w-6 rounded-md flex items-center justify-center text-[12px] font-semibold", t.priority === 1 ? "bg-alert/20 text-[#ff9b96]" : t.priority === 2 ? "bg-warn/20 text-[#ffd27a]" : "bg-white/[0.06] text-ink-2")}>{t.priority}</span>
                        <button onClick={() => selectPerson(t.personId)} className="text-[13px] font-medium hover:underline">
                          {ps.person.name}
                        </button>
                        <Badge tone={CATEGORY[t.category].tone}>{CATEGORY[t.category].label}</Badge>
                        <Badge tone={TRIAGE_TONE[t.status]} className="ml-auto">
                          {t.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <Meter value={t.score / 100} tone={t.score >= 80 ? "alert" : t.score >= 50 ? "warn" : "brand"} label={`Score ${t.score}`} className="mt-2" />
                      <div className="text-[12px] text-ink-2 mt-1.5 leading-4.5">{t.recommended}</div>
                      {t.unit && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink">
                          {t.unit.toLowerCase().includes("ambulance") ? <Ambulance size={12} className="text-alert" /> : <Siren size={12} className="text-warn" />}
                          {t.unit}
                          {t.eta && <span className="text-ink-3">· ETA {t.eta}</span>}
                        </div>
                      )}
                      {t.resolution && <div className="mt-1 text-[12px] text-[#7fe0a8]">{t.resolution}</div>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Escalations" eyebrow="Rules E-01 … E-03" layer="deterministic" padded={false}>
            {state.people.filter((p) => p.escalation.length).length === 0 ? (
              <EmptyState title="No escalations running" />
            ) : (
              <ul className="divide-y divide-line">
                {state.people
                  .filter((p) => p.escalation.length)
                  .map((p) => (
                    <li key={p.person.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Avatar person={p.person} size={22} />
                        <span className="text-[13px] font-medium">{p.person.name}</span>
                        <span className="text-[11.5px] text-ink-3">· {p.person.contextNote}</span>
                      </div>
                      <ol className="space-y-1">
                        {p.escalation.map((e, i) => (
                          <li key={i} className="flex gap-2 text-[12px]">
                            <span className="mono text-[11px] text-ink-4 shrink-0 w-14">{e.at}</span>
                            <span className="mono text-[11px] text-teal-2 shrink-0">{e.rule}</span>
                            <span className="text-ink-2">{e.outcome}</span>
                          </li>
                        ))}
                      </ol>
                    </li>
                  ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ResponseCard({ r, onOpen }: { r: CitizenResponse; onOpen: () => void }) {
  const state = useScenario();
  const ps = state.people.find((p) => p.person.id === r.personId)!;
  const c = r.classification;
  const reply = SCRIPT[r.personId]?.operatorReply;
  const step = state.step.index;
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Avatar person={ps.person} size={28} />
        <button onClick={onOpen} className="text-[13px] font-medium hover:underline">
          {ps.person.name}
        </button>
        <span className="text-[11px] text-ink-4 mono">{r.at}</span>
        <span className="text-[11px] text-ink-4">{channelLabel(r.channel)}</span>
        <Badge tone={CATEGORY[c.category].tone} className="ml-auto">
          {CATEGORY[c.category].label}
        </Badge>
      </div>
      <div className="mt-2 rounded-xl rounded-tl-sm bg-white/[0.04] border border-line px-3 py-2">
        {r.lang === "ar" ? <Arabic className="text-[13.5px] text-ink">{r.text}</Arabic> : <p className="text-[13px] text-ink leading-5">{r.text}</p>}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <LayerTag layer="ai" />
        <span className="text-[11.5px] text-ink-3">
          urgency {c.urgency}/5 · {Math.round(c.confidence * 100)}%
        </span>
        {c.entities.map((e) => (
          <span key={e} className="rounded-md bg-white/[0.05] border border-line px-1.5 py-0.5 text-[11px] text-ink-2">
            {e}
          </span>
        ))}
      </div>
      {reply && step >= 7 && (
        <div className="mt-2 ml-6 rounded-xl rounded-tr-sm bg-brand/[0.08] border border-brand/25 px-3 py-2 text-[12.5px] text-ink">
          <div className="text-[11px] text-brand-2 mb-0.5 flex items-center gap-1.5">
            Operator reply · {clockAt(reply.sec)} <Badge tone="violet">AI draft · approved</Badge>
          </div>
          {r.lang === "ar" ? <Arabic>{reply.textAr}</Arabic> : reply.text}
        </div>
      )}
    </div>
  );
}
