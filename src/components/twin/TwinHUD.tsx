"use client";

import { AnimatePresence, motion } from "motion/react";
import { Camera, Info } from "lucide-react";
import { Segmented } from "@/components/ui/Misc";
import { LayerTag } from "@/components/ui/Badge";
import { PersonDrawer } from "@/components/population/PersonDrawer";
import { fmtInt } from "@/lib/format";
import { useScenario, useSim, type CameraPreset } from "@/lib/simulation/store";
import { cn } from "@/lib/utils";

function caption(step: number, t: number): { title: string; sub: string } {
  switch (step) {
    case 0:
      return { title: "Al Majaz district · normal operations", sub: "All feeds nominal. Registered residents and road users go about their day." };
    case 1:
      if (t < 0.4) return { title: "Convective rain begins", sub: "NCM orange alert: 40–60 mm/h over Sharjah central districts." };
      if (t < 0.75) return { title: "Water accumulating in the underpass", sub: "Drainage sensor UP-07 at capacity · municipality GIS activates hazard polygon FZ-0912." };
      return { title: "Police close the underpass", sub: "Patrol 4-12 deploys barriers · closure feed received." };
    case 2:
      return t < 0.5 ? { title: "Sources disagree", sub: "Public portal still says OPEN · Police Operations say CLOSED." } : { title: "Verified: Al Majaz underpass CLOSED", sub: "Resolved through the approved source hierarchy · assurance 98%." };
    case 3:
      return { title: "Who is actually affected?", sub: "Ahmed's route crosses the closure · Fatima, Sara and Yusuf are inside FZ-0912 · Omar is not affected." };
    case 4:
      return { title: "Approved actions become personal instructions", sub: "Ahmed rerouted via King Faisal Street (+6 min) · shelter guidance for residents · accessible assistance for Sara." };
    case 5:
      return { title: "One verified truth on every channel", sub: "App, SMS, voice, website, call centre and the VMS-07 sign carry the same statement." };
    case 6:
      return { title: "Residents respond", sub: "Safe confirmations arrive · Sara requests assistance · Layla's situation differs · Yusuf is silent." };
    case 7:
      return { title: "Triage and dispatch", sub: "Accessible ambulance A-07 sent to Building C · welfare check for Tower B · questions answered." };
    default:
      return { title: "Operational picture", sub: "Government knows who was reached, who is safe, and who still needs help." };
  }
}

function Caption() {
  const step = useSim((s) => s.step);
  const t = useSim((s) => s.t);
  const c = caption(step, Math.round(t * 4) / 4);
  return (
    <AnimatePresence mode="wait">
      <motion.div key={c.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }} className="max-w-[560px]">
        <div className="text-[18px] font-semibold tracking-tight leading-6 text-white drop-shadow">{c.title}</div>
        <div className="text-[13px] text-ink-2 leading-4.5 mt-0.5 drop-shadow">{c.sub}</div>
      </motion.div>
    </AnimatePresence>
  );
}

const CAMS: { value: CameraPreset; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "overview", label: "Overview" },
  { value: "underpass", label: "Underpass" },
  { value: "residence", label: "Residences" },
  { value: "hospital", label: "Hospital" },
  { value: "follow", label: "Follow" },
];

export function TwinHUD({ compact }: { compact?: boolean }) {
  const state = useScenario();
  const camera = useSim((s) => s.camera);
  const setCamera = useSim((s) => s.setCamera);
  const k = state.kpis;
  const step = state.step.index;
  return (
    <>
      <div className={cn("pointer-events-none absolute inset-0 z-10 flex flex-col justify-between", compact ? "p-3" : "p-5")}>
        <div className={cn("flex items-start gap-4", compact ? "justify-end" : "justify-between")}>
          {!compact && (
            <div className="pointer-events-auto glass rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="mt-0.5">
                <LayerTag layer={state.step.layer} />
              </div>
              <Caption />
            </div>
          )}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="glass rounded-lg px-2 py-1 flex items-center gap-2">
              <Camera size={13} className="text-ink-3" />
              <Segmented size="xs" value={camera} onChange={setCamera} options={compact ? CAMS.filter((c) => ["auto", "overview", "follow"].includes(c.value)) : CAMS} />
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          {compact && (
            <div className="pointer-events-auto glass rounded-xl px-4 py-2.5 flex items-start gap-3 max-w-[70%]">
              <div className="mt-0.5">
                <LayerTag layer={state.step.layer} />
              </div>
              <Caption />
            </div>
          )}
          <div className={cn("pointer-events-auto flex gap-2", compact && "hidden")}>
            {[
              { label: "Affected", value: k.affected, tone: "#f2b544" },
              { label: "Reached", value: k.reached, tone: "#4f8df7" },
              { label: "Safe", value: k.safe, tone: "#34c77b" },
              { label: "Help", value: k.help, tone: "#f0554f" },
              { label: "Silent", value: k.noResponse, tone: "#8b99ad" },
            ].map((x) => (
              <div key={x.label} className="glass rounded-lg px-3 py-2 min-w-[86px]">
                <div className="text-[10.5px] uppercase tracking-wider text-ink-3">{x.label}</div>
                <div className="num text-[18px] font-semibold leading-6" style={{ color: x.value ? x.tone : "#6f7e94" }}>
                  {fmtInt(x.value)}
                </div>
              </div>
            ))}
          </div>
          {!compact && (
            <div className="pointer-events-auto glass rounded-lg px-3 py-2 text-[11px] text-ink-2 flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 border-t-2 border-dashed border-[#ff6b63]" /> Hazard polygon
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 border-t-2 border-[#4f8df7]" /> Verified route
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rotate-45 bg-teal" /> Assembly point
              </span>
              <span className="flex items-center gap-1.5 text-ink-4">
                <Info size={11} /> Drag to orbit · scroll to zoom · {step === 0 ? "press Space to start" : "keys 0–8 jump to steps"}
              </span>
            </div>
          )}
        </div>
      </div>
      <PersonDrawer />
    </>
  );
}
