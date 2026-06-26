"use client";

import { motion, useReducedMotion } from "framer-motion";

import { CapabilityVideoTile } from "@/components/landing/capability-video-tile";
import { GrainOverlay } from "@/components/landing/grain-overlay";
import { HeroIconStack } from "@/components/landing/hero-icon-stack";
import { HeroVerbPill } from "@/components/landing/hero-verb-pill";
import { HERO_CAPABILITY_VIDEOS } from "@/components/landing/hero-videos";
import { PrimaryCta } from "@/components/landing/primary-cta";

type HeroSectionProps = {
  isLoggedIn: boolean;
};

function FloatingWall({ reduced }: { reduced: boolean }) {
  const tileCount = 12;
  const tiles = Array.from({ length: tileCount }, (_, i) => {
    const video = HERO_CAPABILITY_VIDEOS[i % HERO_CAPABILITY_VIDEOS.length];
    return { index: i, video };
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -inset-[20%] grid grid-cols-6 gap-3 opacity-[0.18] sm:gap-4 sm:opacity-[0.22]"
        animate={
          reduced
            ? undefined
            : {
                x: [0, -40, 0],
                y: [0, 24, 0],
              }
        }
        transition={
          reduced
            ? undefined
            : { duration: 28, repeat: Infinity, ease: "linear" }
        }
      >
        {tiles.map((tile) => (
          <CapabilityVideoTile
            key={tile.index}
            src={tile.video.src}
            label={tile.video.label}
            aspect={tile.video.aspect}
            priority={tile.index < 6}
            className="w-full min-w-[5rem] sm:min-w-[7rem]"
          />
        ))}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-hub-paper via-hub-paper/92 to-hub-paper" />
    </div>
  );
}

export function HeroSection({ isLoggedIn }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-hub-paper text-hub-espresso">
      <FloatingWall reduced={reduced} />
      <GrainOverlay />

      <div className="relative z-20 mx-auto flex min-h-[100svh] max-w-5xl flex-col items-center justify-center px-5 py-28 text-center sm:px-8 sm:py-32">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroIconStack className="mb-10 sm:mb-12" />
        </motion.div>

        <motion.p
          className="mb-6 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-hub-espresso/45"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          Internal tool · FSH Design
        </motion.p>

        <motion.h1
          className="font-display text-[clamp(2.25rem,7.5vw,4.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em]"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span>One place to</span>
            <HeroVerbPill className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 align-middle text-[0.92em] sm:gap-3 sm:px-5 sm:py-2.5" />
            <span>creative work.</span>
          </span>
        </motion.h1>

        <motion.p
          className="mt-8 max-w-xl text-base leading-relaxed text-hub-espresso/60 sm:mt-10 sm:text-lg"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Projects, feedback, and final picks — without chasing approvals
          across 40 Slack messages.
        </motion.p>

        <motion.div
          className="mt-10 flex justify-center sm:mt-12"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <PrimaryCta isLoggedIn={isLoggedIn} size="large" />
        </motion.div>
      </div>
    </section>
  );
}
