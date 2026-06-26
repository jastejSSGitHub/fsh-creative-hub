"use client";

import { motion, useReducedMotion } from "framer-motion";

import { CapabilityVideoTile } from "@/components/landing/capability-video-tile";
import { GrainOverlay } from "@/components/landing/grain-overlay";
import { HERO_CAPABILITY_VIDEOS } from "@/components/landing/hero-videos";
import { PrimaryCta } from "@/components/landing/primary-cta";

type HeroSectionProps = {
  isLoggedIn: boolean;
};

const LINE_ONE = ["Less", "back", "and", "forth."];
const LINE_TWO = ["More", "great", "work."];

function HeroWord({
  word,
  index,
  reduced,
}: {
  word: string;
  index: number;
  reduced: boolean;
}) {
  if (reduced) {
    return <span className="inline-block">{word}</span>;
  }

  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, y: "1.1em", filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.7,
        delay: 0.15 + index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {word}
    </motion.span>
  );
}

function FloatingWall({ reduced }: { reduced: boolean }) {
  const tileCount = 18;
  const tiles = Array.from({ length: tileCount }, (_, i) => {
    const video = HERO_CAPABILITY_VIDEOS[i % HERO_CAPABILITY_VIDEOS.length];
    return { index: i, video };
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -inset-[20%] grid grid-cols-6 gap-3 opacity-55 sm:gap-4"
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
      <div className="absolute inset-0 bg-gradient-to-b from-hub-espresso/80 via-hub-espresso/90 to-hub-espresso" />
    </div>
  );
}

export function HeroSection({ isLoggedIn }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;
  let wordIndex = 0;

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-hub-espresso text-hub-paper">
      <FloatingWall reduced={reduced} />
      <GrainOverlay />

      <div className="relative z-20 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-32 lg:px-10">
        <p className="mb-8 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-hub-paper/50">
          INTERNAL TOOL · FSH DESIGN
        </p>

        <h1 className="font-display text-[clamp(2.75rem,10vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
          <span className="block">
            {LINE_ONE.map((word) => {
              const idx = wordIndex++;
              return (
                <span key={word} className="mr-[0.22em] last:mr-0">
                  <HeroWord word={word} index={idx} reduced={reduced} />
                </span>
              );
            })}
          </span>
          <span className="mt-1 block text-hub-paper/90 sm:mt-2">
            {LINE_TWO.map((word) => {
              const idx = wordIndex++;
              return (
                <span key={word} className="mr-[0.22em] last:mr-0">
                  <HeroWord word={word} index={idx} reduced={reduced} />
                </span>
              );
            })}
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-base leading-relaxed text-hub-paper/65 sm:mt-10 sm:text-lg">
          Projects, feedback, and final picks — in one visual space. No more
          chasing approvals across 40 Slack messages.
        </p>

        <div className="mt-10 sm:mt-12">
          <PrimaryCta isLoggedIn={isLoggedIn} size="large" />
        </div>
      </div>
    </section>
  );
}
