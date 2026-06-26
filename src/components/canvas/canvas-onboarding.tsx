"use client";

import { useEffect, useRef, useState } from "react";

import { CanvasOnboardingConnector } from "@/components/canvas/canvas-onboarding-connector";
import {
  readCanvasOnboardingPhase,
  skipCanvasOnboarding,
  writeCanvasOnboardingPhase,
  type CanvasOnboardingPhase,
} from "@/lib/canvas/onboarding-storage";
import {
  CANVAS_INTRO_MESSAGES,
  CANVAS_INTRO_STEPS,
  introStepCardClass,
  introStepHasTarget,
  type CanvasIntroStep,
} from "@/lib/canvas/onboarding-steps";
import { cn } from "@/lib/utils";

export type CanvasOnboardingTargets = {
  stickyTool: React.RefObject<HTMLElement | null>;
  stampTool: React.RefObject<HTMLElement | null>;
  brainstormPanel: React.RefObject<HTMLElement | null>;
  shareButton: React.RefObject<HTMLElement | null>;
};

type CanvasOnboardingProps = {
  canvasId: string;
  themeMode: "dark" | "light";
  targets: CanvasOnboardingTargets;
  onStepChange?: (step: CanvasIntroStep) => void;
  onShareClick: () => void;
};

export function CanvasOnboarding({
  canvasId,
  themeMode,
  targets,
  onStepChange,
  onShareClick,
}: CanvasOnboardingProps) {
  const [phase, setPhase] = useState<CanvasOnboardingPhase>(() =>
    readCanvasOnboardingPhase(canvasId),
  );
  const [introStep, setIntroStep] = useState<CanvasIntroStep>("welcome");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === "intro") {
      onStepChange?.(introStep);
    }
  }, [introStep, onStepChange, phase]);

  if (phase === "done") return null;

  function finishIntro() {
    writeCanvasOnboardingPhase(canvasId, "zoom");
    setPhase("zoom");
  }

  function finishZoomTips() {
    writeCanvasOnboardingPhase(canvasId, "done");
    setPhase("done");
  }

  function skipAll() {
    skipCanvasOnboarding(canvasId);
    setPhase("done");
  }

  if (phase === "zoom") {
    return (
      <>
        <OnboardingCard
          cardRef={cardRef}
          title="Pinch or scroll to zoom"
          body="Use Ctrl + scroll (or pinch on trackpad) to zoom. Scroll to pan. Use the Hand tool on the right — or hold Space — to drag the canvas."
          stepLabel="Zoom tips"
          primaryLabel="Got it"
          onPrimary={finishZoomTips}
          className="bottom-24 left-1/2 -translate-x-1/2"
        />
        <SkipIntroButton onSkip={skipAll} themeMode={themeMode} />
      </>
    );
  }

  const stepIndex = CANVAS_INTRO_STEPS.indexOf(introStep);
  const current = CANVAS_INTRO_MESSAGES[introStep];

  const targetRef =
    introStep === "sticky"
      ? targets.stickyTool
      : introStep === "sticker"
        ? targets.stampTool
        : introStep === "timer"
          ? targets.brainstormPanel
          : introStep === "share"
            ? targets.shareButton
            : null;

  return (
    <>
      {targetRef && introStepHasTarget(introStep) && (
        <CanvasOnboardingConnector
          cardRef={cardRef}
          targetRef={targetRef}
          active
        />
      )}

      <OnboardingCard
        cardRef={cardRef}
        title={current.title}
        body={current.body}
        stepLabel={`${stepIndex + 1} of ${CANVAS_INTRO_STEPS.length}`}
        primaryLabel={current.cta}
        onPrimary={() => {
          if (introStep === "share") {
            onShareClick();
            finishIntro();
            return;
          }
          const next = CANVAS_INTRO_STEPS[stepIndex + 1];
          if (next) setIntroStep(next);
          else finishIntro();
        }}
        className={introStepCardClass(introStep)}
      />
      <SkipIntroButton onSkip={skipAll} themeMode={themeMode} />
    </>
  );
}

function OnboardingCard({
  cardRef,
  title,
  body,
  stepLabel,
  primaryLabel,
  onPrimary,
  className,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  body: string;
  stepLabel: string;
  primaryLabel: string;
  onPrimary: () => void;
  className?: string;
}) {
  return (
    <div
      ref={cardRef}
      className={cn(
        "pointer-events-auto fixed z-50 w-[min(92vw,24rem)] rounded-xl border-2 border-black bg-[#7c3aed] p-4 text-white shadow-2xl",
        className,
      )}
    >
      <p className="font-mono text-[0.6rem] uppercase tracking-wider text-white/60">
        {stepLabel}
      </p>
      <p className="mt-1 font-display text-base font-extrabold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/85">{body}</p>
      <button
        type="button"
        onClick={onPrimary}
        className="mt-4 rounded-md border border-black bg-white px-3 py-1.5 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-white/90"
      >
        {primaryLabel}
      </button>
    </div>
  );
}

function SkipIntroButton({
  onSkip,
  themeMode,
}: {
  onSkip: () => void;
  themeMode: "dark" | "light";
}) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className={cn(
        "pointer-events-auto fixed bottom-4 right-4 z-50 rounded-full border px-3 py-1.5 text-sm font-medium shadow-lg transition-colors",
        themeMode === "light"
          ? "border-black/15 bg-white text-[#1a1a1a] hover:bg-black/[0.03]"
          : "border-white/15 bg-[#1a1a1a]/80 text-white hover:bg-white/10",
      )}
    >
      Skip intro ›
    </button>
  );
}
