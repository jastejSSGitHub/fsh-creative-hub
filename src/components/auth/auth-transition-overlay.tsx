"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { AuthTransitionIllustration } from "@/components/auth/auth-transition-illustration";
import {
  AUTH_TRANSITION_STAGE_MS,
  getAuthTransitionStages,
  type AuthTransitionKind,
} from "@/lib/auth/transition-stages";

type AuthTransitionOverlayProps = {
  visible: boolean;
  kind: AuthTransitionKind | null;
  startedAt: number | null;
};

function ProgressShimmer({
  reduced,
  progress,
}: {
  reduced: boolean;
  progress: number;
}) {
  if (reduced) {
    return (
      <div
        className="h-full rounded-full bg-hub-final/80 transition-[width] duration-500"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
    );
  }

  return (
    <>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-hub-final/25"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />
      <motion.div
        className="absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-hub-final/40 via-hub-final to-hub-final/40"
        aria-hidden
        initial={{ x: "-120%" }}
        animate={{ x: "320%" }}
        transition={{
          duration: 1.35,
          repeat: Infinity,
          ease: [0.45, 0, 0.55, 1],
        }}
      />
    </>
  );
}

function StageIndicators({
  activeIndex,
  reduced,
}: {
  activeIndex: number;
  reduced: boolean;
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2" aria-hidden>
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-1 rounded-full bg-hub-foreground/12"
          animate={{
            width: activeIndex === index ? 20 : 6,
            backgroundColor:
              activeIndex >= index
                ? "rgba(255, 201, 75, 0.95)"
                : "rgba(11, 11, 11, 0.12)",
          }}
          transition={
            reduced
              ? { duration: 0.01 }
              : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
          }
        />
      ))}
    </div>
  );
}

function resolveStageIndex(startedAt: number | null, stageCount: number) {
  if (!startedAt) return 0;
  return Math.min(
    Math.floor((Date.now() - startedAt) / AUTH_TRANSITION_STAGE_MS),
    stageCount - 1,
  );
}

export function AuthTransitionOverlay({
  visible,
  kind,
  startedAt,
}: AuthTransitionOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;
  const stages = kind ? getAuthTransitionStages(kind) : [];
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!visible || !kind) {
      setStageIndex(0);
      return;
    }

    setStageIndex(resolveStageIndex(startedAt, stages.length));

    const timer = window.setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, stages.length - 1));
    }, AUTH_TRANSITION_STAGE_MS);

    return () => window.clearInterval(timer);
  }, [kind, visible, startedAt, stages.length]);

  const activeLabel = stages[stageIndex] ?? "";
  const progress = ((stageIndex + 1) / stages.length) * 100;

  return (
    <AnimatePresence>
      {visible && kind && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-hub-foreground/45 px-6 backdrop-blur-[6px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={activeLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.22, ease: "easeOut" }}
        >
          <motion.div
            className="w-full max-w-xs overflow-hidden rounded-2xl border border-hub-foreground/10 bg-hub-paper shadow-[0_24px_64px_rgba(26,15,8,0.22)]"
            initial={reduced ? false : { opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 32,
              mass: 0.85,
            }}
          >
            <div className="px-8 pb-9 pt-8 text-center">
              <motion.div
                initial={reduced ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: reduced ? 0 : 0.05, duration: 0.32 }}
              >
                <AuthTransitionIllustration
                  reduced={reduced}
                  stageIndex={stageIndex}
                />
              </motion.div>

              <div className="mt-6 h-8 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${kind}-${stageIndex}`}
                    className="font-display text-lg font-semibold tracking-tight text-hub-foreground"
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: reduced ? 0.01 : 0.32, ease: "easeOut" }}
                  >
                    {activeLabel}
                  </motion.p>
                </AnimatePresence>
              </div>

              <StageIndicators activeIndex={stageIndex} reduced={reduced} />

              <div className="relative mx-auto mt-5 h-1 w-28 overflow-hidden rounded-full bg-hub-foreground/10">
                <ProgressShimmer reduced={reduced} progress={progress} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
