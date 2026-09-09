"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Box, Map as MapIcon } from "lucide-react";
import { DistrictMap } from "@/components/map/DistrictMap";
import { Segmented } from "@/components/ui/Misc";
import { useSim } from "@/lib/simulation/store";
import type { ScenarioState } from "@/lib/types";

const DigitalTwin = dynamic(() => import("@/components/twin/DigitalTwin"), { ssr: false });

export function SituationView({ state }: { state: ScenarioState }) {
  const [mode, setMode] = useState<"3d" | "2d">("3d");
  const selectPerson = useSim((s) => s.selectPerson);
  return (
    <div className="absolute inset-0">
      {mode === "3d" ? <DigitalTwin hud="compact" className="absolute inset-0 rounded-b-[13px]" /> : <DistrictMap state={state} className="absolute inset-3 rounded-[10px]" onSelectPerson={selectPerson} />}
      <div className="absolute left-3 top-3 z-20">
        <Segmented
          size="xs"
          value={mode}
          onChange={setMode}
          options={[
            {
              value: "3d",
              label: (
                <span className="flex items-center gap-1">
                  <Box size={12} /> 3D twin
                </span>
              ),
            },
            {
              value: "2d",
              label: (
                <span className="flex items-center gap-1">
                  <MapIcon size={12} /> Map
                </span>
              ),
            },
          ]}
          className="glass"
        />
      </div>
    </div>
  );
}
