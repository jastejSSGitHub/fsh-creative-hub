"use client";

import { motion, useReducedMotion } from "framer-motion";

import { loopTransition } from "@/lib/motion/transitions";

const STICKIES = [
  { id: "a", color: "bg-[#FFF3B0]", rotate: -5, x: "12%", y: "18%", delay: 0 },
  { id: "b", color: "bg-[#C8F0D8]", rotate: 4, x: "42%", y: "8%", delay: 0.15 },
  { id: "c", color: "bg-[#FFD6E0]", rotate: -2, x: "58%", y: "32%", delay: 0.3 },
] as const;

export function BrainstormTemplateIllustration() {
  const reduced = useReducedMotion();

  return (
    <div className="relative h-full w-full" aria-hidden>
      <div className="absolute inset-2 rounded-md border border-white/20 bg-white/90 shadow-sm">
        <div className="border-b border-black/5 px-2 py-1">
          <p className="font-mono text-[0.45rem] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/35">
            How might we…
          </p>
        </div>

        <div className="relative h-[calc(100%-1.25rem)]">
          {STICKIES.map((sticky) => (
            <motion.div
              key={sticky.id}
              className={`absolute h-7 w-9 rounded-[3px] shadow-sm ${sticky.color}`}
              style={{ left: sticky.x, top: sticky.y, rotate: sticky.rotate }}
              initial={reduced ? false : { opacity: 0, scale: 0.6, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: sticky.delay,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="mt-1.5 space-y-0.5 px-1">
                <div className="h-0.5 w-full rounded-full bg-black/10" />
                <div className="h-0.5 w-2/3 rounded-full bg-black/8" />
              </div>
            </motion.div>
          ))}

          <motion.div
            className="absolute bottom-1.5 right-2 flex items-center gap-0.5 rounded-full bg-[#22c55e] px-1.5 py-0.5 text-[0.4rem] font-bold text-white shadow-sm"
            initial={reduced ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.35 }}
          >
            <span>▲</span>
            <span>3</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function EmptyCanvasTemplateIllustration() {
  const reduced = useReducedMotion();

  return (
    <div className="relative h-full w-full" aria-hidden>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />

      <motion.div
        className="absolute left-[18%] top-[22%] h-10 w-14 rounded-sm border border-dashed border-white/50"
        initial={reduced ? false : { opacity: 0, scale: 0.92 }}
        animate={
          reduced
            ? { opacity: 0.7, scale: 1 }
            : { opacity: [0.4, 0.85, 0.4], scale: [0.96, 1, 0.96] }
        }
        transition={reduced ? undefined : loopTransition({ duration: 3.2 })}
      />

      <motion.div
        className="absolute right-[20%] top-[28%] h-6 w-8 rotate-[-3deg] rounded-[3px] bg-[#FFF3B0] shadow-sm"
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mt-1 space-y-0.5 px-1">
          <div className="h-0.5 w-full rounded-full bg-black/10" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-[18%] left-[38%] flex size-5 items-center justify-center rounded-full border border-white/40 bg-white/20 shadow-md backdrop-blur-sm"
        animate={
          reduced
            ? undefined
            : { x: [0, 14, 6, 18, 0], y: [0, -8, 4, -4, 0] }
        }
        transition={reduced ? undefined : loopTransition({ duration: 4.5 })}
      >
        <svg viewBox="0 0 12 12" className="size-2.5 text-white" fill="currentColor">
          <path d="M1 1l3.5 9 1.5-4 4-1.5L1 1z" />
        </svg>
      </motion.div>
    </div>
  );
}
