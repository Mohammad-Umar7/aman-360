"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect } from "react";
import { motion } from "motion/react";
import { ArrowRight, Play, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/shell/BrandMark";
import { useSim } from "@/lib/simulation/store";

const DigitalTwin = dynamic(() => import("@/components/twin/DigitalTwin"), { ssr: false });

export function Hero() {
  useEffect(() => {
    const s = useSim.getState();
    s.pause();
    s.setStep(2);
  }, []);
  const enter = () => useSim.getState().reset();
  return (
    <section className="relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-bg-0">
      <div className="absolute inset-0">
        <DigitalTwin hud="none" interactive={false} cameraMode="orbit" labels={false} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_30%,rgba(7,11,18,0.92)_0%,rgba(7,11,18,0.55)_45%,rgba(7,11,18,0.15)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-bg-0 to-transparent" />

      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark size={34} />
          <div className="leading-tight">
            <div className="text-[16px] font-semibold tracking-tight">AMAN 360</div>
            <div className="text-[11.5px] text-ink-3">Emergency Communication Assurance & Response Intelligence</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[13.5px] text-ink-2">
          <a href="#answers" className="hover:text-ink">
            What it answers
          </a>
          <a href="#layers" className="hover:text-ink">
            Two layers
          </a>
          <a href="#demo" className="hover:text-ink">
            Flash-flood demo
          </a>
          <a href="#privacy" className="hover:text-ink">
            Privacy
          </a>
          <Link href="/command" onClick={enter} className="inline-flex items-center gap-2 rounded-lg bg-white/[0.08] border border-white/15 px-3.5 h-9 text-ink hover:bg-white/[0.14]">
            Open command centre <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pt-[8vh]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }} className="max-w-[760px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-[12px] text-teal-2 mb-6">
            <ShieldCheck size={13} /> Government-grade prototype · Flash-flood scenario · Arabic + English
          </div>
          <h1 className="text-[44px] md:text-[62px] font-semibold leading-[1.02] tracking-[-0.02em] text-white">
            The right person.
            <br />
            The right verified action.
            <br />
            <span className="text-ink-2">And what happened next.</span>
          </h1>
          <p className="mt-6 text-[17px] md:text-[19px] leading-relaxed text-ink-2 max-w-[640px]">
            Existing systems detect the emergency. AMAN makes sure the right person receives the right verified action — and tells government what happened next.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/command/twin" onClick={enter} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 h-12 text-[15px] font-medium text-white shadow-[0_0_0_1px_rgba(79,141,247,0.5),0_16px_40px_-12px_rgba(79,141,247,0.7)] hover:bg-[#5f98ff]">
              <Play size={16} /> Run the flash-flood demo
            </Link>
            <Link href="/command" onClick={enter} className="inline-flex items-center gap-2 rounded-xl bg-white/[0.07] border border-white/15 px-5 h-12 text-[15px] font-medium text-ink hover:bg-white/[0.12]">
              Enter the command centre <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-[720px]">
            {[
              { k: "Deterministic", v: "safety decisions", icon: <ShieldCheck size={14} className="text-teal-2" /> },
              { k: "AI", v: "communication only", icon: <Sparkles size={14} className="text-violet-2" /> },
              { k: "6", v: "official sources reconciled" },
              { k: "6", v: "channels, one verified truth" },
            ].map((s) => (
              <div key={s.k + s.v} className="border-l border-white/15 pl-3">
                <div className="flex items-center gap-1.5 text-[20px] font-semibold text-white leading-6">
                  {s.icon}
                  {s.k}
                </div>
                <div className="text-[12.5px] text-ink-3">{s.v}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-[11.5px] text-ink-4">Live 3D digital twin · district, water and flood progression built in Blender · all data synthetic</div>
    </section>
  );
}
