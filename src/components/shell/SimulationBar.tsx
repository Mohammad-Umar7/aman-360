"use client";

import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Waves } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LayerTag } from "@/components/ui/Badge";
import { STEPS, LAST_STEP } from "@/lib/simulation/steps";
import { useSim } from "@/lib/simulation/store";
import { tplus } from "@/lib/format";
import { cn } from "@/lib/utils";

function Progress() {
  const t = useSim((s) => s.t);
  return <div className="absolute left-0 top-0 h-full bg-brand/70 rounded-full transition-[width] duration-100" style={{ width: `${t * 100}%` }} />;
}

export function SimulationBar() {
  const step = useSim((s) => s.step);
  const playing = useSim((s) => s.playing);
  const started = useSim((s) => s.started);
  const { setStep, next, prev, reset, toggle } = useSim();
  const meta = STEPS[step];

  return (
    <div className="shrink-0 border-b border-line bg-bg-1/60 px-5 py-2.5 flex items-center gap-5">
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="xs" onClick={reset} icon={<RotateCcw size={13} />} title="Reset (R)" aria-label="Reset">
          Reset
        </Button>
        <Button variant="ghost" size="xs" onClick={prev} disabled={step === 0} icon={<ChevronLeft size={14} />} aria-label="Previous step" title="Previous (←)" />
        <Button
          variant={!started ? "primary" : playing ? "secondary" : "primary"}
          size="sm"
          onClick={toggle}
          icon={!started ? <Waves size={14} /> : playing ? <Pause size={14} /> : <Play size={14} />}
          className="min-w-[164px]"
          title="Play / pause (Space)"
        >
          {!started ? "Simulate flash flood" : playing ? "Pause" : step >= LAST_STEP ? "Replay" : "Play"}
        </Button>
        <Button variant="ghost" size="xs" onClick={next} disabled={step >= LAST_STEP} icon={<ChevronRight size={14} />} aria-label="Next step" title="Next (→)" />
      </div>

      <ol className="flex-1 flex items-center gap-1 min-w-0" aria-label="Scenario steps">
        {STEPS.map((s) => {
          const state = s.index < step ? "done" : s.index === step ? "current" : "todo";
          return (
            <li key={s.id} className="flex-1 min-w-0">
              <button
                onClick={() => setStep(s.index)}
                className={cn("w-full text-left group", state === "todo" && "opacity-60 hover:opacity-90")}
                title={`${s.index + 1}. ${s.title}`}
              >
                <div className="relative h-1 rounded-full bg-white/[0.08] overflow-hidden">
                  {state === "done" && <div className="absolute inset-0 bg-brand/70 rounded-full" />}
                  {state === "current" && <Progress />}
                </div>
                <div className={cn("mt-1 text-[11px] truncate", state === "current" ? "text-ink font-medium" : "text-ink-3")}>
                  <span className="num text-ink-4 mr-1">{s.index}</span>
                  {s.short}
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="hidden xl:flex items-center gap-3 max-w-[420px] min-w-0">
        <LayerTag layer={meta.layer} />
        <div className="min-w-0">
          <div className="text-[13px] font-medium truncate">
            {meta.title} <span className="mono text-ink-4 text-[11.5px] ml-1">{tplus(meta.offsetSec)}</span>
          </div>
          <div className="text-[11.5px] text-ink-3 truncate">{meta.caption}</div>
        </div>
      </div>
    </div>
  );
}
