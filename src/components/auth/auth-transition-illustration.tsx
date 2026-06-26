"use client";

import { motion, useReducedMotion } from "framer-motion";

type AuthTransitionIllustrationProps = {
  reduced?: boolean;
};

const TILES = [
  { className: "bg-gradient-to-br from-[#7B2CBF] to-[#C77DFF]", x: -18, y: -14, delay: 0 },
  { className: "bg-gradient-to-br from-[#E9A319] to-[#F4A261]", x: 16, y: -10, delay: 0.12 },
  { className: "bg-gradient-to-br from-[#2667CC] to-[#48CAE4]", x: 0, y: 16, delay: 0.24 },
] as const;

export function AuthTransitionIllustration({
  reduced = false,
  stageIndex = 0,
}: AuthTransitionIllustrationProps & { stageIndex?: number }) {
  const prefersReducedMotion = useReducedMotion();
  const isReduced = reduced || !!prefersReducedMotion;

  return (
    <div
      className="relative mx-auto flex h-[7.5rem] w-[7.5rem] items-center justify-center"
      aria-hidden
    >
      <motion.div
        className="absolute inset-1 rounded-[1.35rem] border border-hub-final/20 bg-gradient-to-br from-hub-final/10 via-white to-hub-accent/10"
        animate={
          isReduced
            ? undefined
            : {
                scale: [1, 1.04, 1],
                opacity: [0.75, 1, 0.75],
              }
        }
        transition={
          isReduced
            ? undefined
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <motion.div
        className="absolute inset-0 rounded-[1.5rem] border border-dashed border-hub-espresso/10"
        animate={isReduced ? undefined : { rotate: 360 }}
        transition={
          isReduced
            ? undefined
            : { duration: 18, repeat: Infinity, ease: "linear" }
        }
      />

      <div className="relative z-10 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-xl border border-hub-espresso/10 bg-white shadow-[0_12px_32px_rgba(26,15,8,0.1)]">
        <div className="absolute left-2.5 top-2.5 flex gap-1">
          <span className="size-1.5 rounded-full bg-hub-espresso/12" />
          <span className="size-1.5 rounded-full bg-hub-espresso/12" />
          <span className="size-1.5 rounded-full bg-hub-espresso/12" />
        </div>

        <motion.div
          className="mt-3 h-1.5 w-10 rounded-full bg-hub-espresso/10"
          animate={
            isReduced
              ? undefined
              : { width: ["2.5rem", "3rem", "2.5rem"], opacity: [0.45, 0.8, 0.45] }
          }
          transition={
            isReduced
              ? undefined
              : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
          }
        />

        {TILES.map((tile, index) => {
          const isActive = index === stageIndex % TILES.length;

          return isReduced ? (
            <span
              key={index}
              className={`absolute size-3 rounded-sm ${tile.className} ${isActive ? "scale-110" : "opacity-60"}`}
              style={{
                transform: `translate(${tile.x * 0.35}px, ${tile.y * 0.35}px)`,
              }}
            />
          ) : (
            <motion.span
              key={index}
              className={`absolute size-3 rounded-sm shadow-sm ${tile.className}`}
              initial={{ opacity: 0, scale: 0.6, x: tile.x * 1.6, y: tile.y * 1.6 }}
              animate={{
                opacity: isActive ? [0.7, 1, 0.7] : [0.25, 0.45, 0.25],
                scale: isActive ? [0.95, 1.15, 0.95] : [0.75, 0.85, 0.75],
                x: isActive
                  ? [tile.x * 1.2, tile.x * 0.2, tile.x * 1.2]
                  : [tile.x * 1.6, tile.x * 0.5, tile.x * 1.6],
                y: isActive
                  ? [tile.y * 1.2, tile.y * 0.2, tile.y * 1.2]
                  : [tile.y * 1.6, tile.y * 0.5, tile.y * 1.6],
              }}
              transition={{
                duration: isActive ? 1.8 : 2.4,
                repeat: Infinity,
                delay: tile.delay,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
