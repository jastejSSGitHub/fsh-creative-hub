"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import {
  WorkflowIllustrationShell,
  workflowTitleClass,
} from "@/components/landing/workflow-illustration-shell";
import { loopTransition, springTransition } from "@/lib/motion/transitions";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: "drop", label: "Drop ideas", duration: 4200 },
  { id: "upvote", label: "Upvote the best", duration: 5000 },
  { id: "decide", label: "Let the room decide", duration: 4800 },
] as const;

const uiCardClass = "rounded-sm";

const STICKIES = [
  {
    id: "hook",
    text: "Bold headline hook",
    color: "bg-[#FFF3B0]",
    rotate: -4,
  },
  {
    id: "ugc",
    text: "UGC-style opener",
    color: "bg-[#FFD6E0]",
    rotate: 3,
  },
  {
    id: "stat",
    text: "Lead with the stat",
    color: "bg-[#C8F0D8]",
    rotate: -2,
  },
] as const;

type VoteTally = { up: number; down: number };
type StickyId = (typeof STICKIES)[number]["id"];

function VoteControls({
  tally,
  leading,
  pulseUp,
  reduced,
}: {
  tally: VoteTally;
  leading?: boolean;
  pulseUp?: boolean;
  reduced: boolean;
}) {
  const net = tally.up - tally.down;

  return (
    <div className="mt-1.5 flex items-center justify-center gap-1">
      <motion.div
        animate={
          pulseUp && !reduced
            ? { scale: [1, 1.35, 1], y: [0, -2, 0] }
            : { scale: 1 }
        }
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center leading-none"
      >
        <span className="text-[0.6rem] font-bold leading-none text-hub-approved">
          ▲
        </span>
        <motion.span
          key={tally.up}
          initial={reduced ? false : { scale: 1.35, color: "#22c55e" }}
          animate={{ scale: 1, color: "#22c55e" }}
          className="font-mono text-[0.45rem] font-bold leading-tight"
        >
          {tally.up}
        </motion.span>
      </motion.div>

      <motion.span
        key={net}
        initial={reduced ? false : { scale: 1.25 }}
        animate={{ scale: leading ? 1.1 : 1 }}
        className={cn(
          "min-w-[1.1rem] text-center font-mono text-[0.55rem] font-extrabold tabular-nums",
          leading ? "text-hub-foreground" : "text-hub-foreground/55",
        )}
      >
        {net}
      </motion.span>

      <div className="flex flex-col items-center leading-none">
        <span className="text-[0.6rem] font-bold leading-none text-hub-rejected">
          ▼
        </span>
        <span className="font-mono text-[0.45rem] font-bold leading-tight text-hub-rejected">
          {tally.down}
        </span>
      </div>
    </div>
  );
}

function UpvoteBurst({
  show,
  reduced,
}: {
  show: boolean;
  reduced: boolean;
}) {
  if (reduced || !show) return null;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5, y: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1], y: [0, -14, -22] }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="pointer-events-none absolute -top-2 right-0 z-20 rounded-sm bg-hub-approved px-1 py-0.5 font-mono text-[0.5rem] font-bold text-white shadow-sm"
    >
      +1 ▲
    </motion.span>
  );
}

function PostIt({
  text,
  color,
  rotate,
  tally,
  winner,
  leading,
  pulseUp,
  reduced,
  delay = 0,
  className,
}: {
  text: string;
  color: string;
  rotate: number;
  tally?: VoteTally;
  winner?: boolean;
  leading?: boolean;
  pulseUp?: boolean;
  reduced: boolean;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={
        reduced ? false : { opacity: 0, y: -20, scale: 0.85, rotate: rotate - 8 }
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: leading ? 1.08 : pulseUp && !reduced ? [1, 1.12, 1.06] : 1,
        rotate: leading ? 0 : rotate,
        zIndex: leading ? 10 : 1,
      }}
      transition={{
        delay,
        opacity: springTransition({ stiffness: 280, damping: 20 }),
        y: springTransition({ stiffness: 280, damping: 20 }),
        rotate: springTransition({ stiffness: 280, damping: 20 }),
        zIndex: { duration: 0 },
        scale:
          pulseUp && !reduced
            ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
            : springTransition({ stiffness: 280, damping: 20 }),
      }}
      className={cn(
        "relative w-[5.5rem] px-2 py-2 shadow-[0_4px_12px_rgba(11,11,11,0.12)]",
        uiCardClass,
        color,
        leading && "shadow-[0_10px_24px_rgba(34,197,94,0.22)] ring-2 ring-hub-approved/50",
        winner && "ring-2 ring-hub-accent shadow-[0_8px_20px_rgba(255,201,75,0.35)]",
        className,
      )}
    >
      <UpvoteBurst show={!!pulseUp} reduced={reduced} />
      <div className="absolute -top-1 left-1/2 h-2 w-6 -translate-x-1/2 rounded-sm bg-hub-surface/50 shadow-sm" />
      <p className="mt-1 text-[0.55rem] font-medium leading-snug text-hub-foreground/85">
        {text}
      </p>
      {tally ? (
        <VoteControls
          tally={tally}
          leading={leading}
          pulseUp={pulseUp}
          reduced={reduced}
        />
      ) : null}
    </motion.div>
  );
}

function MiniConfetti({ reduced, active }: { reduced: boolean; active: boolean }) {
  if (reduced || !active) return null;

  const colors = ["#FFC94B", "#22C55E", "#3A86FF", "#FF6B6B", "#C77DFF", "#F4A261"];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }, (_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: (i % 2 === 0 ? 1 : -1) * (20 + (i % 5) * 14),
            y: 30 + (i % 4) * 18,
            rotate: i % 2 === 0 ? 180 : -160,
            scale: [0, 1, 1, 0.6],
          }}
          transition={{ delay: 0.55 + i * 0.04, duration: 0.9, ease: "easeOut" }}
          className="absolute left-1/2 top-[38%] size-1.5 rounded-sm"
          style={{ backgroundColor: colors[i % colors.length] }}
        />
      ))}
    </div>
  );
}

function DropPhase({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      key="drop"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <p className={workflowTitleClass}>Ideas board</p>
      <p className="font-mono text-[0.5rem] text-hub-foreground/40">
        Spring Campaign · Brainstorm
      </p>

      <div
        className={cn(
          "relative mt-3 flex flex-1 items-center justify-center border border-dashed border-hub-foreground/15 bg-hub-foreground/[0.02] p-3",
          uiCardClass,
        )}
      >
        <div className="flex flex-wrap items-end justify-center gap-2">
          {STICKIES.map((note, i) => (
            <PostIt
              key={note.id}
              text={note.text}
              color={note.color}
              rotate={note.rotate}
              reduced={reduced}
              delay={0.35 + i * 0.22}
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.35 }}
        className={cn(
          "mt-3 flex items-center gap-2 border border-hub-foreground/10 bg-hub-surface px-2.5 py-2",
          uiCardClass,
        )}
      >
        <span className="flex size-5 items-center justify-center rounded-sm bg-hub-accent text-[0.65rem] font-bold text-hub-foreground">
          +
        </span>
        <span className="text-[0.55rem] text-hub-foreground/50">Add idea…</span>
      </motion.div>
    </motion.div>
  );
}

function UpvotePhase({ reduced }: { reduced: boolean }) {
  const [votes, setVotes] = useState<Record<StickyId, VoteTally>>({
    hook: { up: 2, down: 0 },
    ugc: { up: 1, down: 1 },
    stat: { up: 1, down: 0 },
  });
  const [pulseId, setPulseId] = useState<StickyId | null>(null);

  useEffect(() => {
    if (reduced) return;

    const events: { delay: number; id: StickyId; type: "up" | "down" }[] = [
      { delay: 550, id: "hook", type: "up" },
      { delay: 1150, id: "hook", type: "up" },
      { delay: 1750, id: "hook", type: "up" },
      { delay: 2300, id: "ugc", type: "up" },
      { delay: 2900, id: "stat", type: "down" },
    ];

    const timers = events.map(({ delay, id, type }) =>
      window.setTimeout(() => {
        setPulseId(id);
        setVotes((v) => ({
          ...v,
          [id]: {
            up: v[id].up + (type === "up" ? 1 : 0),
            down: v[id].down + (type === "down" ? 1 : 0),
          },
        }));
        window.setTimeout(() => setPulseId(null), 400);
      }, delay),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [reduced]);

  const nets = Object.entries(votes).map(([id, t]) => ({
    id: id as StickyId,
    net: t.up - t.down,
  }));
  const maxNet = Math.max(...nets.map((n) => n.net));
  const leaderId = nets.find((n) => n.net === maxNet)?.id;

  return (
    <motion.div
      key="upvote"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col p-4 sm:p-5"
    >
      <p className={workflowTitleClass}>Upvote the best</p>

      <div
        className={cn(
          "relative mt-3 flex flex-1 items-center justify-center p-3",
          uiCardClass,
          "bg-hub-foreground/[0.02]",
        )}
      >
        <div className="flex flex-wrap items-end justify-center gap-2">
          {STICKIES.map((note, i) => (
            <PostIt
              key={note.id}
              text={note.text}
              color={note.color}
              rotate={note.rotate}
              tally={votes[note.id]}
              leading={leaderId === note.id}
              pulseUp={pulseId === note.id}
              reduced={reduced}
              delay={i * 0.05}
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-3 flex justify-center"
      >
        <div className="inline-flex items-center gap-2.5 rounded-full bg-hub-espresso px-3 py-2">
          <span className="flex items-center gap-1 font-mono text-[0.5rem] uppercase tracking-[0.1em] text-hub-approved">
            <span className="text-[0.55rem] font-bold">▲</span> up
          </span>
          <span className="h-3 w-px bg-hub-paper/20" />
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.1em] text-hub-paper/80">
            Votes update live
          </span>
          <span className="h-3 w-px bg-hub-paper/20" />
          <span className="flex items-center gap-1 font-mono text-[0.5rem] uppercase tracking-[0.1em] text-hub-rejected">
            <span className="text-[0.55rem] font-bold">▼</span> down
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DecidePhase({ reduced }: { reduced: boolean }) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setShowConfetti(true), 500);
    return () => window.clearTimeout(t);
  }, [reduced]);

  return (
    <motion.div
      key="decide"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-full overflow-visible p-4 pb-6 sm:p-5 sm:pb-7"
    >
      <div className="relative">
        <p className={workflowTitleClass}>Room pick</p>
        <div
          className={cn(
            "relative mt-2 flex flex-col items-center gap-1.5 p-2.5 sm:mt-3 sm:gap-2 sm:p-3",
            uiCardClass,
            "bg-hub-foreground/[0.02]",
          )}
        >
          <MiniConfetti reduced={reduced} active={showConfetti} />

          <motion.div
            initial={reduced ? false : { opacity: 0.4, scale: 0.92 }}
            animate={{ opacity: 0.35, scale: 0.9 }}
            className="flex gap-2"
          >
            <PostIt
              text={STICKIES[1].text}
              color={STICKIES[1].color}
              rotate={2}
              tally={{ up: 2, down: 1 }}
              reduced={reduced}
            />
            <PostIt
              text={STICKIES[2].text}
              color={STICKIES[2].color}
              rotate={-3}
              tally={{ up: 1, down: 1 }}
              reduced={reduced}
            />
          </motion.div>

          <motion.div
            initial={reduced ? false : { y: 16, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 280, damping: 20 }}
            className="relative z-10"
          >
            <PostIt
              text={STICKIES[0].text}
              color={STICKIES[0].color}
              rotate={-1}
              tally={{ up: 5, down: 0 }}
              winner
              leading
              reduced={reduced}
              className="w-32"
            />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.35 }}
        className="pointer-events-none absolute bottom-0 left-1/2 z-[60] -translate-x-1/2 translate-y-[calc(50%+0.35rem)]"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-hub-espresso px-4 py-2.5 shadow-[0_8px_24px_rgba(11,11,11,0.28)] ring-2 ring-white/90">
          <motion.span
            animate={reduced ? undefined : { rotate: [0, 12, -12, 0] }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="text-sm"
          >
            🎉
          </motion.span>
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-hub-paper/80">
            Top idea wins
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function IdeasWorkflowIllustration() {
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
        {activePhase === "drop" && <DropPhase reduced={reduced} />}
        {activePhase === "upvote" && <UpvotePhase reduced={reduced} />}
        {activePhase === "decide" && <DecidePhase reduced={reduced} />}
      </AnimatePresence>
    </WorkflowIllustrationShell>
  );
}
