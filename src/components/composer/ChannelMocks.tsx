"use client";

import { Globe, Headset, Phone, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/shell/BrandMark";
import type { ChannelVariant, Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VoiceScript({ variant, lang }: { variant: ChannelVariant; lang: Lang }) {
  const rtl = lang === "ar";
  const text = rtl ? variant.ar : variant.en;
  return (
    <div className="rounded-xl border border-line bg-[#0d1420] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-white/[0.03]">
        <Phone size={13} className="text-ink-3" />
        <span className="text-[12px] font-medium">Automated voice call · IVR</span>
        <span className="ml-auto text-[10.5px] text-ink-4">{variant.meta}</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-end gap-[3px] h-8 mb-3" aria-hidden>
          {Array.from({ length: 42 }).map((_, i) => (
            <span key={i} className="w-[3px] rounded-full bg-brand/60" style={{ height: `${25 + 55 * Math.abs(Math.sin(i * 0.9)) * Math.abs(Math.cos(i * 0.37))}%` }} />
          ))}
        </div>
        <p dir={rtl ? "rtl" : "ltr"} className={cn("text-[12.5px] leading-6 text-ink", rtl && "font-arabic text-[13.5px]")}>
          {text}
        </p>
        <div className="mt-3 flex gap-1.5">
          {["1 · Safe", "2 · Help", "9 · Repeat"].map((k) => (
            <span key={k} className="mono rounded-md border border-line bg-white/[0.04] px-2 py-0.5 text-[10.5px] text-ink-2">
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OperatorScript({ variant, lang }: { variant: ChannelVariant; lang: Lang }) {
  const rtl = lang === "ar";
  const lines = (rtl ? variant.ar : variant.en).split("\n");
  return (
    <div className="rounded-xl border border-line bg-[#0d1420] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-white/[0.03]">
        <Headset size={13} className="text-ink-3" />
        <span className="text-[12px] font-medium">Call-centre script · 800-AMAN</span>
        <span className="ml-auto text-[10.5px] text-ink-4">agent desktop</span>
      </div>
      <ol dir={rtl ? "rtl" : "ltr"} className={cn("px-4 py-3 space-y-2", rtl && "font-arabic")}>
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2.5 text-[12.5px] leading-5 text-ink">
            <span className="num shrink-0 h-5 w-5 rounded-md bg-white/[0.06] text-ink-3 text-[10.5px] flex items-center justify-center">{i + 1}</span>
            <span>{l.replace(/^\d+\.\s*/, "")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function WebNotice({ variant, lang, stale }: { variant: ChannelVariant; lang: Lang; stale?: boolean }) {
  const rtl = lang === "ar";
  return (
    <div className="rounded-xl border border-line bg-[#f4f6fa] text-[#111827] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-black/10">
        <Globe size={13} className="text-[#1c4e9c]" />
        <span className="text-[11px] font-semibold text-[#1c4e9c]">Sharjah Municipality · Roads & closures</span>
        <span className="ml-auto text-[10px] text-[#6b7280]">portal.sharjah.gov (synthetic)</span>
      </div>
      <div className="p-3">
        {stale ? (
          <div className="rounded-lg border border-[#d1d5db] bg-white px-3 py-2.5 text-[12px]">
            <div className="font-semibold">Al Majaz Road: OPEN — no planned works</div>
            <div className="text-[10.5px] text-[#6b7280] mt-0.5">Last updated 26 Aug 2026 · flagged for correction by AMAN</div>
          </div>
        ) : (
          <div dir={rtl ? "rtl" : "ltr"} className={cn("rounded-lg border-l-4 border-[#c8322b] bg-white px-3 py-2.5 shadow-sm", rtl && "font-arabic border-l-0 border-r-4")}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#c8322b]">
              <ShieldCheck size={11} /> {rtl ? "إشعار موثّق" : "Verified notice"}
            </div>
            <div className="text-[13px] font-semibold mt-1">{rtl ? variant.titleAr : variant.title}</div>
            <p className="text-[12px] leading-5 mt-1 text-[#374151]">{rtl ? variant.ar : variant.en}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SignageMock({ variant, lang }: { variant: ChannelVariant; lang: Lang }) {
  const rtl = lang === "ar";
  const lines = (rtl ? variant.ar : variant.en).split("\n");
  return (
    <div className="rounded-xl border border-line bg-[#0d1420] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-white/[0.03]">
        <BrandMark size={14} />
        <span className="text-[12px] font-medium">Digital signage · VMS-07</span>
        <span className="ml-auto text-[10.5px] text-ink-4">{variant.meta}</span>
      </div>
      <div className="p-4">
        <div className="rounded-lg border-[6px] border-[#2a2f36] bg-[#07090d] px-4 py-4 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)", backgroundSize: "6px 6px" }}>
          {lines.map((l) => (
            <div key={l} dir={rtl ? "rtl" : "ltr"} className={cn("text-center text-[19px] font-bold tracking-[0.12em] text-[#ffb347] leading-8", rtl ? "font-arabic tracking-normal" : "mono")} style={{ textShadow: "0 0 12px rgba(255,179,71,0.75)" }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
