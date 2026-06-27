"use client";

import { motion, useReducedMotion } from "framer-motion";

type ProjectCreationIllustrationProps = {
  reduced?: boolean;
  stageIndex?: number;
};

const ASSET_COLORS = [
  "bg-hub-primary",
  "bg-hub-accent",
  "bg-hub-approved",
  "bg-[#E85D4C]",
] as const;

export function ProjectCreationIllustration({
  reduced = false,
  stageIndex = 0,
}: ProjectCreationIllustrationProps) {
  const prefersReducedMotion = useReducedMotion();
  const isReduced = reduced || !!prefersReducedMotion;
  const activeIndex = stageIndex % ASSET_COLORS.length;

  return (
    <div
      className="relative mx-auto flex h-[7.5rem] w-[7.5rem] items-center justify-center"
      aria-hidden
    >
      {/* Soft warm glow behind the folder */}
      <motion.div
        className="absolute inset-3 rounded-3xl bg-hub-accent/20"
        animate={
          isReduced
            ? undefined
            : { scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }
        }
        transition={
          isReduced
            ? undefined
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Folder body */}
      <div className="relative z-10 w-[5.25rem]">
        {/* Folder tab */}
        <div className="relative z-10 h-3.5 w-[2.25rem] rounded-t-lg border-2 border-b-0 border-hub-primary bg-hub-primary/15" />

        {/* Folder pocket */}
        <div className="relative -mt-0.5 overflow-hidden rounded-xl rounded-tl-sm border-2 border-hub-primary bg-hub-primary/10 px-2.5 pb-2.5 pt-2">
          {/* Asset thumbnails landing inside the folder */}
          <div className="flex items-end justify-center gap-1.5">
            {ASSET_COLORS.map((color, index) => {
              const isActive = index === activeIndex;

              return (
                <motion.span
                  key={index}
                  className={`block h-5 w-4 rounded-sm ${color} shadow-sm`}
                  initial={false}
                  animate={
                    isReduced
                      ? { y: 0, opacity: index <= activeIndex ? 1 : 0.25, scale: 1 }
                      : isActive
                        ? {
                            y: [10, 0, 0],
                            opacity: [0, 1, 1],
                            scale: [0.7, 1, 1],
                          }
                        : {
                            y: 0,
                            opacity: index < activeIndex ? 1 : 0.2,
                            scale: index < activeIndex ? 1 : 0.85,
                          }
                  }
                  transition={
                    isReduced
                      ? { duration: 0.01 }
                      : isActive
                        ? {
                            duration: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                          }
                        : { duration: 0.3 }
                  }
                />
              );
            })}
          </div>
        </div>

        {/* Document dropping into the folder — loops continuously */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2"
          animate={
            isReduced
              ? { y: -6, opacity: 0.9 }
              : {
                  y: [-22, 2, 2, -22],
                  opacity: [0, 1, 1, 0],
                  rotate: [-6, 0, 0, -6],
                }
          }
          transition={
            isReduced
              ? { duration: 0.01 }
              : {
                  duration: 2.4,
                  repeat: Infinity,
                  ease: [0.22, 1, 0.36, 1],
                  times: [0, 0.45, 0.7, 1],
                }
          }
        >
          <div className="relative h-7 w-5 rounded-sm border-2 border-hub-primary bg-hub-surface shadow-[0_4px_12px_rgba(24,160,251,0.25)]">
            <div className="absolute right-0 top-0 size-2 rounded-bl-sm bg-hub-accent" />
            <div className="mt-3 space-y-1 px-1">
              <div className="h-0.5 w-full rounded-full bg-hub-primary/40" />
              <div className="h-0.5 w-2/3 rounded-full bg-hub-primary/25" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bouncing dots — clear "loading" cue */}
      <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="size-1.5 rounded-full bg-hub-primary"
            animate={
              isReduced
                ? { opacity: 0.6, y: 0 }
                : { y: [0, -4, 0], opacity: [0.35, 1, 0.35] }
            }
            transition={
              isReduced
                ? { duration: 0.01 }
                : {
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.15,
                  }
            }
          />
        ))}
      </div>
    </div>
  );
}
