"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

import {
  WorkflowIllustrationShell,
  workflowTitleClass,
} from "@/components/landing/workflow-illustration-shell";
import { REACTION_META } from "@/lib/assets/consensus";
import type { VoteReaction } from "@/types/database";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: "open", label: "Open the asset", duration: 4200 },
  { id: "identify", label: "First vote? Tell us who you are", duration: 5200 },
  { id: "approved", label: "Watch consensus form", duration: 5000 },
] as const;

const REACTIONS = Object.keys(REACTION_META) as VoteReaction[];

const ASSET_SRC = "/media/capabilities/brand-system/brand-1.png";
const VOTER_NAME = "Henry";

const uiCardClass = "rounded-sm";
const uiInsetClass = "rounded-sm";

function MiniReactionGrid({
  selected,
  reduced,
  pulseReaction,
}: {
  selected: VoteReaction | null;
  reduced: boolean;
  pulseReaction?: VoteReaction | null;
}) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {REACTIONS.map((reaction) => {
        const isSelected = selected === reaction;
        const isPulsing = pulseReaction === reaction;

        return (
          <div key={reaction} className="relative">
            <motion.div
              animate={
                isPulsing && !reduced
                  ? { scale: [1, 1.14, 1], borderColor: "rgba(11,11,11,0.35)" }
                  : { scale: isSelected ? 1.08 : 1 }
              }
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "flex min-h-7 items-center justify-center border text-sm",
                uiCardClass,
                isSelected
                  ? "border-hub-foreground bg-hub-foreground/10 ring-1 ring-hub-espresso/15"
                  : "border-hub-foreground/15 bg-hub-surface",
              )}
            >
              {REACTION_META[reaction].emoji}
            </motion.div>
            {isPulsing && !reduced ? (
              <>
                {Array.from({ length: 3 }, (_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 1, x: "-50%", y: 0, scale: 0.6 }}
                    animate={{
                      opacity: 0,
                      x: `calc(-50% + ${(i - 1) * 10}px)`,
                      y: -(12 + i * 8),
                      scale: 1.1,
                    }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute left-1/2 top-1/2 text-sm"
                  >
                    {REACTION_META[reaction].emoji}
                  </motion.span>
                ))}
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function MiniConsensusBar({ progress }: { progress: number }) {
  return (
    <div className="space-y-1">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-hub-foreground/10">
        <motion.span
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex h-full"
        >
          <span className="h-full bg-[#f97316]" style={{ width: "22%" }} />
          <span className="h-full bg-[#22c55e]" style={{ width: "58%" }} />
          <span className="h-full bg-[#f59e0b]" style={{ width: "12%" }} />
          <span className="h-full bg-[#ef4444]" style={{ width: "8%" }} />
        </motion.span>
      </div>
      <p className="font-mono text-[0.45rem] uppercase tracking-wider text-hub-foreground/40">
        {progress > 0 ? `${Math.round(progress / 25)} reactions` : "0 reactions"}
      </p>
    </div>
  );
}

function ApproveRejectButtons({
  active,
  reduced,
}: {
  active: "approve" | "reject" | null;
  reduced: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      <motion.button
        type="button"
        animate={
          active === "approve" && !reduced
            ? { scale: [1, 1.06, 1], boxShadow: "0 0 0 2px rgba(34,197,94,0.35)" }
            : { scale: 1, boxShadow: "0 0 0 0px rgba(34,197,94,0)" }
        }
        transition={{ duration: 0.35 }}
        className={cn(
          "min-h-7 flex-1 border px-2 font-mono text-[0.45rem] uppercase tracking-wide",
          uiCardClass,
          active === "approve"
            ? "border-hub-approved/60 bg-hub-approved/10 text-hub-approved"
            : "border-hub-approved/40 bg-hub-surface text-hub-foreground/75",
        )}
      >
        Approve
      </motion.button>
      <button
        type="button"
        className={cn(
          "min-h-7 flex-1 border px-2 font-mono text-[0.45rem] uppercase tracking-wide opacity-45",
          uiCardClass,
          "border-hub-rejected/40 bg-hub-surface text-hub-foreground/55",
        )}
      >
        Reject
      </button>
    </div>
  );
}

function OpenAssetPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="open"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-3.5 sm:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={workflowTitleClass}>Hero banner v2</p>
          <p className="font-mono text-[0.45rem] text-hub-foreground/40">
            Spring Campaign · Pending
          </p>
        </div>
        <span className="rounded-sm border border-hub-foreground/10 bg-hub-surface px-1.5 py-0.5 font-mono text-[0.4rem] uppercase tracking-wider text-hub-foreground/45">
          Lightbox
        </span>
      </div>

      <div
        className={cn(
          "relative mt-2.5 flex-1 overflow-hidden border border-hub-foreground/10 bg-hub-espresso",
          uiCardClass,
        )}
      >
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-hub-foreground/25" />
        <div className="relative h-[4.5rem] w-full">
          <Image src={ASSET_SRC} alt="" fill sizes="120px" className="object-cover opacity-90" />
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1">
          <motion.button
            type="button"
            initial={reduced ? false : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 420, damping: 18 }}
            className="flex size-6 items-center justify-center rounded-full border border-white/20 bg-black/45 text-xs text-hub-approved backdrop-blur-sm"
          >
            ✓
          </motion.button>
          <motion.button
            type="button"
            initial={reduced ? false : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.65, type: "spring", stiffness: 420, damping: 18 }}
            className="flex size-6 items-center justify-center rounded-full border border-white/20 bg-black/45 text-xs text-hub-rejected backdrop-blur-sm"
          >
            ✗
          </motion.button>
        </div>
      </div>

      <div className="mt-2.5 space-y-2">
        <ApproveRejectButtons active={null} reduced={reduced} />
        <div>
          <p className="mb-1 font-mono text-[0.42rem] uppercase tracking-wider text-hub-foreground/40">
            Reactions
          </p>
          <MiniReactionGrid selected={null} reduced={reduced} />
        </div>
      </div>

      {!reduced ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.35 }}
          className="pointer-events-none absolute bottom-14 left-1/2 z-20 -translate-x-1/2"
        >
          <div className="flex size-3.5 items-center justify-center rounded-full border-2 border-hub-foreground/70 bg-hub-surface shadow-md">
            <div className="absolute left-2 top-2 h-3 w-px origin-top rotate-[135deg] bg-hub-foreground/50" />
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

function IdentifyPhase({ reduced }: { reduced: boolean }) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (reduced) {
      setTyped(VOTER_NAME);
      return;
    }

    setTyped("");
    let index = 0;
    let interval: number | undefined;

    const startDelay = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setTyped(VOTER_NAME.slice(0, index));
        if (index >= VOTER_NAME.length && interval) {
          window.clearInterval(interval);
        }
      }, 120);
    }, 600);

    return () => {
      window.clearTimeout(startDelay);
      if (interval) window.clearInterval(interval);
    };
  }, [reduced]);

  const ready = typed.length === VOTER_NAME.length;

  return (
    <motion.div
      key="identify"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-full flex-col p-3.5 sm:p-4"
    >
      <div className="pointer-events-none opacity-35">
        <p className={workflowTitleClass}>Hero banner v2</p>
        <div className={cn("mt-2 h-[4.5rem] border border-hub-foreground/10 bg-hub-espresso", uiCardClass)} />
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 24 }}
        className={cn(
          "absolute inset-x-3.5 top-1/2 z-10 -translate-y-1/2 border border-hub-foreground/12 bg-hub-surface p-3 shadow-[0_16px_40px_rgba(11,11,11,0.14)] sm:inset-x-4 sm:p-3.5",
          uiCardClass,
        )}
      >
        <p className="font-mono text-[0.42rem] uppercase tracking-[0.14em] text-hub-foreground/40">
          FSH Creative Hub
        </p>
        <p className="mt-1.5 font-display text-[0.72rem] font-bold text-hub-foreground">
          Who are you?
        </p>
        <p className="mt-0.5 text-[0.52rem] leading-relaxed text-hub-foreground/55">
          Enter your name once so the team knows who approved or rejected each asset.
        </p>

        <div
          className={cn(
            "mt-2.5 flex items-center border border-hub-foreground/15 bg-hub-foreground/[0.03] px-2 py-1.5",
            uiInsetClass,
          )}
        >
          <span className="min-w-0 flex-1 truncate text-[0.58rem] font-medium text-hub-foreground">
            {typed || (
              <span className="text-hub-foreground/30">e.g. Joshua, Henry…</span>
            )}
          </span>
          {!reduced && typed.length < VOTER_NAME.length ? (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="ml-1 h-3 w-0.5 bg-hub-accent"
            />
          ) : null}
        </div>

        <motion.div
          initial={false}
          animate={{
            opacity: ready ? 1 : 0.45,
            scale: ready ? 1 : 0.98,
          }}
          transition={{ duration: 0.25 }}
          className={cn(
            "mt-2.5 flex min-h-7 items-center justify-center bg-hub-espresso px-3 font-mono text-[0.45rem] uppercase tracking-[0.12em] text-hub-paper",
            uiCardClass,
            ready && "shadow-[0_4px_14px_rgba(11,11,11,0.18)]",
          )}
        >
          Continue →
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function MiniConfetti({ active, reduced }: { active: boolean; reduced: boolean }) {
  if (reduced || !active) return null;

  const colors = ["#FFC94B", "#22C55E", "#3A86FF", "#FF6B6B", "#C77DFF"];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 10 }, (_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: (i % 2 === 0 ? 1 : -1) * (10 + (i % 4) * 8),
            y: -16 - (i % 3) * 10,
            rotate: i % 2 === 0 ? 120 : -100,
            scale: [0, 1, 1, 0.45],
          }}
          transition={{ delay: 0.1 + i * 0.04, duration: 0.75, ease: "easeOut" }}
          className="absolute left-1/2 top-[38%] size-1.5 rounded-sm"
          style={{ backgroundColor: colors[i % colors.length] }}
        />
      ))}
    </div>
  );
}

function ApprovedPhase({ reduced }: { reduced: boolean }) {
  const [barProgress, setBarProgress] = useState(reduced ? 100 : 0);

  useEffect(() => {
    if (reduced) {
      setBarProgress(100);
      return;
    }

    setBarProgress(0);
    const t1 = window.setTimeout(() => setBarProgress(72), 400);
    const t2 = window.setTimeout(() => setBarProgress(100), 1100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduced]);

  return (
    <motion.div
      key="approved"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-full flex-col p-3.5 sm:p-4"
    >
      <MiniConfetti active={barProgress >= 72} reduced={reduced} />

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={workflowTitleClass}>Hero banner v2</p>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.35 }}
            className="font-mono text-[0.45rem] uppercase tracking-wider text-hub-approved"
          >
            Approved by {VOTER_NAME}
          </motion.p>
        </div>
        <motion.span
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 480, damping: 16 }}
          className="rounded-sm border border-hub-approved/30 bg-hub-approved/10 px-1.5 py-0.5 font-mono text-[0.4rem] font-semibold uppercase tracking-wider text-hub-approved"
        >
          Approved
        </motion.span>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className={cn(
          "relative mt-2 overflow-hidden border border-hub-approved/25 bg-hub-espresso ring-2 ring-hub-approved/20",
          uiCardClass,
        )}
      >
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-hub-approved" />
        <div className="relative h-[3.75rem] w-full">
          <Image src={ASSET_SRC} alt="" fill sizes="120px" className="object-cover" />
        </div>
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55, type: "spring", stiffness: 420, damping: 18 }}
          className="absolute inset-0 flex items-center justify-center bg-hub-approved/20"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-hub-approved text-sm text-white shadow-lg">
            ✓
          </span>
        </motion.div>
      </motion.div>

      <div className="mt-2 space-y-2">
        <ApproveRejectButtons active="approve" reduced={reduced} />
        <div>
          <p className="mb-1 font-mono text-[0.42rem] uppercase tracking-wider text-hub-foreground/40">
            Reactions
          </p>
          <MiniReactionGrid selected="up" reduced={reduced} pulseReaction={barProgress >= 72 ? "up" : null} />
        </div>
        <MiniConsensusBar progress={barProgress} />
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: barProgress >= 100 ? 1 : 0, y: barProgress >= 100 ? 0 : 8 }}
        transition={{ duration: 0.35 }}
        className="mt-auto flex justify-center pt-1"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full bg-hub-espresso px-2.5 py-1.5 font-mono text-[0.45rem] uppercase tracking-[0.1em] text-hub-paper/85">
          <motion.span
            animate={!reduced && barProgress >= 100 ? { rotate: [0, 12, -12, 0] } : { rotate: 0 }}
            transition={{ duration: 0.45 }}
          >
            ✓
          </motion.span>
          Vote recorded
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ReviewWorkflowIllustration() {
  const reduced = !!useReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const activePhase = PHASES[phaseIndex].id;

  useEffect(() => {
    if (reduced) return;

    const duration = PHASES[phaseIndex].duration;
    const timer = window.setTimeout(() => {
      setPhaseIndex((current) => (current + 1) % PHASES.length);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [phaseIndex, reduced]);

  return (
    <WorkflowIllustrationShell
      phaseCount={PHASES.length}
      activePhaseIndex={phaseIndex}
      phaseLabel={PHASES[phaseIndex].label}
    >
      <AnimatePresence mode="wait">
        {activePhase === "open" && <OpenAssetPhase reduced={reduced} />}
        {activePhase === "identify" && <IdentifyPhase reduced={reduced} />}
        {activePhase === "approved" && <ApprovedPhase reduced={reduced} />}
      </AnimatePresence>
    </WorkflowIllustrationShell>
  );
}
