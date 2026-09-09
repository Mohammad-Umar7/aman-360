"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, LayoutDashboard, ListChecks, MessageSquareText, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScenario } from "@/lib/simulation/store";
import { BrandMark } from "@/components/shell/BrandMark";

const NAV = [
  { href: "/command", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/command/twin", label: "Digital twin", icon: Box },
  { href: "/command/assurance", label: "Source assurance", icon: ShieldCheck },
  { href: "/command/population", label: "Affected people", icon: Users },
  { href: "/command/composer", label: "Communication", icon: MessageSquareText },
  { href: "/command/triage", label: "Response triage", icon: ListChecks },
];

export function Sidebar() {
  const path = usePathname();
  const state = useScenario();
  const counts: Record<string, number | undefined> = {
    "/command/assurance": state.contradictions.length || undefined,
    "/command/population": state.people.filter((p) => p.impact?.affected).length || undefined,
    "/command/triage": state.triage.filter((t) => t.status !== "resolved").length || undefined,
  };
  return (
    <aside className="w-[248px] shrink-0 h-full flex flex-col border-r border-line bg-bg-1/80">
      <Link href="/" className="h-14 flex items-center gap-3 px-4 border-b border-line hover:bg-white/[0.03]">
        <BrandMark size={28} />
        <div className="leading-tight">
          <div className="text-[14px] font-semibold tracking-tight">AMAN 360</div>
          <div className="text-[11px] text-ink-3">Command platform</div>
        </div>
      </Link>
      <nav className="p-2.5 flex flex-col gap-0.5">
        {NAV.map((n) => {
          const active = n.exact ? path === n.href : path.startsWith(n.href);
          const Icon = n.icon;
          const count = counts[n.href];
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-2.5 h-10 px-3 rounded-lg text-[14px] font-medium transition-colors",
                active ? "bg-brand/15 text-ink shadow-[inset_0_0_0_1px_rgba(79,141,247,0.25)]" : "text-ink-2 hover:text-ink hover:bg-white/[0.05]",
              )}
            >
              <Icon size={16} className={active ? "text-brand-2" : "text-ink-3"} />
              <span className="flex-1">{n.label}</span>
              {count !== undefined && <span className="num text-[11px] px-1.5 h-4.5 rounded-md bg-white/[0.08] text-ink-2 leading-[18px]">{count}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3.5 border-t border-line text-[11.5px] text-ink-3 leading-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-gradient-to-br from-teal/40 to-teal/10 border border-white/10 flex items-center justify-center text-[10.5px] font-semibold text-ink">NH</span>
          <div>
            <div className="text-ink-2 font-medium">N. Al Hammadi</div>
            <div>Duty operator · Shift B</div>
          </div>
        </div>
        <p className="text-ink-4">Prototype. All profiles and locations shown are synthetic.</p>
      </div>
    </aside>
  );
}
