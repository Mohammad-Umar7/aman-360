"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Globe, ShieldCheck, XCircle } from "lucide-react";
import { OperatorScript, SignageMock, VoiceScript, WebNotice } from "@/components/composer/ChannelMocks";
import { PushPhone, SmsPhone } from "@/components/composer/PhoneMock";
import { AiTracePanel, MessageCard } from "@/components/population/MessageCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, LayerTag } from "@/components/ui/Badge";
import { EmptyState, Segmented } from "@/components/ui/Misc";
import { Panel } from "@/components/ui/Panel";
import { publicVariants } from "@/lib/ai/personalize";
import { ACTIONS } from "@/lib/data/sop";
import { sourceById } from "@/lib/data/sources";
import { checkChannels } from "@/lib/engine/consistency";
import { useScenario, useSim } from "@/lib/simulation/store";
import { cn } from "@/lib/utils";

export default function ComposerPage() {
  const state = useScenario();
  const lang = useSim((s) => s.lang);
  const setLang = useSim((s) => s.setLang);
  const [sel, setSel] = useState<string>("ahmed");
  const step = state.step.index;
  const recipients = state.people.filter((p) => p.message).sort((a, b) => Number(b.person.spotlight) - Number(a.person.spotlight));
  const selected = recipients.find((p) => p.person.id === sel) ?? recipients[0];
  const isPublic = sel === "public";
  const road = state.facts.find((f) => f.subject === "road:al-majaz-underpass");
  const pub = useMemo(() => publicVariants(state.facts), [state.facts]);

  const variants = isPublic ? pub : (selected?.message?.variants ?? []);
  const checks = useMemo(() => (variants.length && state.facts.length ? checkChannels(variants, state.facts, state.clock, { webStale: step < 5 }) : []), [variants, state.facts, state.clock, step]);

  if (step < 4) {
    return (
      <div className="p-5 min-w-[1100px]">
        <Panel title="Communication composer" eyebrow="One truth, many channels" layer="ai" className="min-h-[520px]">
          <EmptyState icon={<ShieldCheck size={26} />} title={step < 2 ? "Waiting for a verified statement" : step < 3 ? "Verified statement ready — impact analysis pending" : "Impact set ready — messages are composed at step 4"} hint="Messages are only generated from verified facts and approved actions. Advance the scenario to see the composer at work." />
        </Panel>
      </div>
    );
  }

  return (
    <div className="p-5 flex flex-col gap-4 min-w-[1100px]">
      {road && (
        <div className="panel px-4 py-3 flex items-center gap-4">
          <LayerTag layer="deterministic" long />
          <div className="min-w-0">
            <div className="eyebrow">Verified statement · single source of truth</div>
            <div className="text-[14px] font-semibold truncate">
              {road.label}: <span className="text-teal-2">{road.value}</span>
              <span className="text-ink-3 font-normal text-[12px] ml-2">
                {sourceById(road.sourceId).org} · {road.verifiedAt} · assurance {Math.round(road.assurance * 100)}%
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[11.5px] text-ink-3">Preview language</span>
            <Segmented
              size="xs"
              value={lang}
              onChange={setLang}
              options={[
                { value: "en", label: "English" },
                { value: "ar", label: "العربية" },
              ]}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Recipients" eyebrow="Composed messages" className="col-span-12 xl:col-span-3" padded={false}>
          <ul className="divide-y divide-line">
            {recipients.map((ps) => {
              const a = ACTIONS[ps.impact!.action];
              const active = !isPublic && selected?.person.id === ps.person.id;
              return (
                <li key={ps.person.id}>
                  <button onClick={() => setSel(ps.person.id)} className={cn("w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors", active ? "bg-brand/10" : "hover:bg-white/[0.03]")}>
                    <Avatar person={ps.person} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-medium truncate">{ps.person.name}</div>
                      <div className="text-[11px] text-ink-3 truncate">{a.title}</div>
                    </div>
                    {ps.message?.approval === "operator" && <Badge tone="warn">review</Badge>}
                  </button>
                </li>
              );
            })}
            <li>
              <button onClick={() => setSel("public")} className={cn("w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors", isPublic ? "bg-brand/10" : "hover:bg-white/[0.03]")}>
                <span className="h-7 w-7 rounded-full bg-brand/15 border border-brand/25 flex items-center justify-center text-brand-2">
                  <Globe size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium">Public channels</div>
                  <div className="text-[11px] text-ink-3">Portal banner · VMS-07 signage</div>
                </div>
              </button>
            </li>
          </ul>
        </Panel>

        <div className="col-span-12 xl:col-span-6 flex flex-col gap-4">
          {!isPublic && selected?.message && (
            <Panel title={`Core message · ${selected.person.name}`} eyebrow="Adapted by the AI layer from the approved action" layer="ai">
              <MessageCard message={selected.message} lang={lang} />
            </Panel>
          )}
          <Panel title={isPublic ? "Public channel previews" : "Channel previews"} eyebrow="Same facts, adapted to each channel" padded={false} bodyClassName="p-4">
            {isPublic ? (
              <div className="grid grid-cols-1 gap-4">
                <WebNotice variant={pub[0]} lang={lang} stale={step < 5} />
                <SignageMock variant={pub[1]} lang={lang} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {variants.find((v) => v.channel === "sms") && <SmsPhone variant={variants.find((v) => v.channel === "sms")!} lang={lang} replyChips={selected?.impact?.action !== "REROUTE"} />}
                {variants.find((v) => v.channel === "app") && <PushPhone variant={variants.find((v) => v.channel === "app")!} lang={lang} />}
                {variants.find((v) => v.channel === "voice") && (
                  <div className="lg:col-span-2">
                    <VoiceScript variant={variants.find((v) => v.channel === "voice")!} lang={lang} />
                  </div>
                )}
                {variants.find((v) => v.channel === "operator") && (
                  <div className="lg:col-span-2">
                    <OperatorScript variant={variants.find((v) => v.channel === "operator")!} lang={lang} />
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>

        <div className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          <Panel title="Consistency check" eyebrow="Deterministic" layer="deterministic" padded={false}>
            <ul className="divide-y divide-line">
              {checks.map((c) => (
                <li key={c.channel} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-medium">{c.label}</span>
                    {c.consistent ? (
                      <Badge tone="safe" className="ml-auto">
                        <CheckCircle2 size={11} /> pass
                      </Badge>
                    ) : (
                      <Badge tone="alert" className="ml-auto">
                        <XCircle size={11} /> fail
                      </Badge>
                    )}
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {c.checks.map((k) => (
                      <li key={k.name} className="flex items-center gap-1.5 text-[11px] text-ink-3">
                        <span className={cn("h-1.5 w-1.5 rounded-full", k.pass ? "bg-safe" : "bg-alert")} />
                        {k.name}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="px-4 py-2.5 text-[11px] text-ink-4 border-t border-line">Every variant is checked for the verified road, the verified status, absence of contradiction, Arabic–English parity and channel limits.</p>
          </Panel>
          {!isPublic && selected?.message && <AiTracePanel ai={selected.message.ai} />}
          {isPublic && (
            <Panel title="Publication" eyebrow="Status">
              <ul className="text-[12px] space-y-1.5 text-ink-2">
                <li className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", step >= 5 ? "bg-safe" : "bg-warn")} /> Portal banner {step >= 5 ? "live since 14:08:00" : "prepared — stale page still visible"}
                </li>
                <li className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", step >= 5 ? "bg-safe" : "bg-ink-4")} /> VMS-07 {step >= 5 ? "updated 14:08:00" : "queued"}
                </li>
                <li className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", step >= 8 ? "bg-safe" : "bg-warn")} /> Stale roadworks page {step >= 8 ? "corrected by web team 14:33" : "flagged for correction"}
                </li>
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
