"use client";

import { motion, useReducedMotion } from "framer-motion";

import { AssetPlaceholder } from "@/components/landing/asset-placeholder";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    kicker: "PROJECTS",
    headline: "Every initiative, one home.",
    body: "Spin up a project, drop in the work, invite the team. Like Figma files, for campaigns.",
    visualLabel: "Project grid · Screenshot placeholder",
    visualAspect: "wide" as const,
    index: 0,
    media: null,
  },
  {
    kicker: "REVIEW",
    headline: "Approve, reject, react.",
    body: "Open any asset full-screen. Vote with 🔥 👍 🤔 ❌. Watch consensus form in real time.",
    visualLabel: "Asset lightbox",
    visualAspect: "video" as const,
    index: 1,
    media: {
      type: "video" as const,
      src: "/media/Landing%20page/Approved-By-trimmed.mp4",
    },
  },
  {
    kicker: "COMMENTS",
    headline: "Feedback that sticks.",
    body: "Threaded comments, @mentions, and resolve checkmarks. Nothing gets lost.",
    visualLabel: "Comments panel · Screenshot placeholder",
    visualAspect: "portrait" as const,
    index: 2,
    media: null,
  },
  {
    kicker: "IDEAS",
    headline: "Brainstorm out loud.",
    body: "Drop ideas on a shared board. Upvote the best. Let the room decide.",
    visualLabel: "Ideas board · Screenshot placeholder",
    visualAspect: "wide" as const,
    index: 3,
    media: null,
  },
  {
    kicker: "PRESENT",
    headline: "Hand it to the room.",
    body: "One click to a clean, full-screen reel of approved and final picks. Meeting-ready.",
    visualLabel: "Presentation mode · Screenshot placeholder",
    visualAspect: "video" as const,
    index: 4,
    media: null,
  },
] as const;

function FeatureVisual({
  label,
  aspect,
  index,
  media,
}: {
  label: string;
  aspect: "wide" | "video" | "portrait";
  index: number;
  media: { type: "video"; src: string } | null;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (!media) {
    return (
      <motion.div
        data-cursor-hover
        whileHover={
          prefersReducedMotion
            ? undefined
            : { y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }
        }
        className="w-full"
      >
        <AssetPlaceholder
          index={index + 2}
          label={label}
          aspect={aspect}
          className="w-full shadow-[0_24px_64px_rgba(11,11,11,0.12)]"
        />
      </motion.div>
    );
  }

  const aspectClass = {
    wide: "aspect-[16/10]",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
  }[aspect];

  return (
    <motion.div
      data-cursor-hover
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }
      }
      className="w-full"
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg bg-hub-espresso shadow-[0_24px_64px_rgba(11,11,11,0.12)]",
          aspectClass,
        )}
      >
        {media.type === "video" ? (
          <video
            src={media.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
            aria-label={label}
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/80">
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function FeatureShowcase() {
  return (
    <section className="bg-hub-paper px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl space-y-24 sm:space-y-32 lg:space-y-40">
        {FEATURES.map((feature, i) => {
          const reversed = i % 2 === 1;

          return (
            <ScrollReveal
              key={feature.kicker}
              direction={reversed ? "right" : "left"}
            >
              <article
                className={cn(
                  "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
                  reversed && "lg:[&>*:first-child]:order-2",
                )}
              >
                <div className="space-y-4 lg:space-y-5">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-hub-espresso/45">
                    {feature.kicker}
                  </p>
                  <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight tracking-[-0.02em] text-hub-espresso">
                    {feature.headline}
                  </h2>
                  <p className="max-w-md text-base leading-relaxed text-hub-espresso/60 sm:text-lg">
                    {feature.body}
                  </p>
                </div>

                <FeatureVisual
                  label={feature.visualLabel}
                  aspect={feature.visualAspect}
                  index={feature.index}
                  media={feature.media}
                />
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
