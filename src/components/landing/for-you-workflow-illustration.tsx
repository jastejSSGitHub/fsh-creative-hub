"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import {
  WorkflowIllustrationShell,
  WorkflowSkeletonRow,
  WorkflowStackedRows,
  workflowTitleClass,
} from "@/components/landing/workflow-illustration-shell";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: "feed", label: "Everything in one feed", duration: 4400 },
  { id: "priority", label: "Sorted by urgency", duration: 4500 },
  { id: "triage", label: "Snooze & mark handled", duration: 4200 },
] as const;

const uiCardClass = "rounded-sm";

const FEED_ITEMS = [
  {
    id: "mention",
    badge: "Mention",
    badgeClass: "bg-sky-500/15 text-sky-700",
    title: "@you on Hero banner v2",
    meta: "Spring Campaign · 2m ago",
  },
  {
    id: "task",
    badge: "Assigned",
    badgeClass: "bg-amber-500/15 text-amber-800",
    title: "Revise CTA contrast",
    meta: "Due today · Project task",
  },
  {
    id: "vote",
    badge: "Vote",
    badgeClass: "bg-violet-500/15 text-violet-700",
    title: "Menu photography set",
    meta: "Awaiting your reaction",
  },
] as const;

function FeedRow({
  item,
  index,
  reduced,
}: {
  item: (typeof FEED_ITEMS)[number];
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25 + index * 0.2, type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "border border-hub-foreground/10 bg-hub-surface px-2.5 py-1.5 shadow-sm",
        uiCardClass,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-block rounded px-1.5 py-px font-mono text-[0.4rem] font-semibold uppercase tracking-wide",
              item.badgeClass,
            )}
          >
            {item.badge}
          </span>
          <p className="mt-0.5 truncate text-[0.62rem] font-semibold text-hub-foreground">
            {item.title}
          </p>
          <p className="font-mono text-[0.45rem] text-hub-foreground/40">{item.meta}</p>
        </div>
        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-hub-primary" />
      </div>
    </motion.div>
  );
}

function FeedPhase({ reduced }: { reduced: boolean }) {
  const [primary, secondary] = FEED_ITEMS;
  const peek = FEED_ITEMS[2];

  return (
    <motion.div
      key="feed"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <div className="flex items-center justify-between">
        <p className={workflowTitleClass}>For you</p>
        <span className="rounded-full bg-hub-primary/15 px-2 py-0.5 font-mono text-[0.45rem] font-semibold text-hub-primary">
          3 needs you
        </span>
      </div>

      <WorkflowStackedRows fadeBottom className="mt-2.5">
        <FeedRow item={primary} index={0} reduced={reduced} />
        <FeedRow item={secondary} index={1} reduced={reduced} />
        <WorkflowSkeletonRow badge={peek.badge} badgeClass={peek.badgeClass} />
      </WorkflowStackedRows>
    </motion.div>
  );
}

function PriorityPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="priority"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <p className={workflowTitleClass}>Needs you · priority</p>

      <WorkflowStackedRows fadeBottom className="mt-2.5">
        <motion.div
          layout
          className={cn(
            "border-2 border-rose-400/35 bg-rose-500/8 px-2.5 py-1.5 shadow-sm",
            uiCardClass,
          )}
        >
          <span className="font-mono text-[0.4rem] font-semibold uppercase tracking-wide text-rose-700">
            Overdue
          </span>
          <p className="mt-0.5 text-[0.62rem] font-semibold text-hub-foreground">
            Revise CTA contrast
          </p>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className={cn("border border-hub-foreground/10 bg-hub-surface px-2.5 py-1.5", uiCardClass)}
        >
          <span className="font-mono text-[0.4rem] font-semibold uppercase tracking-wide text-sky-700">
            Mention
          </span>
          <p className="mt-0.5 text-[0.62rem] font-semibold text-hub-foreground">
            @you on Hero banner v2
          </p>
        </motion.div>

        <WorkflowSkeletonRow badge="Vote requested" badgeClass="bg-violet-500/15 text-violet-700" />
      </WorkflowStackedRows>

      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-2 text-center text-[0.55rem] text-hub-foreground/50"
      >
        Urgent work floats to the top — not buried in Slack.
      </motion.p>
    </motion.div>
  );
}

function TriagePhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="triage"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col justify-between p-4 sm:p-5"
    >
      <div>
        <p className={workflowTitleClass}>Triage without losing context</p>
        <div className={cn("mt-2.5 border border-hub-foreground/10 bg-hub-surface p-3", uiCardClass)}>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[0.62rem] font-semibold text-hub-foreground">
                @you on Hero banner v2
              </p>
              <p className="font-mono text-[0.45rem] text-hub-foreground/40">Spring Campaign</p>
            </div>
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="flex gap-1"
            >
              <span className="rounded-md border border-hub-foreground/12 px-1.5 py-0.5 text-[0.5rem] text-hub-foreground/60">
                Snooze
              </span>
              <span className="rounded-md bg-hub-approved/15 px-1.5 py-0.5 text-[0.5rem] font-medium text-hub-approved">
                Handled
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={reduced ? false : { opacity: 1, height: "auto" }}
            animate={{ opacity: 0.35, height: 28 }}
            transition={{ delay: 1.1, duration: 0.45 }}
            className="mt-3 overflow-hidden border-t border-hub-foreground/8 pt-2"
          >
            <p className="text-[0.55rem] text-hub-foreground/45 line-through">
              Revise CTA contrast
            </p>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="flex justify-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-hub-espresso px-4 py-2">
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-hub-paper/80">
            Stay caught up
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ForYouWorkflowIllustration() {
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
        {activePhase === "feed" && <FeedPhase reduced={reduced} />}
        {activePhase === "priority" && <PriorityPhase reduced={reduced} />}
        {activePhase === "triage" && <TriagePhase reduced={reduced} />}
      </AnimatePresence>
    </WorkflowIllustrationShell>
  );
}
