"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { HERO_VERB_INTERVAL_MS, HERO_VERBS } from "@/components/landing/hero-verbs";

type HeroVerbPillProps = {
  className?: string;
};

export function HeroVerbPill({ className }: HeroVerbPillProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;
  const [index, setIndex] = useState(0);
  const verb = HERO_VERBS[index]!;

  useEffect(() => {
    if (reduced) return;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_VERBS.length);
    }, HERO_VERB_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <motion.span
      layout
      className={className}
      animate={{ backgroundColor: verb.pillBg }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ backgroundColor: verb.pillBg }}
      aria-live="polite"
      aria-atomic="true"
    >
      <motion.span
        className="size-2.5 shrink-0 rounded-full sm:size-3"
        animate={{ backgroundColor: verb.dot }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ backgroundColor: verb.dot }}
        aria-hidden
      />
      <span className="relative inline-grid place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={verb.word}
            className="col-start-1 row-start-1 whitespace-nowrap text-hub-espresso"
            initial={reduced ? false : { opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={
              reduced
                ? undefined
                : { opacity: 0, y: -14, filter: "blur(4px)" }
            }
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {verb.word}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.span>
  );
}
