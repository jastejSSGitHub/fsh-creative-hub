"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { CommentsWorkflowIllustration } from "@/components/landing/comments-workflow-illustration";
import { IdeasWorkflowIllustration } from "@/components/landing/ideas-workflow-illustration";
import { PresentWorkflowIllustration } from "@/components/landing/present-workflow-illustration";
import { ProjectsWorkflowIllustration } from "@/components/landing/projects-workflow-illustration";
import { TrimmedLoopVideo } from "@/components/landing/trimmed-loop-video";
import {
  FEATURE_ONBOARDING_DISMISSED_EVENT,
  markFeatureOnboardingSeen,
} from "@/lib/onboarding/storage";
import { cn } from "@/lib/utils";

const STEP_GRADIENTS = {
  projects: "bg-gradient-to-br from-[#7B2CBF] via-[#C77DFF] to-[#E0AAFF]",
  review: "bg-gradient-to-br from-[#E63946] via-[#FF6B35] to-[#FFD23F]",
  comments: "bg-gradient-to-br from-[#3A86FF] via-[#8338EC] to-[#C77DFF]",
  ideas: "bg-gradient-to-br from-[#FFC94B] via-[#F4A261] to-[#FF6B6B]",
  present: "bg-gradient-to-br from-[#1a1a1a] via-[#3d3d3d] to-[#0b0b0b]",
} as const;

const ONBOARDING_FEATURES = [
  {
    id: "projects",
    shortLabel: "Projects",
    navLabel: "Project workspaces & teams",
    nextLabel: "Review",
    title: "Every initiative, one home.",
    body: "Spin up a project, drop in the work, invite the team. Like Figma files, for campaigns.",
    visual: "projects" as const,
  },
  {
    id: "review",
    shortLabel: "Review",
    navLabel: "Asset review & reactions",
    nextLabel: "Comments",
    title: "Approve, reject, react.",
    body: "Open any asset full-screen. Vote with 🔥 👍 🤔 ❌. Watch consensus form in real time.",
    visual: "review" as const,
  },
  {
    id: "comments",
    shortLabel: "Comments",
    navLabel: "Threaded comments & mentions",
    nextLabel: "Ideas",
    title: "Feedback that sticks.",
    body: "Threaded comments, @mentions, and resolve checkmarks. Nothing gets lost.",
    visual: "comments" as const,
  },
  {
    id: "ideas",
    shortLabel: "Ideas",
    navLabel: "Shared idea boards",
    nextLabel: "Present",
    title: "Brainstorm out loud.",
    body: "Drop ideas on a shared board. Upvote the best. Let the room decide.",
    visual: "ideas" as const,
  },
  {
    id: "present",
    shortLabel: "Present",
    navLabel: "Full-screen presentation mode",
    nextLabel: "Workspaces",
    title: "Hand it to the room.",
    body: "One click to a clean, full-screen reel of approved and final picks. Meeting-ready.",
    visual: "present" as const,
  },
] as const;

type FeatureOnboardingModalProps = {
  open: boolean;
  userId: string;
  onClose: () => void;
};

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function OnboardingVisual({
  visual,
  mobile = false,
}: {
  visual: (typeof ONBOARDING_FEATURES)[number]["visual"];
  mobile?: boolean;
}) {
  const frameClass = cn(
    "w-full overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.35)]",
    mobile ? "max-w-none rounded-lg" : "max-w-md rounded-md",
  );

  if (visual === "review") {
    return (
      <div className={cn(frameClass, "relative aspect-video")}>
        <TrimmedLoopVideo
          src="/media/Landing%20page/Approved-By.mp4"
          startAt={2}
          label="Asset lightbox"
        />
      </div>
    );
  }

  const Illustration = {
    projects: ProjectsWorkflowIllustration,
    comments: CommentsWorkflowIllustration,
    ideas: IdeasWorkflowIllustration,
    present: PresentWorkflowIllustration,
  }[visual];

  return (
    <div
      className={cn(
        frameClass,
        mobile ? "shadow-[0_12px_40px_rgba(0,0,0,0.28)]" : "shadow-[0_16px_48px_rgba(0,0,0,0.2)]",
      )}
    >
      <Illustration />
    </div>
  );
}

export function FeatureOnboardingModal({
  open,
  userId,
  onClose,
}: FeatureOnboardingModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const dismiss = useCallback(() => {
    markFeatureOnboardingSeen(userId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(FEATURE_ONBOARDING_DISMISSED_EVENT));
    }
    onClose();
  }, [onClose, userId]);

  const activeFeature = ONBOARDING_FEATURES[activeIndex];
  const nextFeature =
    ONBOARDING_FEATURES[(activeIndex + 1) % ONBOARDING_FEATURES.length];

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismiss, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 backdrop-blur-[2px] md:items-center md:p-6"
      role="presentation"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="What's in Creative Hub"
        onClick={(event) => event.stopPropagation()}
        className="relative flex h-[min(92dvh,100%)] w-full flex-col overflow-hidden rounded-t-2xl bg-[#141414] text-white shadow-[0_32px_80px_rgba(0,0,0,0.55)] md:h-[min(85vh,34rem)] md:w-[min(100%,56rem)] md:flex-row md:rounded-xl"
      >
        {/* Desktop sidebar */}
        <aside className="hidden w-[14.5rem] shrink-0 flex-col border-r border-white/[0.08] px-5 py-6 md:flex">
          <h2
            id="feature-onboarding-title"
            className="text-xs font-semibold leading-snug tracking-[-0.01em] text-white"
          >
            What&apos;s in Creative Hub
          </h2>

          <nav className="mt-5 flex flex-1 flex-col gap-0.5" aria-label="Features">
            {ONBOARDING_FEATURES.map((feature, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-left text-[0.7rem] leading-snug transition-colors",
                    isActive
                      ? "bg-hub-surface/[0.1] text-white"
                      : "text-white/55 hover:bg-hub-surface/[0.05] hover:text-white/80",
                  )}
                >
                  {feature.navLabel}
                </button>
              );
            })}

            <p className="mt-auto px-2.5 pt-3 text-[0.65rem] text-white/30">
              More coming soon
            </p>
          </nav>
        </aside>

        {/* Mobile header + feature picker */}
        <div className="flex shrink-0 flex-col gap-3 border-b border-white/[0.08] px-4 pb-3 pt-4 md:hidden">
          <div className="flex items-start justify-between gap-3">
            <h2
              className="text-sm font-semibold leading-snug tracking-[-0.01em] text-white"
            >
              What&apos;s in Creative Hub
            </h2>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-hub-surface/10 hover:text-white"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>

          <nav
            className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Features"
          >
            {ONBOARDING_FEATURES.map((feature, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex min-w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-2 transition-colors",
                    isActive
                      ? "bg-hub-surface/[0.12] text-white"
                      : "text-white/45 hover:bg-hub-surface/[0.06] hover:text-white/75",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-[0.65rem] font-semibold",
                      isActive
                        ? cn(STEP_GRADIENTS[feature.visual], "text-white shadow-sm")
                        : "bg-white/[0.08] text-white/70",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="max-w-[4.25rem] truncate text-[0.6rem] leading-tight">
                    {feature.shortLabel}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-3 sm:px-5 sm:py-6 md:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "absolute inset-0",
                  STEP_GRADIENTS[activeFeature.visual],
                )}
                aria-hidden
              />
            </AnimatePresence>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 hidden size-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-hub-surface/10 hover:text-white md:flex"
            >
              <CloseIcon className="size-4" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-[1] flex h-full w-full items-center justify-center px-0.5"
              >
                <div className="w-full md:hidden">
                  <OnboardingVisual visual={activeFeature.visual} mobile />
                </div>
                <div className="hidden w-full max-w-md md:block">
                  <OnboardingVisual visual={activeFeature.visual} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-white/[0.08] bg-[#181818] px-4 py-3.5 sm:px-6 sm:py-5 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="min-w-0 space-y-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  <h3 className="text-sm font-semibold tracking-[-0.01em] text-white md:text-sm">
                    {activeFeature.title}
                  </h3>
                  <p className="text-[0.7rem] leading-relaxed text-white/50 md:max-w-md md:text-[0.7rem]">
                    {activeFeature.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-stretch md:self-end">
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((index) => (index + 1) % ONBOARDING_FEATURES.length)
                }
                className="flex-1 rounded-md border border-white/15 px-3 py-2 text-[0.7rem] text-white/80 transition-colors hover:border-white/25 hover:text-white md:flex-none md:py-1.5"
              >
                Next: {nextFeature.nextLabel}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="flex-1 rounded-md bg-hub-final px-3 py-2 text-[0.7rem] font-medium text-hub-foreground transition-colors hover:bg-hub-final/90 md:flex-none md:py-1.5"
              >
                Get started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
