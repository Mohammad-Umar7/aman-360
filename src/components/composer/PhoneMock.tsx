"use client";

import { BrandMark } from "@/components/shell/BrandMark";
import type { ChannelVariant, Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

function Frame({ children, time = "14:08", className }: { children: React.ReactNode; time?: string; className?: string }) {
  return (
    <div className={cn("relative mx-auto w-[236px] rounded-[30px] border border-white/15 bg-[#0d1420] p-2 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.04)]", className)}>
      <div className="rounded-[24px] bg-gradient-to-b from-[#121b2b] to-[#0a1019] overflow-hidden h-[430px] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-3 text-[10px] text-ink-2">
          <span className="num font-medium">{time}</span>
          <div className="h-4 w-16 rounded-full bg-black/70 -mt-1" />
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-[2px] border border-ink-2/60" /> 5G
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SmsPhone({ variant, lang, replyChips }: { variant: ChannelVariant; lang: Lang; replyChips?: boolean }) {
  const text = lang === "ar" ? variant.ar : variant.en;
  const rtl = lang === "ar";
  return (
    <Frame>
      <div className="px-4 pt-4 text-center">
        <div className="mx-auto h-9 w-9 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-[11px] font-semibold text-brand-2">A</div>
        <div className="text-[11px] font-medium mt-1">AMAN-UAE</div>
        <div className="text-[9.5px] text-ink-4">Verified government sender</div>
      </div>
      <div className="flex-1 px-3 pt-4 space-y-2">
        <div className="text-center text-[9.5px] text-ink-4">Today 14:07</div>
        <div dir={rtl ? "rtl" : "ltr"} className={cn("max-w-[92%] rounded-2xl rounded-bl-md bg-[#1f2b3f] px-3 py-2 text-[12px] leading-5 text-ink", rtl && "font-arabic ml-auto rounded-bl-2xl rounded-br-md")}>
          {text}
        </div>
        {replyChips && (
          <div className={cn("flex gap-1.5 pt-1", rtl && "justify-end")}>
            {(rtl ? ["بخير", "مساعدة"] : ["SAFE", "HELP"]).map((c) => (
              <span key={c} className={cn("rounded-full border border-brand/40 bg-brand/10 px-2.5 py-0.5 text-[10.5px] text-brand-2", rtl && "font-arabic")}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="px-3 pb-3">
        <div className="h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center px-3 text-[10.5px] text-ink-4">{rtl ? "رسالة نصية" : "Text message"}</div>
      </div>
    </Frame>
  );
}

export function PushPhone({ variant, lang }: { variant: ChannelVariant; lang: Lang }) {
  const rtl = lang === "ar";
  const title = rtl ? variant.titleAr : variant.title;
  const body = rtl ? variant.ar : variant.en;
  const cta = rtl ? variant.ctaAr : variant.cta;
  return (
    <Frame time="14:08">
      <div className="text-center pt-8">
        <div className="num text-[44px] font-light leading-none text-ink">14:08</div>
        <div className="text-[10.5px] text-ink-3 mt-1">Tuesday, 9 September</div>
      </div>
      <div className="px-3 pt-6">
        <div dir={rtl ? "rtl" : "ltr"} className={cn("rounded-2xl bg-[#1a2437]/95 border border-white/10 p-3 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)]", rtl && "font-arabic")}>
          <div className="flex items-center gap-2 mb-1.5">
            <BrandMark size={16} />
            <span className="text-[10px] font-semibold text-ink-2 uppercase tracking-wide">AMAN</span>
            <span className="text-[9.5px] text-alert ml-auto font-medium">{rtl ? "تنبيه حرج" : "CRITICAL ALERT"}</span>
          </div>
          <div className="text-[12px] font-semibold text-ink leading-4.5">{title}</div>
          <div className="text-[11.5px] text-ink-2 leading-4.5 mt-1">{body}</div>
          {cta && (
            <div className="grid grid-cols-2 gap-1.5 mt-2.5">
              {cta.map((c, i) => (
                <span key={c} className={cn("rounded-lg px-2 py-1.5 text-center text-[10.5px] font-medium", i === 0 ? "bg-brand text-white" : "bg-white/[0.08] text-ink")}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-auto pb-3 flex justify-center">
        <div className="h-1 w-24 rounded-full bg-white/20" />
      </div>
    </Frame>
  );
}
