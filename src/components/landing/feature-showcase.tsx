"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { AssetPlaceholder } from "@/components/landing/asset-placeholder";
import { CollaborationLoopWorkflowIllustration } from "@/components/landing/collaboration-loop-workflow-illustration";
import { CommentsWorkflowIllustration } from "@/components/landing/comments-workflow-illustration";
import { FeatureIllustrationFrame } from "@/components/landing/feature-illustration-frame";
import { ForYouWorkflowIllustration } from "@/components/landing/for-you-workflow-illustration";
import { IdeasWorkflowIllustration } from "@/components/landing/ideas-workflow-illustration";
import { PresentWorkflowIllustration } from "@/components/landing/present-workflow-illustration";
import { ProjectsWorkflowIllustration } from "@/components/landing/projects-workflow-illustration";
import { QuickTasksWorkflowIllustration } from "@/components/landing/quick-tasks-workflow-illustration";
import { ReviewWorkflowIllustration } from "@/components/landing/review-workflow-illustration";
import {
  FeatureTutorialLink,
  type FeatureTutorialConfig,
} from "@/components/landing/feature-tutorial-link";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { TrimmedLoopVideo } from "@/components/landing/trimmed-loop-video";
import { COLLABORATION_FEATURE_LOOMS, featureTutorial } from "@/lib/landing/feature-looms";
import { FEATURE_VISUAL_ART_BACKGROUNDS, LANDING_ART_BACKGROUNDS } from "@/lib/landing/art-backgrounds";
import { cn } from "@/lib/utils";

const SLIDE_DURATION_MS = 7000;

const PROJECTS_LOOM_URL =
  "https://www.loom.com/share/0c0e1960a87848ccad0d88fb631811ec";

const APPROVAL_REJECTION_LOOM_URL =
  "https://www.loom.com/share/df5b9086b5cc482282ac29e74b1462cd";

const FEEDBACK_LOOM_URL =
  "https://www.loom.com/share/62c18127fea541b6a81e465a4080a20d";

const BRAINSTORM_LOOM_URL =
  "https://www.loom.com/share/fe6cf863af764ba4b5d9feb0b12790c6";

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
    media: null,
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
      loomUrl: FEEDBACK_LOOM_URL,
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
      loomUrl: BRAINSTORM_LOOM_URL,
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
  {
    kicker: "FOR YOU",
    headline: "One feed for everything that needs you.",
    body: "Mentions, assigned tasks, overdue work, and assets waiting on your vote — sorted by urgency, not buried in Slack threads.",
    visualLabel: "For You inbox",
    visualAspect: "portrait",
    index: 5,
    media: null,
    tutorial: featureTutorial(
      COLLABORATION_FEATURE_LOOMS.forYou,
      "One feed for everything that needs you",
    ),
  },
  {
    kicker: "QUICK TASKS",
    headline: "Capture follow-ups in seconds.",
    body: "Press Q anywhere in the hub. Natural-language quick add turns a thought into a task — with due dates, labels, and project context built in.",
    visualLabel: "Quick add",
    visualAspect: "wide",
    index: 6,
    media: null,
    tutorial: featureTutorial(
      COLLABORATION_FEATURE_LOOMS.quickTasks,
      "Capture follow-ups in seconds",
    ),
  },
  {
    kicker: "COLLABORATION",
    headline: "Feedback becomes follow-through.",
    body: "Turn a comment into a linked task, complete the work, resolve the thread. Creative review and task management in one loop for your team.",
    visualLabel: "Comment → task → resolve",
    visualAspect: "portrait",
    index: 7,
    media: null,
    tutorial: featureTutorial(
      COLLABORATION_FEATURE_LOOMS.collaborationLoop,
      "Feedback becomes follow-through",
    ),
  },
];

const ILLUSTRATION_BACKGROUNDS = {
  PROJECTS: LANDING_ART_BACKGROUNDS.art1,
  REVIEW: FEATURE_VISUAL_ART_BACKGROUNDS.review,
  COMMENTS: LANDING_ART_BACKGROUNDS.art2,
  IDEAS: LANDING_ART_BACKGROUNDS.art3,
  PRESENT: LANDING_ART_BACKGROUNDS.art4,
  FOR_YOU: LANDING_ART_BACKGROUNDS.art5,
  QUICK_TASKS: LANDING_ART_BACKGROUNDS.art1,
  COLLABORATION: LANDING_ART_BACKGROUNDS.art2,
} as const;

function ProjectsVisual() {
  return (
    <FeatureIllustrationFrame backgroundImage={ILLUSTRATION_BACKGROUNDS.PROJECTS}>
      <ProjectsWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function ReviewVisual() {
  return (
    <FeatureIllustrationFrame backgroundImage={ILLUSTRATION_BACKGROUNDS.REVIEW}>
      <ReviewWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function CommentsVisual() {
  return (
    <FeatureIllustrationFrame backgroundImage={ILLUSTRATION_BACKGROUNDS.COMMENTS}>
      <CommentsWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function IdeasVisual() {
  return (
    <FeatureIllustrationFrame backgroundImage={ILLUSTRATION_BACKGROUNDS.IDEAS}>
      <IdeasWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function PresentVisual() {
  return (
    <FeatureIllustrationFrame backgroundImage={ILLUSTRATION_BACKGROUNDS.PRESENT}>
      <PresentWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function ForYouVisual() {
  return (
    <FeatureIllustrationFrame backgroundImage={ILLUSTRATION_BACKGROUNDS.FOR_YOU}>
      <ForYouWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function QuickTasksVisual() {
  return (
    <FeatureIllustrationFrame backgroundImage={ILLUSTRATION_BACKGROUNDS.QUICK_TASKS}>
      <QuickTasksWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

function CollaborationVisual() {
  return (
    <FeatureIllustrationFrame backgroundImage={ILLUSTRATION_BACKGROUNDS.COLLABORATION}>
      <CollaborationLoopWorkflowIllustration />
    </FeatureIllustrationFrame>
  );
}

const FEATURE_VISUALS: Record<string, () => ReactNode> = {
  PROJECTS: ProjectsVisual,
  REVIEW: ReviewVisual,
  COMMENTS: CommentsVisual,
  IDEAS: IdeasVisual,
  PRESENT: PresentVisual,
  "FOR YOU": ForYouVisual,
  "QUICK TASKS": QuickTasksVisual,
  COLLABORATION: CollaborationVisual,
};

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
    <section id="features" className="bg-hub-paper px-5 pt-10 pb-16 sm:px-8 sm:pt-12 sm:pb-24 scroll-mt-24">
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
                  {(() => {
                    const Visual = FEATURE_VISUALS[feature.kicker];
                    if (Visual) {
                      const node = Visual();
                      if (node) return node;
                    }
                    return (
                      <FeatureVisual
                        label={feature.visualLabel}
                        aspect={feature.visualAspect}
                        index={feature.index}
                        media={feature.media}
                      />
                    );
                  })()}
                </div>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
