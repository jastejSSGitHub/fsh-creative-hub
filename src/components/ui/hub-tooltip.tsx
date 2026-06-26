"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type HubTooltipProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function HubTooltip({ label, children, className }: HubTooltipProps) {
  return (
    <span className={cn("group/hub-tooltip relative inline-block", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-50 mt-2.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-[6px] border border-hub-espresso/12 bg-hub-espresso px-2.5 py-1.5 text-[0.6875rem] font-medium tracking-tight text-hub-paper opacity-0 shadow-[0_8px_24px_rgba(11,11,11,0.22)] transition-[opacity,transform] duration-150 delay-200 group-hover/hub-tooltip:translate-y-0 group-hover/hub-tooltip:opacity-100 group-focus-within/hub-tooltip:translate-y-0 group-focus-within/hub-tooltip:opacity-100"
      >
        <span
          aria-hidden
          className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-t border-l border-hub-espresso/12 bg-hub-espresso"
        />
        {label}
      </span>
    </span>
  );
}
