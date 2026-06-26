"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { CommentsWorkflowIllustration } from "@/components/landing/comments-workflow-illustration";
import { IdeasWorkflowIllustration } from "@/components/landing/ideas-workflow-illustration";
import { PresentWorkflowIllustration } from "@/components/landing/present-workflow-illustration";
import { ProjectsWorkflowIllustration } from "@/components/landing/projects-workflow-illustration";
import { TrimmedLoopVideo } from "@/components/landing/trimmed-loop-video";
import { markFeatureOnboardingSeen } from "@/lib/onboarding/storage";
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
    navLabel: "Project workspaces & teams",
    nextLabel: "Review",
    title: "Every initiative, one home.",
    body: "Spin up a project, drop in the work, invite the team. Like Figma files, for campaigns.",
    visual: "projects" as const,
  },
  {
    id: "review",
    navLabel: "Asset review & reactions",
    nextLabel: "Comments",
    title: "Approve, reject, react.",
    body: "Open any asset full-screen. Vote with 🔥 👍 🤔 ❌. Watch consensus form in real time.",
    visual: "review" as const,
  },
  {
    id: "comments",
    navLabel: "Threaded comments & mentions",
    nextLabel: "Ideas",
    title: "Feedback that sticks.",
    body: "Threaded comments, @mentions, and resolve checkmarks. Nothing gets lost.",
    visual: "comments" as const,
  },
  {
    id: "ideas",
    navLabel: "Shared idea boards",
    nextLabel: "Present",
    title: "Brainstorm out loud.",
    body: "Drop ideas on a shared board. Upvote the best. Let the room decide.",
    visual: "ideas" as const,
  },
  {
    id: "present",
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
}: {
  visual: (typeof ONBOARDING_FEATURES)[number]["visual"];
}) {
  if (visual === "review") {
    return (
      <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
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
    <div className="w-full max-w-md shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-onboarding-title"
        onClick={(event) => event.stopPropagation()}
        className="relative flex h-[min(85vh,34rem)] w-[min(100%,56rem)] overflow-hidden rounded-xl bg-[#141414] text-white shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
      >
        <aside className="flex w-[12.5rem] shrink-0 flex-col border-r border-white/[0.08] px-4 py-5 sm:w-[14.5rem] sm:px-5 sm:py-6">
          <h2
            id="feature-onboarding-title"
            className="text-[0.7rem] font-semibold leading-snug tracking-[-0.01em] text-white sm:text-xs"
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
                    "rounded-md px-2.5 py-1.5 text-left text-[0.65rem] leading-snug transition-colors sm:text-[0.7rem]",
                    isActive
                      ? "bg-hub-surface/[0.1] text-white"
                      : "text-white/55 hover:bg-hub-surface/[0.05] hover:text-white/80",
                  )}
                >
                  {feature.navLabel}
                </button>
              );
            })}

            <p className="mt-auto px-2.5 pt-3 text-[0.6rem] text-white/30 sm:text-[0.65rem]">
              More coming soon
            </p>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5 py-6 sm:px-8">
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
              className="absolute top-3 right-3 z-10 flex size-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-hub-surface/10 hover:text-white"
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
                className="relative z-[1] flex w-full items-center justify-center"
              >
                <OnboardingVisual visual={activeFeature.visual} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-white/[0.08] bg-[#181818] px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-6 sm:py-5">
            <div className="min-w-0 space-y-1.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  <h3 className="text-[0.8rem] font-semibold tracking-[-0.01em] text-white sm:text-sm">
                    {activeFeature.title}
                  </h3>
                  <p className="max-w-md text-[0.65rem] leading-relaxed text-white/50 sm:text-[0.7rem]">
                    {activeFeature.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end">
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((index) => (index + 1) % ONBOARDING_FEATURES.length)
                }
                className="rounded-md border border-white/15 px-3 py-1.5 text-[0.65rem] text-white/80 transition-colors hover:border-white/25 hover:text-white sm:text-[0.7rem]"
              >
                Next: {nextFeature.nextLabel}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-md bg-hub-final px-3 py-1.5 text-[0.65rem] font-medium text-hub-foreground transition-colors hover:bg-hub-final/90 sm:text-[0.7rem]"
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
