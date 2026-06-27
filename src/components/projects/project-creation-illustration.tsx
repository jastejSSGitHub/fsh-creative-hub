"use client";

import { motion, useReducedMotion } from "framer-motion";

type ProjectCreationIllustrationProps = {
  reduced?: boolean;
  stageIndex?: number;
};

const TILES = [
  { className: "bg-gradient-to-br from-[#2667CC] to-[#48CAE4]", x: -20, y: -12, delay: 0 },
  { className: "bg-gradient-to-br from-[#E85D4C] to-[#F4A261]", x: 18, y: -8, delay: 0.1 },
  { className: "bg-gradient-to-br from-[#2A9D8F] to-[#52B788]", x: -4, y: 18, delay: 0.2 },
  { className: "bg-gradient-to-br from-[#7B2CBF] to-[#C77DFF]", x: 14, y: 14, delay: 0.3 },
] as const;

export function ProjectCreationIllustration({
  reduced = false,
  stageIndex = 0,
}: ProjectCreationIllustrationProps) {
  const prefersReducedMotion = useReducedMotion();
  const isReduced = reduced || !!prefersReducedMotion;

  return (
    <div
      className="relative mx-auto flex h-[7.5rem] w-[7.5rem] items-center justify-center"
      aria-hidden
    >
      <motion.div
        className="absolute inset-1 rounded-[1.35rem] border border-hub-accent/20 bg-gradient-to-br from-hub-accent/10 via-white to-hub-final/10"
        animate={
          isReduced
            ? undefined
            : {
                scale: [1, 1.05, 1],
                opacity: [0.7, 1, 0.7],
              }
        }
        transition={
          isReduced
            ? undefined
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <motion.div
        className="absolute inset-0 rounded-[1.5rem] border border-dashed border-hub-foreground/10"
        animate={isReduced ? undefined : { rotate: -360 }}
        transition={
          isReduced
            ? undefined
            : { duration: 20, repeat: Infinity, ease: "linear" }
        }
      />

      <div className="relative z-10 flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-end rounded-xl border border-hub-foreground/10 bg-hub-surface px-3 pb-3 shadow-[0_12px_32px_rgba(26,15,8,0.1)]">
        <div className="absolute left-2.5 top-2.5 flex gap-1">
          <span className="size-1.5 rounded-full bg-hub-foreground/12" />
          <span className="size-1.5 rounded-full bg-hub-foreground/12" />
          <span className="size-1.5 rounded-full bg-hub-foreground/12" />
        </div>

        <motion.div
          className="mb-2 h-2 w-14 rounded-full bg-hub-foreground/8"
          animate={
            isReduced
              ? undefined
              : { width: ["3.5rem", "4rem", "3.5rem"], opacity: [0.5, 0.85, 0.5] }
          }
          transition={
            isReduced
              ? undefined
              : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }
        />

        <div className="grid w-full grid-cols-2 gap-1.5">
          {[0, 1, 2, 3].map((index) => {
            const tile = TILES[index];
            const isActive = index === stageIndex % TILES.length;

            return (
              <motion.span
                key={index}
                className={`block h-3 rounded-[4px] ${tile.className}`}
                animate={
                  isReduced
                    ? undefined
                    : isActive
                      ? { scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }
                      : { scale: 1, opacity: 0.55 }
                }
                transition={
                  isReduced
                    ? undefined
                    : {
                        duration: 1.1,
                        repeat: isActive ? Infinity : 0,
                        ease: "easeInOut",
                        delay: tile.delay,
                      }
                }
              />
            );
          })}
        </div>
      </div>

      {TILES.map((tile, index) => {
        const isActive = index === stageIndex % TILES.length;

        return (
          <motion.span
            key={`orbit-${index}`}
            className={`absolute size-3 rounded-md ${tile.className} shadow-sm`}
            style={{ left: "50%", top: "50%" }}
            animate={
              isReduced
                ? { x: tile.x, y: tile.y, opacity: isActive ? 0.9 : 0.35 }
                : {
                    x: [tile.x, tile.x + 3, tile.x],
                    y: [tile.y, tile.y - 4, tile.y],
                    opacity: isActive ? [0.7, 1, 0.7] : 0.25,
                    rotate: [0, 8, 0],
                  }
            }
            transition={
              isReduced
                ? { duration: 0.01 }
                : {
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: tile.delay,
                  }
            }
          />
        );
      })}
    </div>
  );
}
