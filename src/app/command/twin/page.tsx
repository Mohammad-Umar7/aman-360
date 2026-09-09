"use client";

import dynamic from "next/dynamic";

const DigitalTwin = dynamic(() => import("@/components/twin/DigitalTwin"), { ssr: false });

export default function TwinPage() {
  return (
    <div className="h-full w-full">
      <DigitalTwin hud="full" />
    </div>
  );
}
