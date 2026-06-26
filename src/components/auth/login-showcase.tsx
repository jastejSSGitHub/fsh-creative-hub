"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { CommentsWorkflowIllustration } from "@/components/landing/comments-workflow-illustration";
import { GrainOverlay } from "@/components/landing/grain-overlay";
import { IdeasWorkflowIllustration } from "@/components/landing/ideas-workflow-illustration";
import { PresentWorkflowIllustration } from "@/components/landing/present-workflow-illustration";
import { ProjectsWorkflowIllustration } from "@/components/landing/projects-workflow-illustration";
import { TrimmedLoopVideo } from "@/components/landing/trimmed-loop-video";
import { cn } from "@/lib/utils";

const SLIDE_DURATION_MS = 7000;

const LOGIN_SLIDES = [
  {
    id: "projects",
    kicker: "PROJECTS",
    headline: "Every initiative, one home.",
    body: "Spin up a project, drop in the work, invite the team. Like Figma files, for campaigns.",
    panelClassName:
      "bg-gradient-to-br from-[#5A189A] via-[#7B2CBF] to-[#C77DFF]",
    textClassName: "text-white",
    kickerClassName: "text-white/55",
    bodyClassName: "text-white/70",
    visual: "projects" as const,
  },
  {
    id: "review",
    kicker: "REVIEW",
    headline: "Approve, reject, react.",
    body: "Open any asset full-screen. Vote with 🔥 👍 🤔 ❌. Watch consensus form in real time.",
    panelClassName: "bg-hub-espresso",
    textClassName: "text-hub-paper",
    kickerClassName: "text-hub-paper/50",
    bodyClassName: "text-hub-paper/65",
    visual: "review" as const,
  },
  {
    id: "comments",
    kicker: "COMMENTS",
    headline: "Feedback that sticks.",
    body: "Threaded comments, @mentions, and resolve checkmarks. Nothing gets lost.",
    panelClassName:
      "bg-gradient-to-br from-[#2667CC] via-[#3A86FF] to-[#8338EC]",
    textClassName: "text-white",
    kickerClassName: "text-white/55",
    bodyClassName: "text-white/70",
    visual: "comments" as const,
  },
  {
    id: "ideas",
    kicker: "IDEAS",
    headline: "Brainstorm out loud.",
    body: "Drop ideas on a shared board. Upvote the best. Let the room decide.",
    panelClassName:
      "bg-gradient-to-br from-[#E9A319] via-[#F4A261] to-[#FF6B6B]",
    textClassName: "text-hub-foreground",
    kickerClassName: "text-hub-foreground/55",
    bodyClassName: "text-hub-foreground/70",
    visual: "ideas" as const,
  },
  {
    id: "present",
    kicker: "PRESENT",
    headline: "Hand it to the room.",
    body: "One click to a clean, full-screen reel of approved and final picks. Meeting-ready.",
    panelClassName:
      "bg-gradient-to-br from-[#0b0b0b] via-[#1a1a1a] to-[#3d3d3d]",
    textClassName: "text-hub-paper",
    kickerClassName: "text-hub-paper/50",
    bodyClassName: "text-hub-paper/65",
    visual: "present" as const,
  },
] as const;

type SlideVisual = (typeof LOGIN_SLIDES)[number]["visual"];

const ILLUSTRATION_SIZE_CLASS = "w-full max-w-lg";

function ChevronIcon({
  direction,
  className,
}: {
  direction: "prev" | "next";
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      {direction === "prev" ? (
        <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function ShowcaseVisual({ visual }: { visual: SlideVisual }) {
  if (visual === "review") {
    return (
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-lg",
          ILLUSTRATION_SIZE_CLASS,
        )}
      >
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
    <div className={ILLUSTRATION_SIZE_CLASS}>
      <Illustration />
    </div>
  );
}

function ShowcaseNavArrow({
  direction,
  label,
  textClassName,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  textClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-current/15 bg-black/10 text-current backdrop-blur-sm transition-colors hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40",
        textClassName,
      )}
    >
      <ChevronIcon direction={direction} className="size-4" />
    </button>
  );
}

function FloatingOrb({
  className,
  reduced,
}: {
  className: string;
  reduced: boolean;
}) {
  return (
    <motion.div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl",
        className,
      )}
      animate={
        reduced
          ? undefined
          : {
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.55, 0.35],
            }
      }
      transition={
        reduced
          ? undefined
          : { duration: 8, repeat: Infinity, ease: "easeInOut" }
      }
    />
  );
}

export function LoginShowcase() {
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeSlide = LOGIN_SLIDES[activeIndex];

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setActiveIndex(
      (index) => (index - 1 + LOGIN_SLIDES.length) % LOGIN_SLIDES.length,
    );
  }, []);

  const goToNext = useCallback(() => {
    setActiveIndex((index) => (index + 1) % LOGIN_SLIDES.length);
  }, []);

  const previousSlide =
    LOGIN_SLIDES[
      (activeIndex - 1 + LOGIN_SLIDES.length) % LOGIN_SLIDES.length
    ];
  const nextSlide = LOGIN_SLIDES[(activeIndex + 1) % LOGIN_SLIDES.length];

  useEffect(() => {
    if (reduced || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % LOGIN_SLIDES.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(timer);
  }, [activeIndex, isPaused, reduced]);

  return (
    <section
      className="relative flex h-full min-h-[100svh] flex-col overflow-hidden"
      aria-label="FSH Creative Hub features"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.6, ease: "easeInOut" }}
          className={cn("absolute inset-0", activeSlide.panelClassName)}
        />
      </AnimatePresence>

      <FloatingOrb
        reduced={reduced}
        className="left-[10%] top-[15%] size-64 bg-hub-surface/20"
      />
      <FloatingOrb
        reduced={reduced}
        className="bottom-[20%] right-[8%] size-80 bg-black/15"
      />
      <GrainOverlay animated={!reduced} />

      <div className="relative z-20 mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-10 py-12 xl:px-0 xl:py-16">
        <p
          className={cn(
            "font-mono text-[0.65rem] uppercase tracking-[0.22em] opacity-40",
            activeSlide.textClassName,
          )}
        >
          FSH Creative Hub
        </p>

        <div className="flex flex-1 flex-col items-center justify-center py-8">
          <div className="flex w-full max-w-lg flex-col items-center gap-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`visual-${activeSlide.id}`}
                initial={reduced ? false : { opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  reduced
                    ? undefined
                    : { opacity: 0, scale: 0.98, y: -12 }
                }
                transition={{
                  duration: reduced ? 0 : 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex w-full items-center justify-center"
              >
                <ShowcaseVisual visual={activeSlide.visual} />
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-3">
              <ShowcaseNavArrow
                direction="prev"
                label={`Previous: ${previousSlide.headline}`}
                textClassName={activeSlide.textClassName}
                onClick={goToPrevious}
              />
              <ShowcaseNavArrow
                direction="next"
                label={`Next: ${nextSlide.headline}`}
                textClassName={activeSlide.textClassName}
                onClick={goToNext}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`copy-${activeSlide.id}`}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut" }}
              className="space-y-3"
            >
              <p
                className={cn(
                  "font-mono text-[0.65rem] uppercase tracking-[0.2em]",
                  activeSlide.kickerClassName,
                )}
              >
                {activeSlide.kicker}
              </p>
              <h2
                className={cn(
                  "font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold leading-tight tracking-[-0.02em]",
                  activeSlide.textClassName,
                )}
              >
                {activeSlide.headline}
              </h2>
              <p
                className={cn(
                  "max-w-md text-base leading-relaxed sm:text-lg",
                  activeSlide.bodyClassName,
                )}
              >
                {activeSlide.body}
              </p>
            </motion.div>
          </AnimatePresence>

          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Feature highlights"
          >
            {LOGIN_SLIDES.map((slide, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${slide.kicker}: ${slide.headline}`}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "group relative flex h-6 items-center px-0.5",
                    activeSlide.textClassName,
                  )}
                >
                  <span
                    className={cn(
                      "block h-1 rounded-full bg-current transition-all duration-300",
                      isActive
                        ? "w-8 opacity-90"
                        : "w-4 opacity-30 group-hover:opacity-50",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
