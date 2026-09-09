"use client";

import { ShieldCheck, Sparkles, Lock } from "lucide-react";
import { MODEL } from "@/lib/ai/provider";

export function StatusBar() {
  return (
    <footer className="h-7 shrink-0 border-t border-line bg-bg-1/80 px-5 flex items-center gap-5 text-[10.5px] text-ink-3">
      <span className="flex items-center gap-1.5">
        <ShieldCheck size={11} className="text-teal" /> Deterministic safety layer · rule set SOP-FF-03 v4.1
      </span>
      <span className="flex items-center gap-1.5">
        <Sparkles size={11} className="text-violet" /> AI communication layer · {MODEL.id} ({MODEL.simulated ? "simulated" : "live"})
      </span>
      <span className="flex items-center gap-1.5">
        <Lock size={11} /> Institutional and consented data only · no individual tracking
      </span>
      <span className="ml-auto text-ink-4">Prototype figures are illustrative, not validated claims.</span>
    </footer>
  );
}
