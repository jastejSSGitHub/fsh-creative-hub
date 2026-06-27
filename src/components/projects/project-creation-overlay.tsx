"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { ProjectCreationIllustration } from "@/components/projects/project-creation-illustration";
import {
  PROJECT_CREATION_STAGE_MS,
  PROJECT_CREATION_STAGES,
} from "@/lib/projects/creation-stages";

type ProjectCreationOverlayProps = {
  visible: boolean;
  projectName?: string;
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
        className="h-full rounded-full bg-hub-accent/80 transition-[width] duration-500"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
    );
  }

  return (
    <>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-hub-accent/25"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />
      <motion.div
        className="absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-hub-accent/40 via-hub-accent to-hub-accent/40"
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
  count,
}: {
  activeIndex: number;
  reduced: boolean;
  count: number;
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <motion.span
          key={index}
          className="h-1 rounded-full bg-hub-foreground/12"
          animate={{
            width: activeIndex === index ? 20 : 6,
            backgroundColor:
              activeIndex >= index
                ? "rgba(38, 103, 204, 0.95)"
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

function resolveStageIndex(startedAt: number | null, stageMs: number) {
  if (!startedAt) return 0;
  return Math.min(
    Math.floor((Date.now() - startedAt) / stageMs),
    PROJECT_CREATION_STAGES.length - 1,
  );
}

export function ProjectCreationOverlay({
  visible,
  projectName,
  startedAt,
}: ProjectCreationOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setStageIndex(0);
      return;
    }

    setStageIndex(resolveStageIndex(startedAt, PROJECT_CREATION_STAGE_MS));

    const timer = window.setInterval(() => {
      setStageIndex((current) =>
        Math.min(current + 1, PROJECT_CREATION_STAGES.length - 1),
      );
    }, PROJECT_CREATION_STAGE_MS);

    return () => window.clearInterval(timer);
  }, [visible, startedAt]);

  const activeLabel = PROJECT_CREATION_STAGES[stageIndex] ?? PROJECT_CREATION_STAGES[0];
  const progress = ((stageIndex + 1) / PROJECT_CREATION_STAGES.length) * 100;
  const trimmedName = projectName?.trim();

  return (
    <AnimatePresence>
      {visible && (
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
                <ProjectCreationIllustration
                  reduced={reduced}
                  stageIndex={stageIndex}
                />
              </motion.div>

              {trimmedName ? (
                <p className="mt-5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-hub-foreground/45">
                  {trimmedName}
                </p>
              ) : null}

              <div className="mt-4 h-8 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stageIndex}
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

              <StageIndicators
                activeIndex={stageIndex}
                reduced={reduced}
                count={PROJECT_CREATION_STAGES.length}
              />

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
