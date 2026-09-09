"use client";

import { MessageSquare, Phone, Smartphone } from "lucide-react";
import { Badge, DELIVERY_TONE } from "@/components/ui/Badge";
import type { Channel, DeliveryRecord } from "@/lib/types";

const ICON: Partial<Record<Channel, React.ComponentType<{ size?: number; className?: string }>>> = { sms: MessageSquare, app: Smartphone, voice: Phone };
const LABEL: Record<Channel, string> = { sms: "SMS", app: "App push", voice: "Voice call", web: "Website", signage: "Signage", operator: "Call centre" };

export function DeliveryTrail({ deliveries }: { deliveries: DeliveryRecord[] }) {
  const byChannel = new Map<Channel, DeliveryRecord[]>();
  for (const d of deliveries) byChannel.set(d.channel, [...(byChannel.get(d.channel) ?? []), d]);
  if (byChannel.size === 0) return <div className="text-[12px] text-ink-3">No deliveries yet.</div>;
  return (
    <div className="space-y-2.5">
      {Array.from(byChannel.entries()).map(([ch, recs]) => {
        const Icon = ICON[ch] ?? MessageSquare;
        const last = recs[recs.length - 1];
        return (
          <div key={ch} className="rounded-lg border border-line bg-white/[0.02] px-3 py-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={13} className="text-ink-3" />
              <span className="text-[12px] font-medium">{LABEL[ch]}</span>
              <Badge tone={DELIVERY_TONE[last.status]} className="ml-auto">
                {last.status === "failed" ? "no answer" : last.status}
              </Badge>
            </div>
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {recs.map((r, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px]">
                  {i > 0 && <span className="text-ink-4">→</span>}
                  <span className="mono text-ink-4">{r.at}</span>
                  <span className={r.status === "failed" ? "text-alert" : r.status === "acknowledged" ? "text-safe" : "text-ink-2"}>
                    {r.status === "failed" ? `attempt ${r.attempt} no answer` : r.status}
                    {r.status === "delivered" && r.latencyMs ? <span className="text-ink-4"> · {(r.latencyMs / 1000).toFixed(1)}s</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
