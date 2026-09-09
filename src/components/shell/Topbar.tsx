"use client";

import { Activity, Languages, Radio } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Segmented } from "@/components/ui/Misc";
import { INCIDENT_DATE } from "@/lib/format";
import { useScenario, useSim } from "@/lib/simulation/store";
import { overallAssurance } from "@/lib/simulation/scenario";

const STATUS: Record<string, { label: string; tone: Tone }> = {
  normal: { label: "All systems nominal", tone: "safe" },
  monitoring: { label: "Hazard feeds arriving", tone: "warn" },
  active: { label: "Incident active", tone: "alert" },
  response: { label: "Response in progress", tone: "brand" },
  stabilising: { label: "Stabilising", tone: "teal" },
};

export function Topbar() {
  const state = useScenario();
  const lang = useSim((s) => s.lang);
  const setLang = useSim((s) => s.setLang);
  const st = STATUS[state.incidentStatus];
  const assurance = overallAssurance(state);
  return (
    <header className="h-14 shrink-0 flex items-center gap-4 px-5 border-b border-line bg-bg-1/70">
      <div className="min-w-0 flex items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold truncate">{state.hazard ? state.hazard.name : "No active incident"}</span>
            {state.hazard && (
              <Badge tone="neutral" className="mono">
                {state.hazard.id}
              </Badge>
            )}
          </div>
          <div className="text-[11.5px] text-ink-3 truncate">Al Majaz district · Sharjah (synthetic) · {INCIDENT_DATE}</div>
        </div>
        <Badge tone={st.tone} dot pulse={state.incidentStatus === "active"}>
          {st.label}
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 text-[12px] text-ink-3">
          <Radio size={13} className="text-safe" />
          <span>Feeds 6/6</span>
          <span className="text-ink-4">·</span>
          <Activity size={13} className={state.facts.length ? "text-teal" : "text-ink-4"} />
          <span>Assurance {state.facts.length ? `${Math.round(assurance * 100)}%` : "—"}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-ink-3">
          <Languages size={14} />
          <Segmented
            size="xs"
            value={lang}
            onChange={setLang}
            options={[
              { value: "en", label: "EN" },
              { value: "ar", label: "AR" },
            ]}
          />
        </div>
        <div className="mono text-[13.5px] text-ink tabular-nums bg-white/[0.04] border border-line rounded-lg px-2.5 h-8 flex items-center gap-2">
          <span className="text-ink-4 text-[11px] font-sans">GST</span>
          {state.clock}
        </div>
      </div>
    </header>
  );
}
