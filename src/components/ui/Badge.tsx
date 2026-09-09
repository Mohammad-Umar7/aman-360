import type { ReactNode } from "react";
import { Cpu, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryStatus, Layer, PersonStatus, ResponseCategory, TriageStatus } from "@/lib/types";

export type Tone = "neutral" | "brand" | "teal" | "violet" | "safe" | "warn" | "alert" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-white/[0.06] text-ink-2 border-white/[0.08]",
  brand: "bg-brand/15 text-brand-2 border-brand/25",
  teal: "bg-teal/15 text-teal-2 border-teal/25",
  violet: "bg-violet/15 text-violet-2 border-violet/25",
  safe: "bg-safe/15 text-[#7fe0a8] border-safe/25",
  warn: "bg-warn/15 text-[#ffd27a] border-warn/25",
  alert: "bg-alert/15 text-[#ff9b96] border-alert/25",
  info: "bg-info/15 text-[#9fd0ff] border-info/25",
};

export const DOT: Record<Tone, string> = {
  neutral: "bg-ink-3",
  brand: "bg-brand",
  teal: "bg-teal",
  violet: "bg-violet",
  safe: "bg-safe",
  warn: "bg-warn",
  alert: "bg-alert",
  info: "bg-info",
};

export function Badge({ tone = "neutral", children, className, dot, pulse }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean; pulse?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium leading-4 whitespace-nowrap", TONES[tone], className)}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", DOT[tone])} />}
          <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", DOT[tone])} />
        </span>
      )}
      {children}
    </span>
  );
}

export function LayerTag({ layer, long }: { layer: Layer; long?: boolean }) {
  if (layer === "deterministic")
    return (
      <Badge tone="teal">
        <ShieldCheck size={11} /> {long ? "Deterministic safety layer" : "Deterministic"}
      </Badge>
    );
  if (layer === "ai")
    return (
      <Badge tone="violet">
        <Sparkles size={11} /> {long ? "AI communication layer" : "AI"}
      </Badge>
    );
  return (
    <Badge tone="neutral">
      <Cpu size={11} /> System
    </Badge>
  );
}

export const PERSON_STATUS: Record<PersonStatus, { label: string; tone: Tone }> = {
  normal: { label: "Normal", tone: "neutral" },
  assessing: { label: "Assessing", tone: "info" },
  affected: { label: "Affected", tone: "warn" },
  message_ready: { label: "Message ready", tone: "violet" },
  sent: { label: "Sent", tone: "info" },
  delivered: { label: "Delivered", tone: "info" },
  read: { label: "Read", tone: "brand" },
  safe: { label: "Confirmed safe", tone: "safe" },
  help: { label: "Needs help", tone: "alert" },
  clarification: { label: "Clarification", tone: "warn" },
  different: { label: "Situation differs", tone: "warn" },
  no_response: { label: "No response", tone: "alert" },
  assistance_assigned: { label: "Unit assigned", tone: "brand" },
  resolved: { label: "Resolved", tone: "safe" },
  no_alert: { label: "No alert", tone: "neutral" },
};

export function StatusPill({ status, pulse }: { status: PersonStatus; pulse?: boolean }) {
  const s = PERSON_STATUS[status];
  return (
    <Badge tone={s.tone} dot pulse={pulse && (status === "help" || status === "no_response")}>
      {s.label}
    </Badge>
  );
}

export const DELIVERY_TONE: Record<DeliveryStatus, Tone> = {
  queued: "neutral",
  sent: "info",
  delivered: "brand",
  read: "teal",
  acknowledged: "safe",
  failed: "alert",
};

export const CATEGORY: Record<ResponseCategory, { label: string; tone: Tone }> = {
  safe: { label: "I'm safe", tone: "safe" },
  help: { label: "I need help", tone: "alert" },
  clarification: { label: "Need clarification", tone: "warn" },
  different: { label: "My situation is different", tone: "violet" },
  none: { label: "No response", tone: "neutral" },
};

export const TRIAGE_TONE: Record<TriageStatus, Tone> = {
  open: "alert",
  assigned: "brand",
  in_progress: "info",
  resolved: "safe",
  monitoring: "neutral",
};

export function SeverityDot({ severity }: { severity: "high" | "medium" | "low" | "none" }) {
  const tone: Tone = severity === "high" ? "alert" : severity === "medium" ? "warn" : severity === "low" ? "info" : "neutral";
  return <span className={cn("inline-block h-2 w-2 rounded-full", DOT[tone])} />;
}
