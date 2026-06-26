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
  { id: "thread", label: "Thread a comment", duration: 4200 },
  { id: "mention", label: "@mention someone", duration: 4500 },
  { id: "resolve", label: "Resolve & keep history", duration: 4200 },
] as const;

const HERO_ASSET_SRC = "/media/capabilities/brand-system/brand-1.png";

const uiCardClass = "rounded-sm";
const uiInsetClass = "rounded-sm";

function Avatar({
  initials,
  color,
  size = "sm",
}: {
  initials: string;
  color: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br font-semibold text-white",
        color,
        size === "sm" ? "size-6 text-[0.5rem]" : "size-7 text-[0.55rem]",
      )}
    >
      {initials}
    </div>
  );
}

function AssetThumb() {
  return (
    <div
      className={cn(
        "relative h-10 w-14 shrink-0 overflow-hidden shadow-sm",
        uiCardClass,
      )}
    >
      <Image
        src={HERO_ASSET_SRC}
        alt=""
        fill
        sizes="56px"
        className="object-cover"
      />
    </div>
  );
}

function ThreadPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="thread"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <div className="flex items-start gap-2.5">
        <AssetThumb />
        <div className="min-w-0 flex-1">
          <p className={workflowTitleClass}>Hero banner v2</p>
          <p className="font-mono text-[0.5rem] text-hub-espresso/40">
            Spring Campaign · Asset
          </p>
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-2">
        <motion.div
          initial={reduced ? false : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 320, damping: 24 }}
          className="flex gap-2"
        >
          <Avatar initials="JS" color="from-[#3A86FF] to-[#8338EC]" />
          <div
            className={cn(
              "flex-1 bg-hub-espresso/[0.05] px-2.5 py-2",
              uiInsetClass,
              "rounded-tl-none",
            )}
          >
            <p className="text-[0.6rem] leading-relaxed text-hub-espresso/75">
              Can we bump contrast on the CTA? Feels soft on mobile.
            </p>
            <p className="mt-1 font-mono text-[0.45rem] text-hub-espresso/35">
              Just now
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.35 }}
          className="ml-8 flex items-center gap-1.5"
        >
          <span className="font-mono text-[0.45rem] text-hub-espresso/40">
            ↳ Reply
          </span>
          <span className="h-px flex-1 bg-hub-espresso/10" />
        </motion.div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.35 }}
        className={cn(
          "flex items-center gap-2 border border-hub-espresso/10 bg-white px-2.5 py-2 shadow-sm",
          uiCardClass,
        )}
      >
        <span className="text-[0.55rem] text-hub-espresso/35">Add comment…</span>
        {!reduced && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="ml-auto h-3 w-0.5 bg-hub-accent"
          />
        )}
      </motion.div>
    </motion.div>
  );
}

function MentionPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="mention"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <p className={workflowTitleClass}>Threaded feedback</p>

      <div className="mt-2 flex-1 space-y-2 overflow-hidden">
        <div className="flex gap-2 opacity-50">
          <Avatar initials="JS" color="from-[#3A86FF] to-[#8338EC]" />
          <div className={cn("flex-1 bg-hub-espresso/[0.04] px-2.5 py-1.5", uiInsetClass)}>
            <p className="text-[0.55rem] text-hub-espresso/60">
              Can we bump contrast on the CTA?
            </p>
          </div>
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 300, damping: 22 }}
          className="ml-5 flex gap-2 border-l-2 border-hub-accent/40 pl-3"
        >
          <Avatar initials="AK" color="from-[#FF6B6B] to-[#FFE66D]" />
          <div
            className={cn(
              "flex-1 bg-white px-2.5 py-2 shadow-sm",
              uiInsetClass,
              "rounded-tl-none",
            )}
          >
            <p className="text-[0.6rem] leading-relaxed text-hub-espresso/80">
              <span className="rounded-sm bg-hub-accent/25 px-1 font-semibold text-hub-espresso">
                @Preeti
              </span>{" "}
              — needs your sign-off on this copy before we lock.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.85, duration: 0.35 }}
          className={cn(
            "ml-5 border border-hub-espresso/10 bg-white p-2 shadow-md",
            uiCardClass,
          )}
        >
          <p className="mb-1.5 font-mono text-[0.45rem] uppercase tracking-wider text-hub-espresso/40">
            Mention
          </p>
          <div
            className={cn(
              "flex items-center gap-2 bg-hub-espresso/[0.04] px-2 py-1.5",
              uiInsetClass,
            )}
          >
            <Avatar initials="SP" color="from-[#06D6A0] to-[#118AB2]" size="md" />
            <div>
              <p className="text-[0.6rem] font-semibold text-hub-espresso">
                Preeti
              </p>
              <p className="font-mono text-[0.45rem] text-hub-espresso/40">
                preeti@fsh.example.email
              </p>
            </div>
            <motion.span
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="ml-auto text-[0.55rem] text-hub-approved"
            >
              ✓
            </motion.span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.35 }}
        className="mt-2 flex justify-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-hub-espresso px-3 py-2">
          <span className="size-1.5 rounded-full bg-hub-accent" />
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-hub-paper/80">
            Added to For You inbox
          </span>
        </div>
      </motion.div>
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
        <p className={workflowTitleClass}>Resolve thread</p>
        <div className={cn("mt-3 border border-hub-espresso/10 bg-white p-3 shadow-sm", uiCardClass)}>
          <motion.div
            initial={reduced ? false : { opacity: 1, height: "auto" }}
            animate={{ opacity: 0.35, height: 32 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2">
              <Avatar initials="JS" color="from-[#3A86FF] to-[#8338EC]" />
              <p className="text-[0.55rem] text-hub-espresso/50 line-clamp-1">
                Can we bump contrast on the CTA?…
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 320, damping: 24 }}
            className="mt-2"
          >
            <div
              className={cn(
                "inline-flex items-center gap-3 bg-hub-approved/10 px-2.5 py-1.5",
                uiInsetClass,
              )}
            >
              <div className="flex items-center gap-2">
                <motion.span
                  initial={reduced ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.75, type: "spring", stiffness: 500 }}
                  className="flex size-5 items-center justify-center rounded-full bg-hub-approved text-[0.6rem] text-white"
                >
                  ✓
                </motion.span>
                <p className="text-[0.6rem] font-semibold text-hub-espresso">
                  Resolved
                </p>
              </div>
              <p className="font-mono text-[0.45rem] text-hub-espresso/45">
                2 replies saved
              </p>
            </div>
          </motion.div>

          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-2 text-[0.55rem] text-hub-espresso/50"
          >
            Collapsed from view — still in project history.
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.35 }}
        className="flex justify-center pb-1"
      >
        <div className="inline-flex items-center justify-center gap-2 rounded-full bg-hub-espresso px-4 py-2.5">
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-hub-paper/80">
            Nothing gets lost
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CommentsWorkflowIllustration() {
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
        {activePhase === "thread" && <ThreadPhase reduced={reduced} />}
        {activePhase === "mention" && <MentionPhase reduced={reduced} />}
        {activePhase === "resolve" && <ResolvePhase reduced={reduced} />}
      </AnimatePresence>
    </WorkflowIllustrationShell>
  );
}
