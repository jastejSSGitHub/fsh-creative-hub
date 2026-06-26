"use client";

import type { LucideIcon } from "lucide-react";

import { HubTooltip } from "@/components/ui/hub-tooltip";
import { cn } from "@/lib/utils";

export type HubIconToolbarItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
};

type HubIconToolbarProps = {
  items: HubIconToolbarItem[];
  className?: string;
};

export function HubIconToolbar({ items, className }: HubIconToolbarProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[6px] border border-hub-foreground/10 bg-hub-surface/80 p-0.5",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <HubTooltip key={item.id} label={item.label} side="top">
            <button
              type="button"
              onClick={item.onClick}
              aria-label={item.label}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-[4px] text-hub-foreground/55 transition-colors hover:bg-hub-foreground/[0.06] hover:text-hub-foreground",
                item.active && "bg-hub-foreground/[0.06] text-hub-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
            </button>
          </HubTooltip>
        );
      })}
    </div>
  );
}
