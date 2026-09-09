"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({ value, onChange, options, size = "sm", className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; size?: "xs" | "sm"; className?: string }) {
  return (
    <div className={cn("inline-flex items-center rounded-lg bg-white/[0.05] border border-line p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md font-medium transition-colors whitespace-nowrap",
            size === "xs" ? "px-2 h-6 text-[11.5px]" : "px-2.5 h-7 text-[12.5px]",
            value === o.value ? "bg-white/[0.1] text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" : "text-ink-3 hover:text-ink-2",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Drawer({ open, onClose, title, children, width = 520 }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; width?: number }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="fixed top-0 right-0 bottom-0 z-50 glass border-l border-line flex flex-col shadow-float"
            style={{ width: `min(${width}px, 100vw)` }}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="flex items-center justify-between px-5 h-14 border-b border-line shrink-0">
              <div className="min-w-0 font-semibold text-[14px] truncate">{title}</div>
              <button onClick={onClose} className="h-8 w-8 rounded-md text-ink-3 hover:text-ink hover:bg-white/[0.06] flex items-center justify-center" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 text-ink-3">
      {icon && <div className="mb-3 text-ink-4">{icon}</div>}
      <div className="text-[13.5px] font-medium text-ink-2">{title}</div>
      {hint && <div className="text-[12.5px] mt-1 max-w-[320px]">{hint}</div>}
    </div>
  );
}

export function Kv({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-line last:border-0">
      <span className="text-[12.5px] text-ink-3 shrink-0">{k}</span>
      <span className={cn("text-[13px] text-ink text-right", mono && "mono text-[12.5px]")}>{v}</span>
    </div>
  );
}

export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

export function Arabic({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div dir="rtl" lang="ar" className={cn("font-arabic", className)}>
      {children}
    </div>
  );
}
