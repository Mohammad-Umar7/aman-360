import { cn } from "@/lib/utils";
import type { Person } from "@/lib/types";

const HUES = ["from-brand/40 to-brand/10", "from-teal/40 to-teal/10", "from-violet/40 to-violet/10", "from-warn/40 to-warn/10", "from-info/40 to-info/10", "from-safe/40 to-safe/10"];

export function Avatar({ person, size = 32, className }: { person: Person; size?: number; className?: string }) {
  const idx = person.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length;
  return (
    <div
      className={cn("rounded-full bg-gradient-to-br border border-white/10 flex items-center justify-center font-semibold text-ink shrink-0", HUES[idx], className)}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden
    >
      {person.initials}
    </div>
  );
}
