import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LayerTag } from "@/components/ui/Badge";
import type { Layer } from "@/lib/types";

interface PanelProps {
  title?: ReactNode;
  eyebrow?: string;
  layer?: Layer;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
  raised?: boolean;
}

export function Panel({ title, eyebrow, layer, actions, children, className, bodyClassName, padded = true, raised }: PanelProps) {
  return (
    <section className={cn(raised ? "panel-raised" : "panel", "flex flex-col min-h-0", className)}>
      {(title || eyebrow || actions) && (
        <header className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2.5 border-b border-line">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-0.5">{eyebrow}</div>}
            {title && (
              <h3 className="text-[13.5px] font-semibold text-ink leading-5 flex items-center gap-2">
                <span className="truncate">{title}</span>
                {layer && <LayerTag layer={layer} />}
              </h3>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn("min-h-0 flex-1", padded && "p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PanelDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="h-px flex-1 bg-line" />
      {label && <span className="eyebrow">{label}</span>}
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}
