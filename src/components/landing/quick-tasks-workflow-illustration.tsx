"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import {
  WorkflowIllustrationShell,
  workflowTitleClass,
} from "@/components/landing/workflow-illustration-shell";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: "invoke", label: "Press Q anywhere", duration: 4200 },
  { id: "parse", label: "Natural-language capture", duration: 4600 },
  { id: "land", label: "Lands in your workflow", duration: 4400 },
] as const;

const uiCardClass = "rounded-sm";
const uiInsetClass = "rounded-sm";

function InvokePhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="invoke"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col items-center justify-center p-4 sm:p-5"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 22 }}
        className={cn(
          "w-full max-w-[14rem] border border-hub-foreground/12 bg-hub-surface p-3 shadow-lg",
          uiCardClass,
        )}
      >
        <p className={workflowTitleClass}>Quick task</p>
        <div
          className={cn(
            "mt-2 flex items-center gap-2 border border-hub-foreground/10 bg-white px-2.5 py-2",
            uiInsetClass,
          )}
        >
          <span className="text-[0.55rem] text-hub-foreground/35">What needs doing?</span>
          {!reduced && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="ml-auto h-3 w-0.5 bg-hub-accent"
            />
          )}
        </div>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.35 }}
        className="mt-4 flex items-center gap-2"
      >
        <kbd className="rounded border border-hub-foreground/15 bg-hub-foreground/[0.04] px-2 py-1 font-mono text-[0.55rem] font-semibold text-hub-foreground shadow-sm">
          Q
        </kbd>
        <span className="text-[0.55rem] text-hub-foreground/50">from any screen in the hub</span>
      </motion.div>
    </motion.div>
  );
}

function ParsePhase({ reduced }: { reduced: boolean }) {
  const chips = [
    { label: "Tomorrow", className: "bg-sky-500/12 text-sky-800" },
    { label: "#design", className: "bg-violet-500/12 text-violet-800" },
    { label: "P1", className: "bg-rose-500/12 text-rose-800" },
    { label: "Spring Campaign", className: "bg-amber-500/12 text-amber-900" },
  ];

  return (
    <motion.div
      key="parse"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <p className={workflowTitleClass}>Typed once — parsed instantly</p>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className={cn("mt-3 border border-hub-foreground/10 bg-hub-surface p-2.5", uiCardClass)}
      >
        <p className="text-[0.62rem] leading-relaxed text-hub-foreground/80">
          Revise hero CTA contrast{" "}
          <span className="text-hub-foreground/45">tomorrow #design p1 @spring</span>
        </p>
      </motion.div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip, index) => (
          <motion.span
            key={chip.label}
            initial={reduced ? false : { opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.45 + index * 0.12, type: "spring", stiffness: 360, damping: 22 }}
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[0.45rem] font-semibold",
              chip.className,
            )}
          >
            {chip.label}
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="mt-auto flex justify-center pt-3"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-hub-espresso px-3 py-2">
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-hub-paper/80">
            Inbox or project — your call
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LandPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="land"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <p className={workflowTitleClass}>Today</p>
        <span className="font-mono text-[0.45rem] text-hub-foreground/40">Tasks</span>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 300, damping: 24 }}
        className={cn(
          "mt-3 border border-hub-primary/25 bg-hub-primary/5 px-2.5 py-2 shadow-sm",
          uiCardClass,
        )}
      >
        <div className="flex items-start gap-2">
          <motion.span
            initial={reduced ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 500 }}
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-hub-foreground/20 bg-white text-[0.45rem]"
          />
          <div>
            <p className="text-[0.62rem] font-semibold text-hub-foreground">
              Revise hero CTA contrast
            </p>
            <p className="mt-0.5 font-mono text-[0.45rem] text-hub-foreground/40">
              Spring Campaign · Due tomorrow
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ delay: 0.9 }}
        className={cn("mt-2 border border-hub-foreground/8 bg-hub-surface/80 px-2.5 py-2", uiCardClass)}
      >
        <p className="text-[0.55rem] text-hub-foreground/55 line-through">Ship menu photography</p>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-auto flex justify-center pt-2"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-hub-espresso px-4 py-2.5">
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-hub-paper/80">
            Capture without breaking flow
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function QuickTasksWorkflowIllustration() {
  const reduced = !!useReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const activePhase = PHASES[phaseIndex].id;

  useEffect(() => {
    if (reduced) return;

    const timer = window.setTimeout(() => {
      setPhaseIndex((current) => (current + 1) % PHASES.length);
    }, PHASES[phaseIndex].duration);

    return () => window.clearTimeout(timer);
  }, [phaseIndex, reduced]);

  return (
    <WorkflowIllustrationShell
      phaseCount={PHASES.length}
      activePhaseIndex={phaseIndex}
      phaseLabel={PHASES[phaseIndex].label}
    >
      <AnimatePresence mode="wait">
        {activePhase === "invoke" && <InvokePhase reduced={reduced} />}
        {activePhase === "parse" && <ParsePhase reduced={reduced} />}
        {activePhase === "land" && <LandPhase reduced={reduced} />}
      </AnimatePresence>
    </WorkflowIllustrationShell>
  );
}
