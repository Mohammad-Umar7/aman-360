"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "teal";
type Size = "xs" | "sm" | "md" | "lg";

const V: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-[#5f98ff] shadow-[0_0_0_1px_rgba(79,141,247,0.4),0_8px_24px_-8px_rgba(79,141,247,0.6)]",
  secondary: "bg-white/[0.06] text-ink border border-line-strong hover:bg-white/[0.1]",
  ghost: "text-ink-2 hover:text-ink hover:bg-white/[0.06]",
  danger: "bg-alert/90 text-white hover:bg-alert",
  teal: "bg-teal text-[#04201c] hover:bg-teal-2",
};

const S: Record<Size, string> = {
  xs: "h-7 px-2 text-[12px] gap-1 rounded-md",
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-9.5 px-4 text-[13.5px] gap-2 rounded-lg",
  lg: "h-11 px-5 text-[14px] gap-2 rounded-xl",
};

export function Button({
  variant = "secondary",
  size = "sm",
  className,
  children,
  icon,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none",
        V[variant],
        S[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
