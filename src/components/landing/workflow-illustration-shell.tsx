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
            activeIndex === i ? "w-6 bg-hub-accent" : "w-3 bg-hub-espresso/15",
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
      className="relative overflow-visible rounded-lg border border-hub-espresso/10 bg-gradient-to-b from-white to-hub-paper shadow-[0_16px_48px_rgba(11,11,11,0.06)]"
    >
      <div className="flex items-center justify-between border-b border-hub-espresso/8 bg-hub-espresso/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="size-2 rounded-full bg-hub-espresso/15" />
            <span className="size-2 rounded-full bg-hub-espresso/15" />
            <span className="size-2 rounded-full bg-hub-espresso/15" />
          </div>
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-hub-espresso/35">
            FSH Creative Hub
          </span>
        </div>
        <WorkflowPhaseIndicator
          count={phaseCount}
          activeIndex={activePhaseIndex}
        />
      </div>

      <div className="relative z-10 h-[11.5rem] overflow-visible sm:h-[12.5rem]">
        {children}
      </div>

      <div className="relative z-0 border-t border-hub-espresso/8 bg-gradient-to-b from-white to-hub-paper px-4 py-2">
        <p className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-hub-espresso/40">
          {phaseLabel}
        </p>
      </div>
    </div>
  );
}

export const workflowTitleClass =
  "text-[0.7rem] font-semibold text-hub-espresso";
