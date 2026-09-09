"use client";

import { Accessibility, Car, Building2, Footprints, Home, MapPin, PhoneOff, Ear, ListChecks, Route } from "lucide-react";
import { DistrictMap } from "@/components/map/DistrictMap";
import { DeliveryTrail } from "@/components/population/DeliveryTrail";
import { AiTracePanel, MessageCard } from "@/components/population/MessageCard";
import { RuleTraceList } from "@/components/population/RuleTrace";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, CATEGORY, LayerTag, StatusPill, TRIAGE_TONE } from "@/components/ui/Badge";
import { Arabic, Drawer, Kv } from "@/components/ui/Misc";
import { PanelDivider } from "@/components/ui/Panel";
import { ASSEMBLY_POINTS, buildingById } from "@/lib/data/district";
import { ACTIONS } from "@/lib/data/sop";
import { channelLabel, consentLabel } from "@/lib/engine/impact";
import { useScenario, useSim } from "@/lib/simulation/store";
import { SCRIPT } from "@/lib/simulation/script";
import { clockAt } from "@/lib/format";

const CTX = { driving: Car, home: Home, walking: Footprints, office: Building2 } as const;

export function PersonDrawer() {
  const state = useScenario();
  const id = useSim((s) => s.selectedPersonId);
  const selectPerson = useSim((s) => s.selectPerson);
  const lang = useSim((s) => s.lang);
  const ps = state.people.find((p) => p.person.id === id);
  return (
    <Drawer open={!!ps} onClose={() => selectPerson(null)} title={ps ? "Person detail" : ""} width={560}>
      {ps && <PersonDetail ps={ps} lang={lang} />}
    </Drawer>
  );
}

function PersonDetail({ ps, lang }: { ps: NonNullable<ReturnType<typeof useScenario>["people"][number]>; lang: "en" | "ar" }) {
  const state = useScenario();
  const { person, impact, message, deliveries, response, escalation, triage } = ps;
  const Icon = CTX[person.context];
  const building = buildingById(person.buildingId);
  const action = impact ? ACTIONS[impact.action] : undefined;
  const ap = impact?.assemblyPointId ? ASSEMBLY_POINTS.find((a) => a.id === impact.assemblyPointId) : undefined;
  const reply = SCRIPT[person.id]?.operatorReply;
  const step = state.step.index;
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Avatar person={person} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[16px] font-semibold">{person.name}</h2>
            <Arabic className="text-[13.5px] text-ink-2">{person.nameAr}</Arabic>
            <StatusPill status={ps.status} pulse />
          </div>
          <div className="text-[12.5px] text-ink-3 mt-0.5 flex items-center gap-1.5">
            <Icon size={12} /> {person.contextNote}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge tone="neutral">{person.language === "ar" ? "Arabic preferred" : "English preferred"}</Badge>
            <Badge tone="neutral">{consentLabel(person)}</Badge>
            {person.accessibility.mobility !== "standard" && (
              <Badge tone="info">
                <Accessibility size={11} /> {person.accessibility.mobility}
              </Badge>
            )}
            {person.accessibility.hearing && (
              <Badge tone="info">
                <Ear size={11} /> hearing
              </Badge>
            )}
            {!person.accessibility.smartphone && (
              <Badge tone="neutral">
                <PhoneOff size={11} /> no smartphone
              </Badge>
            )}
            {person.vulnerableRegistry && <Badge tone="warn">vulnerable registry</Badge>}
          </div>
        </div>
      </div>

      <DistrictMap state={state} compact focusPersonId={person.id} className="h-[180px]" zoom={{ cx: person.location.x, cy: person.location.y, size: 150 }} />

      <div>
        <Kv k="Location" v={<span className="flex items-center gap-1"><MapPin size={12} className="text-ink-3" /> {building ? building.name : `(${person.location.x}, ${person.location.y}) — ${person.context}`}</span>} />
        <Kv k="Preferred channels" v={person.channels.map(channelLabel).join(" · ")} />
        {person.route && <Kv k="Active route" v={`${person.route.join(" → ")}`} mono />}
      </div>

      {impact ? (
        <>
          <PanelDivider label="Why this person is affected" />
          <div className="flex items-center gap-2 mb-2">
            <LayerTag layer="deterministic" long />
            <span className="text-[12.5px] text-ink-2">{impact.reason}</span>
          </div>
          <RuleTraceList rules={impact.rules} />

          {impact.route?.blockedEdgeId && (
            <div className="rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-[12.5px] mt-2">
              <div className="flex items-center gap-2 font-medium mb-1">
                <Route size={13} className="text-brand-2" /> Route engine
              </div>
              <Kv k="Original" v={`${impact.route.originalKm.toFixed(1)} km via Al Majaz Road (blocked)`} />
              {impact.route.alternative ? (
                <>
                  <Kv k="Verified alternative" v={`${impact.route.alternativeKm?.toFixed(1)} km via ${impact.route.viaRoads.join(" → ")}`} />
                  <Kv k="Estimated delay" v={`+${impact.route.delayMinutes} min at feed speed 10 km/h`} />
                </>
              ) : (
                <Kv k="Alternative" v="none — shelter guidance" />
              )}
            </div>
          )}
          {ap && (
            <div className="rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-[12.5px] mt-2">
              <Kv k="Assembly point" v={ap.name} />
              <Kv k="Accessible" v={ap.accessible ? "yes" : "no"} />
            </div>
          )}

          <PanelDivider label="Approved action" />
          {action && (
            <div className="rounded-lg border border-teal/25 bg-teal/[0.06] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold text-teal-2">{action.title}</span>
                <span className="mono text-[11px] text-ink-3">{action.sop}</span>
              </div>
              <div className="text-[12.5px] text-ink-2 mt-1 leading-4.5">{action.summary}</div>
              <Arabic className="text-[13px] text-ink-2 mt-1">{action.titleAr}</Arabic>
            </div>
          )}
        </>
      ) : (
        <div className="text-[12.5px] text-ink-3">Impact analysis has not run yet. Advance the scenario to step 3.</div>
      )}

      {message && (
        <>
          <PanelDivider label="Message" />
          <MessageCard message={message} lang={lang} />
          <AiTracePanel ai={message.ai} />
        </>
      )}

      {step >= 5 && impact?.affected && (
        <>
          <PanelDivider label="Delivery" />
          <DeliveryTrail deliveries={deliveries} />
        </>
      )}

      {response && (
        <>
          <PanelDivider label="Citizen response" />
          <div className="rounded-xl border border-line px-3 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge tone={CATEGORY[response.classification.category].tone}>{CATEGORY[response.classification.category].label}</Badge>
              <span className="mono text-[11px] text-ink-3">{response.at}</span>
              <span className="text-[11px] text-ink-3">via {channelLabel(response.channel)}</span>
              <span className="ml-auto num text-[11.5px] text-ink-3">urgency {response.classification.urgency}/5</span>
            </div>
            {response.lang === "ar" ? <Arabic className="text-[14px] text-ink">{response.text}</Arabic> : <p className="text-[13.5px] text-ink">{response.text}</p>}
            <div className="mt-2 pt-2 border-t border-line text-[12px] text-ink-2 flex items-start gap-2">
              <LayerTag layer="ai" />
              <span>
                {response.classification.summary} · confidence {Math.round(response.classification.confidence * 100)}%
              </span>
            </div>
          </div>
          {reply && step >= 7 && (
            <div className="rounded-xl border border-brand/25 bg-brand/[0.06] px-3 py-3 text-[13px]">
              <div className="flex items-center gap-2 mb-1 text-[11.5px] text-ink-3">
                <span className="font-medium text-brand-2">Operator reply</span>
                <span className="mono">{clockAt(reply.sec)}</span>
                <Badge tone="violet" className="ml-auto">AI draft · approved</Badge>
              </div>
              {lang === "ar" ? <Arabic>{reply.textAr}</Arabic> : <p>{reply.text}</p>}
            </div>
          )}
        </>
      )}

      {escalation.length > 0 && (
        <>
          <PanelDivider label="Escalation" />
          <ol className="space-y-2">
            {escalation.map((e, i) => (
              <li key={i} className="flex gap-3 text-[12.5px]">
                <span className="mono text-[11px] text-ink-4 shrink-0 w-14">{e.at}</span>
                <div>
                  <div className="text-ink">
                    <span className="mono text-[11px] text-teal-2 mr-1.5">{e.rule}</span>
                    {e.action}
                  </div>
                  <div className="text-ink-3">{e.outcome}</div>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {triage && (
        <>
          <PanelDivider label="Triage" />
          <div className="rounded-xl border border-line px-3 py-3 text-[12.5px]">
            <div className="flex items-center gap-2 mb-1.5">
              <ListChecks size={13} className="text-ink-3" />
              <span className="font-medium">Priority {triage.priority}</span>
              <span className="num text-ink-3">score {triage.score}</span>
              <Badge tone={TRIAGE_TONE[triage.status]} className="ml-auto">
                {triage.status.replace("_", " ")}
              </Badge>
            </div>
            <ul className="text-ink-3 space-y-0.5 mb-2">
              {triage.reasons.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
            <div className="text-ink-2 leading-4.5">{triage.recommended}</div>
            {triage.unit && <Kv k="Unit" v={`${triage.unit}${triage.eta ? ` · ETA ${triage.eta}` : ""}`} />}
            {triage.resolution && <Kv k="Outcome" v={triage.resolution} />}
          </div>
        </>
      )}

      {impact && !impact.affected && (
        <div className="rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-[12.5px] text-ink-2">
          No alert issued. Sending a message here would be noise: this person is outside the hazard polygon and has no route conflict. Suppressing unnecessary alerts protects trust in the ones that matter.
        </div>
      )}
    </div>
  );
}
