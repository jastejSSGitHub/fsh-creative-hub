"use client";

import { motion, useReducedMotion } from "framer-motion";

import { MarqueeMediaCard } from "@/components/landing/marquee-media-card";
import { MARQUEE_MEDIA } from "@/components/landing/marquee-media";

function MarqueeTrack({ reverse = false }: { reverse?: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const items = [...MARQUEE_MEDIA, ...MARQUEE_MEDIA];

  return (
    <motion.div
      className="flex shrink-0 gap-4 pr-4"
      animate={
        prefersReducedMotion
          ? undefined
          : { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : { duration: 40, repeat: Infinity, ease: "linear" }
      }
    >
      {items.map((item, i) => (
        <MarqueeMediaCard key={`${item.label}-${i}`} item={item} />
      ))}
    </motion.div>
  );
}

export function MarqueeStrip() {
  return (
    <section
      aria-label="Creative work samples"
      className="overflow-hidden border-y border-hub-espresso/10 bg-hub-paper py-6 sm:py-8"
    >
      <div className="flex w-max">
        <MarqueeTrack />
        <MarqueeTrack />
      </div>
    </section>
  );
}
