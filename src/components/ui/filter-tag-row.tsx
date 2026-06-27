"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export type FilterTagItem = {
  id: string;
  label: string;
};

const SLIDE_EASE = [0.4, 0, 0.2, 1] as const;

type FilterTagRowProps = {
  items: FilterTagItem[];
  value: string;
  onChange: (id: string) => void;
  onItemHover?: (id: string) => void;
  onItemFocus?: (id: string) => void;
  className?: string;
  /** Compact uppercase pills — e.g. All / Pending / Approved */
  compact?: boolean;
  /** Shared layout id for the sliding active pill. Must be unique per row on the page. */
  layoutId?: string;
  /** Slide the active pill instead of snapping styles. */
  animated?: boolean;
  "aria-label"?: string;
};

export function FilterTagRow({
  items,
  value,
  onChange,
  onItemHover,
  onItemFocus,
  className,
  compact = false,
  layoutId = "filter-tag-indicator",
  animated = true,
  "aria-label": ariaLabel = "Filter",
}: FilterTagRowProps) {
  const reduceMotion = useReducedMotion();
  const useSlide = animated && !reduceMotion;

  return (
    <div
      className={cn("-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0", className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div className="relative flex min-w-max gap-2 pb-0.5">
        {items.map((item) => {
          const active = item.id === value;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              onMouseEnter={() => onItemHover?.(item.id)}
              onFocus={() => onItemFocus?.(item.id)}
              className={cn(
                "relative shrink-0 rounded-full border font-medium whitespace-nowrap",
                compact
                  ? "min-h-8 px-3 text-[0.6875rem] uppercase tracking-[0.08em]"
                  : "min-h-9 px-3.5 text-sm",
                useSlide
                  ? cn(
                      "transition-colors duration-300 ease-out",
                      active
                        ? "border-transparent bg-transparent text-hub-paper"
                        : "border-hub-foreground/12 bg-hub-surface/90 text-hub-foreground/65 hover:border-hub-foreground/22 hover:bg-hub-surface hover:text-hub-foreground",
                    )
                  : cn(
                      "transition-all duration-200 ease-out",
                      active
                        ? "border-hub-espresso bg-hub-espresso text-hub-paper shadow-[0_1px_2px_rgba(11,11,11,0.12)]"
                        : "border-hub-foreground/12 bg-hub-surface/90 text-hub-foreground/65 hover:border-hub-foreground/22 hover:bg-hub-surface hover:text-hub-foreground",
                    ),
              )}
            >
              {useSlide && active ? (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-full border border-hub-espresso bg-hub-espresso shadow-[0_1px_2px_rgba(11,11,11,0.12)]"
                  transition={{
                    type: "tween",
                    duration: 0.32,
                    ease: SLIDE_EASE,
                  }}
                />
              ) : null}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
