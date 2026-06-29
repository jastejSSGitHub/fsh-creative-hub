"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

import {
  WorkflowIllustrationShell,
  workflowTitleClass,
} from "@/components/landing/workflow-illustration-shell";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: "comment", label: "Comment on the asset", duration: 4300 },
  { id: "task", label: "Spin up a linked task", duration: 4500 },
  { id: "resolve", label: "Complete & resolve", duration: 4400 },
] as const;

const HERO_ASSET_SRC = "/media/capabilities/brand-system/brand-1.png";
const uiCardClass = "rounded-sm";
const uiInsetClass = "rounded-sm";

function AssetThumb() {
  return (
    <div className={cn("relative h-9 w-12 shrink-0 overflow-hidden shadow-sm", uiCardClass)}>
      <Image src={HERO_ASSET_SRC} alt="" fill sizes="48px" className="object-cover" />
    </div>
  );
}

function CommentPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="comment"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <div className="flex items-center gap-2">
        <AssetThumb />
        <div>
          <p className={workflowTitleClass}>Hero banner v2</p>
          <p className="font-mono text-[0.45rem] text-hub-foreground/40">Review board</p>
        </div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 24 }}
        className={cn("mt-3 bg-hub-foreground/[0.05] px-2.5 py-2", uiInsetClass)}
      >
        <p className="text-[0.6rem] leading-relaxed text-hub-foreground/75">
          CTA needs more contrast on mobile — can we fix before client review?
        </p>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95 }}
        className="mt-auto flex justify-end"
      >
        <span className="rounded-md border border-hub-foreground/12 bg-hub-surface px-2 py-1 text-[0.5rem] font-medium text-hub-foreground/70">
          Create task from comment
        </span>
      </motion.div>
    </motion.div>
  );
}

function TaskPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="task"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <p className={workflowTitleClass}>Linked follow-up</p>

      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 22 }}
        className={cn("mt-3 border border-hub-foreground/10 bg-hub-surface p-2.5 shadow-sm", uiCardClass)}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-hub-foreground/20 bg-white text-[0.45rem]" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-semibold text-hub-foreground">
              Fix CTA contrast on hero
            </p>
            <p className="mt-0.5 font-mono text-[0.45rem] text-hub-foreground/40">
              Assigned to you · In review
            </p>
          </div>
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className={cn("mt-2 flex items-center gap-2 bg-hub-foreground/[0.03] px-2 py-1.5", uiInsetClass)}
        >
          <AssetThumb />
          <span className="text-[0.5rem] text-hub-foreground/55">Linked asset</span>
        </motion.div>
      </motion.div>

      {!reduced && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 1.1, duration: 1.2, repeat: Infinity, repeatDelay: 0.6 }}
          className="mx-auto mt-2 text-[0.55rem] text-hub-primary"
        >
          ↓ work happens ↓
        </motion.div>
      )}
    </motion.div>
  );
}

function ResolvePhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="resolve"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col justify-between p-4 sm:p-5"
    >
      <div>
        <p className={workflowTitleClass}>Close the loop</p>

        <motion.div
          initial={reduced ? false : { opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className={cn("mt-3 border border-hub-foreground/10 bg-hub-surface p-2.5", uiCardClass)}
        >
          <div className="flex items-center gap-2">
            <motion.span
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 500 }}
              className="flex size-4 items-center justify-center rounded-full bg-hub-approved text-[0.45rem] text-white"
            >
              ✓
            </motion.span>
            <p className="text-[0.62rem] font-semibold text-hub-foreground line-through decoration-hub-foreground/35">
              Fix CTA contrast on hero
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, type: "spring" }}
          className={cn("mt-2 border border-hub-approved/25 bg-hub-approved/8 p-2.5", uiCardClass)}
        >
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-hub-approved text-[0.55rem] text-white">
              ✓
            </span>
            <div>
              <p className="text-[0.6rem] font-semibold text-hub-foreground">Thread resolved</p>
              <p className="font-mono text-[0.45rem] text-hub-foreground/45">Comment marked done</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.35 }}
        className="flex justify-center pb-1"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-hub-espresso px-4 py-2.5">
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-hub-paper/80">
            Feedback → task → done
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CollaborationLoopWorkflowIllustration() {
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
        {activePhase === "comment" && <CommentPhase reduced={reduced} />}
        {activePhase === "task" && <TaskPhase reduced={reduced} />}
        {activePhase === "resolve" && <ResolvePhase reduced={reduced} />}
      </AnimatePresence>
    </WorkflowIllustrationShell>
  );
}
