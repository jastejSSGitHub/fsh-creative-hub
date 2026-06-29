"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PhaseIndicatorProps = {
  count: number;
  activeIndex: number;
};

export function WorkflowPhaseIndicator({
  count,
  activeIndex,
}: PhaseIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className={cn(
            "h-1 rounded-full transition-colors",
            activeIndex === i ? "w-6 bg-hub-accent" : "w-3 bg-hub-foreground/15",
          )}
          layout
        />
      ))}
    </div>
  );
}

type WorkflowIllustrationShellProps = {
  phaseCount: number;
  activePhaseIndex: number;
  phaseLabel: string;
  children: ReactNode;
};

export function WorkflowIllustrationShell({
  phaseCount,
  activePhaseIndex,
  phaseLabel,
  children,
}: WorkflowIllustrationShellProps) {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-lg border border-hub-foreground/10 bg-gradient-to-b from-white to-hub-paper shadow-[0_16px_48px_rgba(11,11,11,0.06)]"
    >
      <div className="flex items-center justify-between border-b border-hub-foreground/8 bg-hub-foreground/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="size-2 rounded-full bg-hub-foreground/15" />
            <span className="size-2 rounded-full bg-hub-foreground/15" />
            <span className="size-2 rounded-full bg-hub-foreground/15" />
          </div>
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-hub-foreground/35">
            FSH Creative Hub
          </span>
        </div>
        <WorkflowPhaseIndicator
          count={phaseCount}
          activeIndex={activePhaseIndex}
        />
      </div>

      <div className="relative z-10 h-[13rem] overflow-hidden sm:h-[14rem]">
        {children}
      </div>

      <div className="relative z-0 border-t border-hub-foreground/8 bg-hub-paper px-4 py-2">
        <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-hub-foreground/40">
          {phaseLabel}
        </p>
      </div>
    </div>
  );
}

export const workflowTitleClass =
  "text-[0.7rem] font-semibold text-hub-foreground";

type WorkflowStackedRowsProps = {
  children: ReactNode;
  /** Show a soft fade at the bottom when content stacks (e.g. peeking third row). */
  fadeBottom?: boolean;
  className?: string;
};

/** Vertical list area with optional bottom fade for stacked feed-style rows. */
export function WorkflowStackedRows({
  children,
  fadeBottom = false,
  className,
}: WorkflowStackedRowsProps) {
  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <div className="space-y-1.5">{children}</div>
      {fadeBottom ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-hub-paper via-hub-paper/90 to-transparent"
        />
      ) : null}
    </div>
  );
}

type WorkflowSkeletonRowProps = {
  badge: string;
  badgeClass: string;
  className?: string;
};

/** Peek row: skeleton lines + fade so focus stays on the rows above. */
export function WorkflowSkeletonRow({
  badge,
  badgeClass,
  className,
}: WorkflowSkeletonRowProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-hub-foreground/8 bg-hub-surface/80 px-2.5 py-2 shadow-sm",
        "rounded-sm",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block rounded px-1.5 py-px font-mono text-[0.4rem] font-semibold uppercase tracking-wide opacity-70",
          badgeClass,
        )}
      >
        {badge}
      </span>
      <div className="mt-1.5 h-2 w-[72%] animate-pulse rounded-sm bg-hub-foreground/10" />
      <div className="mt-1 h-1.5 w-[48%] animate-pulse rounded-sm bg-hub-foreground/[0.06]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-hub-paper"
      />
    </div>
  );
}
