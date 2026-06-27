"use client";

import { motion, useReducedMotion } from "framer-motion";

import { AssetPlaceholder } from "@/components/landing/asset-placeholder";
import { CommentsWorkflowIllustration } from "@/components/landing/comments-workflow-illustration";
import { FeatureIllustrationFrame } from "@/components/landing/feature-illustration-frame";
import { IdeasWorkflowIllustration } from "@/components/landing/ideas-workflow-illustration";
import { PresentWorkflowIllustration } from "@/components/landing/present-workflow-illustration";
import { ProjectsWorkflowIllustration } from "@/components/landing/projects-workflow-illustration";
import {
  FeatureTutorialLink,
  type FeatureTutorialConfig,
} from "@/components/landing/feature-tutorial-link";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { TrimmedLoopVideo } from "@/components/landing/trimmed-loop-video";
import { cn } from "@/lib/utils";

const PROJECTS_LOOM_URL =
  "https://www.loom.com/share/8d092b28331e472db3ff064d466f977d";

const APPROVAL_REJECTION_LOOM_URL =
  "https://www.loom.com/share/df5b9086b5cc482282ac29e74b1462cd";

const PLACEHOLDER_LOOM_URL = PROJECTS_LOOM_URL;

const FEATURES: ReadonlyArray<{
  kicker: string;
  headline: string;
  body: string;
  visualLabel: string;
  visualAspect: "wide" | "video" | "portrait";
  index: number;
  media: { type: "video"; src: string; startAt?: number } | null;
  tutorial: FeatureTutorialConfig | null;
}> = [
  {
    kicker: "PROJECTS",
    headline: "Every initiative, one home.",
    body: "Spin up a project, drop in the work, invite the team. Like Figma files, for campaigns.",
    visualLabel: "Project grid · Screenshot placeholder",
    visualAspect: "wide" as const,
    index: 0,
    media: null,
    tutorial: {
      loomUrl: PROJECTS_LOOM_URL,
      modalTitle: "Every initiative, one home",
    },
  },
  {
    kicker: "REVIEW",
    headline: "Approve, reject, react.",
    body: "Open any asset full-screen. Vote with 🔥 👍 🤔 ❌. Watch consensus form in real time.",
    visualLabel: "Asset lightbox",
    visualAspect: "video",
    index: 1,
    media: {
      type: "video",
      src: "/media/Landing%20page/Approved-By.mp4",
      startAt: 2,
    },
    tutorial: {
      loomUrl: APPROVAL_REJECTION_LOOM_URL,
      modalTitle: "Approve, reject, react",
    },
  },
  {
    kicker: "COMMENTS",
    headline: "Feedback that sticks.",
    body: "Threaded comments, @mentions, and resolve checkmarks. Nothing gets lost.",
    visualLabel: "Comments panel · Screenshot placeholder",
    visualAspect: "portrait",
    index: 2,
    media: null,
    tutorial: {
      loomUrl: PLACEHOLDER_LOOM_URL,
      modalTitle: "Feedback that sticks",
    },
  },
  {
    kicker: "IDEAS",
    headline: "Brainstorm out loud.",
    body: "Drop ideas on a shared board. Upvote the best. Let the room decide.",
    visualLabel: "Ideas board · Screenshot placeholder",
    visualAspect: "wide",
    index: 3,
    media: null,
    tutorial: {
      loomUrl: PLACEHOLDER_LOOM_URL,
      modalTitle: "Brainstorm out loud",
    },
  },
  {
    kicker: "PRESENT",
    headline: "Hand it to the room.",
    body: "One click to a clean, full-screen reel of approved and final picks. Meeting-ready.",
    visualLabel: "Presentation mode · Screenshot placeholder",
    visualAspect: "video",
    index: 4,
    media: null,
    tutorial: null,
  },
];

const ILLUSTRATION_FRAMES = {
  PROJECTS: "bg-gradient-to-br from-[#7B2CBF] via-[#C77DFF] to-[#E0AAFF]",
  COMMENTS: "bg-gradient-to-br from-[#3A86FF] via-[#8338EC] to-[#C77DFF]",
  IDEAS: "bg-gradient-to-br from-[#FFC94B] via-[#F4A261] to-[#FF6B6B]",
  PRESENT: "bg-gradient-to-br from-[#1a1a1a] via-[#3d3d3d] to-[#0b0b0b]",
} as const;

function ProjectsVisual() {
  return (
    <FeatureIllustrationFrame gradientClassName={ILLUSTRATION_FRAMES.PROJECTS}>
      <ProjectsWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function CommentsVisual() {
  return (
    <FeatureIllustrationFrame gradientClassName={ILLUSTRATION_FRAMES.COMMENTS}>
      <CommentsWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function IdeasVisual() {
  return (
    <FeatureIllustrationFrame gradientClassName={ILLUSTRATION_FRAMES.IDEAS}>
      <IdeasWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function PresentVisual() {
  return (
    <FeatureIllustrationFrame gradientClassName={ILLUSTRATION_FRAMES.PRESENT}>
      <PresentWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function FeatureVisual({
  label,
  aspect,
  index,
  media,
}: {
  label: string;
  aspect: "wide" | "video" | "portrait";
  index: number;
  media: { type: "video"; src: string; startAt?: number } | null;
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
          className="w-full border-0 shadow-[0_24px_64px_rgba(11,11,11,0.12)]"
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
          <TrimmedLoopVideo
            src={media.src}
            startAt={media.startAt}
            label={label}
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
    <section className="bg-hub-paper px-5 pt-10 pb-16 sm:px-8 sm:pt-12 sm:pb-24">
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
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-hub-foreground/45">
                    {feature.kicker}
                  </p>
                  <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight tracking-[-0.02em] text-hub-foreground">
                    {feature.headline}
                  </h2>
                  <p className="max-w-md text-base leading-relaxed text-hub-foreground/60 sm:text-lg">
                    {feature.body}
                  </p>
                  {feature.tutorial ? (
                    <FeatureTutorialLink tutorial={feature.tutorial} />
                  ) : null}
                </div>

                <div className="w-full">
                  {feature.kicker === "PROJECTS" ? (
                    <ProjectsVisual />
                  ) : feature.kicker === "COMMENTS" ? (
                    <CommentsVisual />
                  ) : feature.kicker === "IDEAS" ? (
                    <IdeasVisual />
                  ) : feature.kicker === "PRESENT" ? (
                    <PresentVisual />
                  ) : (
                    <FeatureVisual
                      label={feature.visualLabel}
                      aspect={feature.visualAspect}
                      index={feature.index}
                      media={feature.media}
                    />
                  )}
                </div>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
