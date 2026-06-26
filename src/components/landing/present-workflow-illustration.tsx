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
  { id: "present", label: "One click to present", duration: 4000 },
  { id: "reel", label: "Approved picks reel", duration: 4800 },
  { id: "room", label: "Hand it to the room", duration: 4200 },
] as const;

const uiCardClass = "rounded-sm";

const SLIDES = [
  {
    src: "/media/capabilities/brand-system/brand-1.png",
    label: "Hero banner",
  },
  {
    src: "/media/capabilities/website/coffee-website.png",
    label: "Landing page",
  },
  {
    src: "/media/capabilities/presentation/presentation1.png",
    label: "Deck slide",
  },
] as const;

function PresentPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="present"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <p className={workflowTitleClass}>Spring Campaign</p>
      <p className="font-mono text-[0.5rem] text-hub-espresso/40">
        8 approved · 3 final picks
      </p>

      <div
        className={cn(
          "mt-3 grid flex-1 grid-cols-3 gap-1.5 p-2",
          uiCardClass,
          "border border-hub-espresso/10 bg-white",
        )}
      >
        {SLIDES.map((slide) => (
          <div
            key={slide.label}
            className={cn("relative aspect-[4/3] overflow-hidden", uiCardClass)}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              sizes="80px"
              className="object-cover opacity-80"
            />
          </div>
        ))}
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 400, damping: 24 }}
        className="mt-3 flex justify-center"
      >
        <motion.button
          animate={
            reduced ? undefined : { scale: [1, 1.04, 1], boxShadow: ["0 0 0 0 rgba(255,201,75,0)", "0 0 0 6px rgba(255,201,75,0.25)", "0 0 0 0 rgba(255,201,75,0)"] }
          }
          transition={{ delay: 1, duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
          className={cn(
            "inline-flex min-h-8 items-center gap-2 bg-hub-accent px-4 py-2 font-mono text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-hub-espresso",
            uiCardClass,
          )}
        >
          Present →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function ReelPhase({ reduced }: { reduced: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [reduced]);

  return (
    <motion.div
      key="reel"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col bg-hub-espresso p-3 sm:p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[0.45rem] uppercase tracking-[0.14em] text-hub-paper/40">
          Presentation mode
        </span>
        <span className="font-mono text-[0.45rem] text-hub-paper/35">
          {active + 1} / {SLIDES.length}
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={reduced ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={SLIDES[active].src}
              alt=""
              fill
              sizes="400px"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
              <p className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-white/80">
                {SLIDES[active].label} · Final pick
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2 flex justify-center gap-1">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-all",
              i === active ? "w-4 bg-hub-accent" : "w-2 bg-hub-paper/25",
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

function RoomPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="room"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col justify-between bg-hub-espresso p-4 sm:p-5"
    >
      <div className="text-center">
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-mono text-[0.45rem] uppercase tracking-[0.18em] text-hub-paper/40"
        >
          Meeting-ready
        </motion.p>
        <motion.h3
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-2 font-display text-lg font-extrabold text-hub-paper"
        >
          Final picks, full screen
        </motion.h3>
      </div>

      <div className="flex items-center justify-center gap-3">
        {["JS", "SP", "AK"].map((initial, i) => (
          <motion.div
            key={initial}
            initial={reduced ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + i * 0.15, type: "spring" }}
            className="flex size-8 items-center justify-center rounded-full border-2 border-hub-espresso bg-hub-paper/90 text-[0.55rem] font-semibold text-hub-espresso"
          >
            {initial}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.35 }}
        className="flex justify-center pb-1"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-hub-paper/15 px-4 py-2">
          <span className="size-1.5 rounded-full bg-hub-accent" />
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-hub-paper/70">
            Chrome-free · No distractions
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PresentWorkflowIllustration() {
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
        {activePhase === "present" && <PresentPhase reduced={reduced} />}
        {activePhase === "reel" && <ReelPhase reduced={reduced} />}
        {activePhase === "room" && <RoomPhase reduced={reduced} />}
      </AnimatePresence>
    </WorkflowIllustrationShell>
  );
}
