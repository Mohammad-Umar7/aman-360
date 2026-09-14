"use client";

import dynamic from "next/dynamic";
import { PersonDrawer } from "@/components/population/PersonDrawer";

const DigitalTwin = dynamic(() => import("@/components/twin/DigitalTwin"), { ssr: false });

export default function TwinPage() {
  return (
    <div className="h-full w-full">
      <DigitalTwin hud="full" />
      {/* The route owns the drawer: the overview page renders its own, so the HUD must not add a second one. */}
      <PersonDrawer />
    </div>
  );
}
