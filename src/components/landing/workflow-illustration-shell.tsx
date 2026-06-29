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

export const workflowRowCardClass =
  "rounded-sm border border-hub-foreground/10 bg-hub-surface px-2.5 py-1.5 shadow-sm";

type WorkflowStackedRowsProps = {
  children: ReactNode;
  /** Faded third row — clipped and dissolved, not hard-cut. */
  peek?: ReactNode;
  className?: string;
};

/**
 * Two primary rows plus an optional peek row that fades out smoothly
 * (no harsh mid-card clip).
 */
export function WorkflowStackedRows({
  children,
  peek,
  className,
}: WorkflowStackedRowsProps) {
  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      <div className="space-y-1.5">{children}</div>
      {peek ? <WorkflowPeekSlot>{peek}</WorkflowPeekSlot> : null}
    </div>
  );
}

function WorkflowPeekSlot({ children }: { children: ReactNode }) {
  return (
    <div className="relative mt-1.5 h-[2.4rem] shrink-0 overflow-hidden">
      <div className="opacity-[0.38] saturate-[0.9]">{children}</div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-white/55 to-white"
      />
    </div>
  );
}

type WorkflowPeekRowProps = {
  badge: string;
  badgeClass: string;
  title: string;
  meta?: string;
  showDot?: boolean;
  className?: string;
};

/** Low-emphasis row content for the peek slot (matches full rows, softer). */
export function WorkflowPeekRow({
  badge,
  badgeClass,
  title,
  meta,
  showDot = false,
  className,
}: WorkflowPeekRowProps) {
  return (
    <div className={cn(workflowRowCardClass, "border-hub-foreground/8 bg-hub-surface/90", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-block rounded px-1.5 py-px font-mono text-[0.4rem] font-semibold uppercase tracking-wide",
              badgeClass,
            )}
          >
            {badge}
          </span>
          <p className="mt-0.5 truncate text-[0.62rem] font-semibold text-hub-foreground/80">
            {title}
          </p>
          {meta ? (
            <p className="font-mono text-[0.45rem] text-hub-foreground/35">{meta}</p>
          ) : null}
        </div>
        {showDot ? (
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-hub-primary/60" />
        ) : null}
      </div>
    </div>
  );
}
