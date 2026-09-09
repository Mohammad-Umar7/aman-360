"use client";

import Link from "next/link";
import { Box, Maximize2 } from "lucide-react";
import { AssuranceSummary } from "@/components/overview/AssuranceSummary";
import { SituationView } from "@/components/overview/SituationView";
import { KpiGrid } from "@/components/overview/KpiGrid";
import { LayerActivity } from "@/components/overview/LayerActivity";
import { OperatorQueue } from "@/components/overview/OperatorQueue";
import { ResponseBreakdown } from "@/components/overview/ResponseBreakdown";
import { SpotlightStrip } from "@/components/overview/SpotlightStrip";
import { TimelineFeed } from "@/components/overview/TimelineFeed";
import { PersonDrawer } from "@/components/population/PersonDrawer";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { useScenario } from "@/lib/simulation/store";

export default function OverviewPage() {
  const state = useScenario();
  const step = state.step.index;
  return (
    <div className="p-6 flex flex-col gap-5 min-w-[960px]">
      <KpiGrid kpis={state.kpis} step={step} />

      <div className="grid grid-cols-12 gap-5">
        <Panel
          className="col-span-12 xl:col-span-8 min-h-[520px]"
          title="Al Majaz district — operational map"
          eyebrow="Situation"
          padded={false}
          actions={
            <>
              {state.hazard && (
                <Badge tone="alert" dot pulse>
                  {state.hazard.id} · {state.hazard.severity}
                </Badge>
              )}
              <Link href="/command/twin" className="inline-flex items-center gap-1.5 text-[12px] text-brand-2 hover:underline">
                <Box size={13} /> Open 3D twin <Maximize2 size={11} />
              </Link>
            </>
          }
          bodyClassName="relative"
        >
          <SituationView state={state} />
        </Panel>
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-5 min-h-0">
          <AssuranceSummary state={state} />
          <OperatorQueue items={state.operatorQueue} className="flex-1 min-h-[220px] max-h-[360px]" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <TimelineFeed events={state.timeline} className="col-span-12 xl:col-span-5 h-[440px]" />
        <SpotlightStrip people={state.people} className="col-span-12 md:col-span-6 xl:col-span-3 h-[440px]" />
        <div className="col-span-12 md:col-span-6 xl:col-span-4 flex flex-col gap-4">
          <ResponseBreakdown kpis={state.kpis} />
          <LayerActivity state={state} />
        </div>
      </div>
      <PersonDrawer />
    </div>
  );
}
