"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { TrimmedLoopVideo } from "@/components/landing/trimmed-loop-video";
import { cn } from "@/lib/utils";

const uiCardClass = "rounded-sm";

const CONSENSUS_ASSET_SRC = "/media/capabilities/film/td-video.mp4";
const CONSENSUS_ASSET_POSTER = "/media/capabilities/brand-system/brand-1.png";

const DROP_PROJECT_NAME = "Blenz Branding";

type DropAsset =
  | { id: string; kind: "image"; src: string; alt: string }
  | { id: string; kind: "video"; src: string; alt: string };

const DROP_ASSETS: DropAsset[] = [
  {
    id: "fresh-for-you",
    kind: "image",
    src: "/media/blenz/fresh-for-you.png",
    alt: "Blenz fresh for you graphic",
  },
  {
    id: "spring-vibes",
    kind: "image",
    src: "/media/blenz/springvibes.png",
    alt: "Blenz spring vibes graphic",
  },
  {
    id: "refreshing-beverages",
    kind: "video",
    src: "/media/blenz/refreshing-beverages.mp4",
    alt: "Blenz refreshing beverages video",
  },
];

type ReactionKind = "fire" | "up" | "check";

const REACTIONS: { kind: ReactionKind }[] = [
  { kind: "fire" },
  { kind: "up" },
  { kind: "up" },
  { kind: "check" },
];

function ReactionIcon({ kind }: { kind: ReactionKind }) {
  if (kind === "fire") {
    return (
      <span className="text-[1.2rem] leading-none" role="img" aria-label="Fire">
        🔥
      </span>
    );
  }

  if (kind === "up") {
    return (
      <span
        className="text-[1.05rem] font-bold leading-none text-hub-approved"
        role="img"
        aria-label="Thumbs up"
      >
        +1
      </span>
    );
  }

  return (
    <span className="text-sm font-extrabold leading-none text-hub-approved" aria-hidden>
      ✓
    </span>
  );
}

function MediaThumb({
  asset,
  className,
  videoLoop = false,
}: {
  asset: DropAsset;
  className?: string;
  videoLoop?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-hub-espresso/5 shadow-[0_6px_18px_rgba(11,11,11,0.18)]",
        uiCardClass,
        className,
      )}
    >
      <div className="relative aspect-[4/5]">
        {asset.kind === "image" ? (
          <Image src={asset.src} alt={asset.alt} fill sizes="96px" className="object-cover" />
        ) : (
          <video
            src={asset.src}
            autoPlay={videoLoop}
            muted
            loop={videoLoop}
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
            aria-label={asset.alt}
          />
        )}
      </div>
    </div>
  );
}
const PICK_LOOP_MS = 5800;
const DROP_LOOP_MS = 7000;
const CONSENSUS_LOOP_MS = 6200;

const PICK_SWATCHES = [
  "from-[#E85D4C] to-[#F4A261]",
  "from-[#2A9D8F] to-[#48CAE4]",
  "from-[#7B2CBF] to-[#C77DFF]",
] as const;

type LoopEvent<T> = {
  at: number;
  apply: (current: T) => T;
};

function useTimedLoop<T>(
  initial: T,
  finalState: T,
  events: LoopEvent<T>[],
  loopDuration: number,
  reduced: boolean,
  inView: boolean,
): T {
  const [state, setState] = useState(initial);
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const finalRef = useRef(finalState);
  finalRef.current = finalState;

  useEffect(() => {
    if (reduced) {
      setState(finalRef.current);
      return;
    }

    if (!inView) return;

    let cancelled = false;
    let generation = 0;
    const timeouts: number[] = [];

    const clearAll = () => {
      timeouts.forEach(window.clearTimeout);
      timeouts.length = 0;
    };

    const scheduleLoop = (gen: number) => {
      if (cancelled || gen !== generation) return;

      clearAll();
      setState(initialRef.current);

      for (const { at, apply } of eventsRef.current) {
        timeouts.push(
          window.setTimeout(() => {
            if (cancelled || gen !== generation) return;
            setState((current) => apply(current));
          }, at),
        );
      }

      timeouts.push(
        window.setTimeout(() => {
          if (cancelled || gen !== generation) return;
          scheduleLoop(gen);
        }, loopDuration),
      );
    };

    generation += 1;
    scheduleLoop(generation);

    return () => {
      cancelled = true;
      generation += 1;
      clearAll();
    };
  }, [reduced, inView, loopDuration]);

  return state;
}

function VisualFrame({
  children,
  accentClass,
}: {
  children: ReactNode;
  accentClass?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[5/4] min-h-[10.5rem] overflow-hidden rounded-lg border border-hub-espresso/10 bg-gradient-to-b from-white to-hub-paper shadow-[0_10px_36px_rgba(11,11,11,0.07)]",
        accentClass,
      )}
    >
      {children}
    </div>
  );
}

function MiniConfetti({ active, reduced }: { active: boolean; reduced: boolean }) {
  if (reduced || !active) return null;

  const colors = ["#FFC94B", "#22C55E", "#3A86FF", "#FF6B6B", "#C77DFF"];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 12 }, (_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: (i % 2 === 0 ? 1 : -1) * (12 + (i % 4) * 10),
            y: -18 - (i % 3) * 12,
            rotate: i % 2 === 0 ? 140 : -120,
            scale: [0, 1, 1, 0.5],
          }}
          transition={{ delay: 0.15 + i * 0.035, duration: 0.75, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 size-1.5 rounded-sm"
          style={{ backgroundColor: colors[i % colors.length] }}
        />
      ))}
    </div>
  );
}

type PickState = { phase: "enter" | "hover" | "select" };

const PICK_INITIAL: PickState = { phase: "enter" };
const PICK_FINAL: PickState = { phase: "select" };
const PICK_EVENTS: LoopEvent<PickState>[] = [
  { at: 900, apply: () => ({ phase: "hover" }) },
  { at: 1700, apply: () => ({ phase: "select" }) },
];

function PickProjectVisual({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "0px", amount: 0.15 });
  const { phase } = useTimedLoop(
    PICK_INITIAL,
    PICK_FINAL,
    PICK_EVENTS,
    PICK_LOOP_MS,
    reduced,
    inView,
  );

  const projects = [
    { name: "Q1 Launch", dim: true },
    { name: "Spring Campaign", dim: false, selected: true },
    { name: "Brand Refresh", dim: true },
  ];

  return (
    <VisualFrame accentClass="from-[#F8F2FF] to-white">
      <div ref={ref} className="flex h-full flex-col p-3.5 sm:p-4">
        <p className="font-mono text-[0.45rem] uppercase tracking-[0.12em] text-hub-espresso/35">
          Your projects
        </p>

        <div className="relative mt-2 flex flex-1 items-center justify-center">
          <div className="grid w-full grid-cols-3 gap-1.5">
            {projects.map((project, i) => {
              const isTarget = project.selected;
              const isSelected = isTarget && phase === "select";

              return (
                <motion.div
                  key={project.name}
                  initial={false}
                  animate={{
                    opacity: project.dim && phase === "select" ? 0.5 : 1,
                    y: 0,
                    scale: isSelected ? 1.06 : isTarget && phase === "hover" ? 1.03 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 22,
                  }}
                  className={cn(
                    "relative border bg-white p-2 shadow-sm",
                    uiCardClass,
                    isSelected
                      ? "border-hub-accent ring-2 ring-hub-accent/45 shadow-[0_8px_24px_rgba(255,201,75,0.28)]"
                      : "border-hub-espresso/10",
                  )}
                >
                  <div
                    className={cn(
                      "h-5 bg-gradient-to-br",
                      PICK_SWATCHES[i],
                      uiCardClass,
                    )}
                  />
                  <p className="mt-1.5 truncate text-[0.5rem] font-semibold text-hub-espresso/80">
                    {project.name}
                  </p>
                  {isSelected ? (
                    <motion.span
                      initial={false}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18 }}
                      className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-hub-approved text-[0.45rem] text-white shadow-sm"
                    >
                      ✓
                    </motion.span>
                  ) : null}
                </motion.div>
              );
            })}
          </div>

          {!reduced && inView ? (
            <motion.div
              initial={false}
              animate={{
                opacity: phase === "enter" ? 0 : 1,
                x: phase === "enter" ? 24 : 58,
                y: phase === "enter" ? 36 : 28,
              }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute z-20"
            >
              <div className="size-3 rounded-full border-2 border-hub-espresso/70 bg-white shadow-md" />
              <div className="absolute left-2 top-2 h-3 w-px origin-top rotate-[135deg] bg-hub-espresso/50" />
            </motion.div>
          ) : null}
        </div>

        <motion.div
          initial={false}
          animate={{
            opacity: phase === "select" ? 1 : 0,
            y: phase === "select" ? 0 : 6,
          }}
          transition={{ duration: 0.35 }}
          className="flex justify-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-hub-espresso px-2.5 py-1.5 font-mono text-[0.45rem] uppercase tracking-[0.1em] text-hub-paper/85">
            <span className="text-hub-accent">●</span>
            Project picked
          </span>
        </motion.div>
      </div>
    </VisualFrame>
  );
}

function DragPointer() {
  return (
    <div className="pointer-events-none absolute -bottom-0.5 -right-0.5 z-10">
      <div className="size-3 rounded-full border-2 border-hub-espresso/75 bg-white shadow-md" />
      <div className="absolute left-2 top-2 h-3 w-px origin-top rotate-[135deg] bg-hub-espresso/55" />
    </div>
  );
}

type DropState = { landed: number; dragging: number | null; pulseId: number | null };

const DROP_INITIAL: DropState = { landed: 0, dragging: null, pulseId: null };
const DROP_FINAL: DropState = { landed: 3, dragging: null, pulseId: null };
const DROP_EVENTS: LoopEvent<DropState>[] = [
  { at: 350, apply: () => ({ landed: 0, dragging: 0, pulseId: null }) },
  { at: 950, apply: () => ({ landed: 1, dragging: null, pulseId: 0 }) },
  { at: 1100, apply: (s) => ({ ...s, pulseId: null }) },
  { at: 1500, apply: (s) => ({ ...s, dragging: 1 }) },
  { at: 2100, apply: () => ({ landed: 2, dragging: null, pulseId: 1 }) },
  { at: 2250, apply: (s) => ({ ...s, pulseId: null }) },
  { at: 2650, apply: (s) => ({ ...s, dragging: 2 }) },
  { at: 3250, apply: () => ({ landed: 3, dragging: null, pulseId: 2 }) },
  { at: 3400, apply: (s) => ({ ...s, pulseId: null }) },
];

function DropWorkVisual({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "0px", amount: 0.15 });
  const { landed, dragging, pulseId } = useTimedLoop(
    DROP_INITIAL,
    DROP_FINAL,
    DROP_EVENTS,
    DROP_LOOP_MS,
    reduced,
    inView,
  );

  return (
    <VisualFrame>
      <div ref={ref} className="flex h-full flex-col p-3.5 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="truncate text-[0.55rem] font-semibold text-hub-espresso">{DROP_PROJECT_NAME}</p>
          <motion.span
            key={landed}
            initial={reduced ? false : { scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25 }}
            className="font-mono text-[0.45rem] text-hub-approved"
          >
            {landed}/3 in
          </motion.span>
        </div>

        <motion.div
          animate={
            reduced
              ? undefined
              : {
                  borderColor:
                    dragging !== null
                      ? "rgba(255,201,75,0.7)"
                      : landed > 0
                        ? "rgba(34,197,94,0.45)"
                        : "rgba(11,11,11,0.14)",
                }
          }
          transition={{ duration: 0.35 }}
          className={cn(
            "relative mt-2 flex flex-1 flex-col justify-end border-2 border-dashed border-hub-espresso/12 bg-hub-espresso/[0.02] p-2",
            uiCardClass,
          )}
        >
          <div className="grid w-full grid-cols-3 gap-1.5">
            {DROP_ASSETS.map((asset, i) => {
              const inSlot = landed > i;
              const isDraggingHere = dragging === i;
              const pulsing = pulseId === i;

              return (
                <div key={asset.id} className="relative aspect-[4/5]">
                  <div
                    className={cn(
                      "absolute inset-0 border border-dashed border-hub-espresso/15 bg-white/50",
                      uiCardClass,
                      inSlot && "border-transparent bg-transparent",
                      isDraggingHere && "border-hub-accent/40 bg-hub-accent/5",
                    )}
                  />

                  {inSlot ? (
                    <motion.div
                      initial={reduced ? false : { scale: 0.92 }}
                      animate={{ scale: pulsing ? [1, 1.08, 1] : 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      className={cn(
                        "absolute inset-0",
                        pulsing && "ring-2 ring-hub-approved/55",
                      )}
                    >
                      <MediaThumb
                        asset={asset}
                        className="h-full"
                        videoLoop={asset.kind === "video"}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-hub-approved" />
                    </motion.div>
                  ) : null}

                  {isDraggingHere && !reduced ? (
                    <motion.div
                      key={`drag-${asset.id}-${landed}`}
                      className="absolute inset-0 z-20"
                      initial={{ y: "-95%", opacity: 0.9 }}
                      animate={{ y: "0%", opacity: 1 }}
                      transition={{ duration: 0.58, ease: [0.33, 1, 0.45, 1] }}
                    >
                      <MediaThumb
                        asset={asset}
                        className="h-full ring-2 ring-hub-accent shadow-[0_10px_24px_rgba(11,11,11,0.2)]"
                      />
                      <DragPointer />
                    </motion.div>
                  ) : null}

                  {pulsing && !reduced ? (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: [0, 1, 0], y: -12 }}
                      transition={{ duration: 0.5 }}
                      className="pointer-events-none absolute -top-1 right-0 z-30 rounded-sm bg-hub-approved px-1 py-0.5 font-mono text-[0.4rem] font-bold text-white"
                    >
                      ✓
                    </motion.span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {landed === 0 && dragging === null && !reduced ? (
            <p className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 font-mono text-[0.4rem] uppercase tracking-[0.1em] text-hub-espresso/40">
              Drop here
            </p>
          ) : null}

          <motion.div
            initial={false}
            animate={{
              opacity: landed === 3 ? 1 : 0,
              scale: landed === 3 ? 1 : 0.92,
              y: landed === 3 ? 0 : 4,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute -bottom-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-hub-espresso px-2.5 py-1 font-mono text-[0.45rem] uppercase tracking-[0.1em] text-hub-paper shadow-[0_6px_20px_rgba(11,11,11,0.2)]"
          >
            Work dropped ✓
          </motion.div>
        </motion.div>
      </div>
    </VisualFrame>
  );
}

type ConsensusState = { votes: number; won: boolean };

const CONSENSUS_INITIAL: ConsensusState = { votes: 0, won: false };
const CONSENSUS_FINAL: ConsensusState = { votes: 4, won: true };
const CONSENSUS_EVENTS: LoopEvent<ConsensusState>[] = [
  { at: 750, apply: () => ({ votes: 1, won: false }) },
  { at: 1250, apply: () => ({ votes: 2, won: false }) },
  { at: 1750, apply: () => ({ votes: 3, won: false }) },
  { at: 2250, apply: () => ({ votes: 4, won: false }) },
  { at: 2700, apply: () => ({ votes: 4, won: true }) },
];

function ReachConsensusVisual({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "0px", amount: 0.15 });
  const { votes, won } = useTimedLoop(
    CONSENSUS_INITIAL,
    CONSENSUS_FINAL,
    CONSENSUS_EVENTS,
    CONSENSUS_LOOP_MS,
    reduced,
    inView,
  );

  return (
    <VisualFrame accentClass="from-[#F2FFF6] to-white">
      <div ref={ref} className="relative flex h-full flex-col items-center justify-center p-3.5 sm:p-4">
        <MiniConfetti active={won} reduced={reduced} />

        <motion.div
          initial={false}
          animate={{
            opacity: 1,
            scale: won ? 1.04 : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className={cn(
            "relative w-[4.75rem] overflow-hidden shadow-[0_8px_24px_rgba(11,11,11,0.14)]",
            uiCardClass,
            won && "ring-2 ring-hub-approved/50",
          )}
        >
          <div className="relative aspect-[4/5] bg-hub-espresso/5">
            {reduced ? (
              <Image
                src={CONSENSUS_ASSET_POSTER}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <TrimmedLoopVideo
                src={CONSENSUS_ASSET_SRC}
                startAt={0}
                label="Campaign video asset"
              />
            )}
          </div>
          <motion.div
            initial={false}
            animate={{
              opacity: won ? 1 : 0,
              scale: won ? 1 : 0.85,
            }}
            transition={{ type: "spring", stiffness: 450, damping: 16 }}
            className="absolute inset-0 flex items-center justify-center bg-hub-approved/25"
          >
            <span className="rounded-sm border-2 border-hub-approved bg-white px-1.5 py-0.5 font-mono text-[0.45rem] font-bold uppercase tracking-wider text-hub-approved">
              Approved
            </span>
          </motion.div>
        </motion.div>

        <div className="mt-3 flex min-h-[2rem] items-center gap-2">
          {REACTIONS.map((reaction, i) => {
            const visible = votes > i;

            return (
              <div
                key={`reaction-${i}`}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 bg-white shadow-[0_3px_10px_rgba(11,11,11,0.14)] transition-all duration-300",
                  visible
                    ? "scale-100 border-hub-espresso/25 opacity-100 ring-2 ring-hub-accent/30"
                    : "scale-90 border-dashed border-hub-espresso/30 bg-hub-espresso/[0.04] opacity-50 shadow-none ring-0",
                )}
              >
                {visible ? <ReactionIcon kind={reaction.kind} /> : null}
              </div>
            );
          })}
        </div>

        <div className="mt-3 w-full max-w-[8.5rem]">
          <div className="h-1.5 overflow-hidden rounded-full bg-hub-espresso/10">
            <motion.div
              initial={false}
              animate={{ width: `${votes * 25}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-hub-approved to-[#06D6A0]"
            />
          </div>
          <p className="mt-1 text-center font-mono text-[0.45rem] text-hub-espresso/45">
            {votes}/4 votes
          </p>
        </div>

        <motion.div
          initial={false}
          animate={{
            opacity: won ? 1 : 0,
            y: won ? 0 : 8,
            scale: won ? 1 : 0.92,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-hub-espresso px-2.5 py-1.5 font-mono text-[0.45rem] uppercase tracking-[0.1em] text-hub-paper shadow-[0_6px_20px_rgba(11,11,11,0.22)] ring-2 ring-white/80">
            <motion.span
              animate={won && !reduced ? { rotate: [0, 14, -14, 0] } : { rotate: 0 }}
              transition={{ duration: 0.45 }}
            >
              🎉
            </motion.span>
            Consensus reached
          </span>
        </motion.div>
      </div>
    </VisualFrame>
  );
}

const VISUALS = {
  pick: PickProjectVisual,
  drop: DropWorkVisual,
  consensus: ReachConsensusVisual,
} as const;

export type HowItWorksStepId = keyof typeof VISUALS;

export function HowItWorksStepVisual({ step }: { step: HowItWorksStepId }) {
  const reduced = !!useReducedMotion();
  const Visual = VISUALS[step];

  return <Visual reduced={reduced} />;
}
