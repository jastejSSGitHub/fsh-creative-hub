"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { CanvasOnboardingConnector } from "@/components/canvas/canvas-onboarding-connector";
import { HubDialog } from "@/components/projects/hub-dialog";
import { ProjectOnboardingDimOverlay } from "@/components/project-files/project-onboarding-dim-overlay";
import {
  PROJECT_INTRO_MESSAGES,
  PROJECT_INTRO_STEPS,
  projectIntroStepHasTarget,
  type ProjectIntroStep,
} from "@/lib/project-files/onboarding-steps";
import {
  centerCardPosition,
  clampCardPosition,
  type CardPosition,
} from "@/lib/project-files/onboarding-positioning";
import {
  readProjectOnboardingPhase,
  readProjectOnboardingSavedStep,
  skipProjectOnboarding,
  writeProjectOnboardingPhase,
  writeProjectOnboardingStep,
  type ProjectOnboardingPhase,
} from "@/lib/project-files/onboarding-storage";
import { cn } from "@/lib/utils";

const CARD_MAX_WIDTH = 384;

export type ProjectOnboardingTargets = {
  createMenuRoot: React.RefObject<HTMLElement | null>;
  templatesBanner: React.RefObject<HTMLElement | null>;
  favoriteButton: React.RefObject<HTMLElement | null>;
  shareButton: React.RefObject<HTMLElement | null>;
};

export type ProjectShareOnboardingCard = {
  stepLabel: string;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
};

type ProjectOnboardingProps = {
  userId: string;
  projectId: string;
  hasFiles: boolean;
  targets: ProjectOnboardingTargets;
  onStepChange?: (step: ProjectIntroStep) => void;
  onShareStepCardChange?: (card: ProjectShareOnboardingCard | null) => void;
  onComplete?: () => void;
  onPause?: (step: ProjectIntroStep) => void;
};

function readInitialStep(userId: string, projectId: string): ProjectIntroStep {
  const saved = readProjectOnboardingSavedStep(userId, projectId);
  if (saved && PROJECT_INTRO_STEPS.includes(saved as ProjectIntroStep)) {
    return saved as ProjectIntroStep;
  }
  return "welcome";
}

export function ProjectOnboarding({
  userId,
  projectId,
  hasFiles,
  targets,
  onStepChange,
  onShareStepCardChange,
  onComplete,
  onPause,
}: ProjectOnboardingProps) {
  const [phase, setPhase] = useState<ProjectOnboardingPhase>(() =>
    readProjectOnboardingPhase(userId, projectId),
  );
  const [introStep, setIntroStep] = useState<ProjectIntroStep>(() =>
    readInitialStep(userId, projectId),
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPosition, setCardPosition] = useState<CardPosition | null>(null);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);

  const finishIntro = useCallback(() => {
    writeProjectOnboardingPhase(userId, projectId, "done");
    onShareStepCardChange?.(null);
    onComplete?.();
    setPhase("done");
  }, [onComplete, onShareStepCardChange, projectId, userId]);

  const skipAll = useCallback(() => {
    skipProjectOnboarding(userId, projectId);
    onShareStepCardChange?.(null);
    onComplete?.();
    setPhase("done");
  }, [onComplete, onShareStepCardChange, projectId, userId]);

  const pauseIntro = useCallback(() => {
    onShareStepCardChange?.(null);
    onPause?.(introStep);
    setPhase("done");
  }, [introStep, onPause, onShareStepCardChange]);

  const requestSkip = useCallback(() => {
    setSkipConfirmOpen(true);
  }, []);

  const goPrevious = useCallback(() => {
    const stepIndex = PROJECT_INTRO_STEPS.indexOf(introStep);
    const prev = PROJECT_INTRO_STEPS[stepIndex - 1];
    if (prev) setIntroStep(prev);
  }, [introStep]);

  useEffect(() => {
    if (phase === "intro") {
      writeProjectOnboardingStep(userId, projectId, introStep);
      onStepChange?.(introStep);
    }
  }, [introStep, onStepChange, phase, projectId, userId]);

  useEffect(() => {
    if (phase !== "intro" || introStep !== "share") {
      onShareStepCardChange?.(null);
      return;
    }

    const stepIndex = PROJECT_INTRO_STEPS.indexOf(introStep);
    const current = PROJECT_INTRO_MESSAGES[introStep];

    onShareStepCardChange?.({
      stepLabel: `${stepIndex + 1} of ${PROJECT_INTRO_STEPS.length}`,
      title: current.title,
      body: current.body,
      primaryLabel: current.cta,
      onPrimary: finishIntro,
      onPrevious: goPrevious,
      onClose: requestSkip,
    });
  }, [finishIntro, goPrevious, introStep, onShareStepCardChange, phase, requestSkip]);

  const targetRef =
    introStep === "create"
      ? targets.createMenuRoot
      : introStep === "templates"
        ? targets.templatesBanner
        : introStep === "favorite"
          ? targets.favoriteButton
          : null;

  const usesDynamicPosition =
    introStep === "create" ||
    introStep === "templates" ||
    (introStep === "favorite" && hasFiles);

  useLayoutEffect(() => {
    if (phase !== "intro" || introStep === "share") {
      setCardPosition(null);
      return;
    }

    function measure() {
      const card = cardRef.current;
      const cardWidth = card?.offsetWidth ?? CARD_MAX_WIDTH;
      const cardHeight = card?.offsetHeight ?? 180;

      if (introStep === "welcome") {
        setCardPosition(centerCardPosition(cardWidth, cardHeight));
        return;
      }

      if (introStep === "favorite" && !hasFiles) {
        setCardPosition(centerCardPosition(cardWidth, cardHeight));
        return;
      }

      const target = targetRef?.current?.getBoundingClientRect();
      if (!target) {
        setCardPosition(centerCardPosition(cardWidth, cardHeight));
        return;
      }

      setCardPosition(clampCardPosition(target, cardWidth, cardHeight, "below"));
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (cardRef.current) observer.observe(cardRef.current);
    if (targetRef?.current) observer.observe(targetRef.current);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [hasFiles, introStep, phase, targetRef]);

  if (phase === "done") return null;

  function goNext() {
    const stepIndex = PROJECT_INTRO_STEPS.indexOf(introStep);
    const next = PROJECT_INTRO_STEPS[stepIndex + 1];
    if (next) {
      setIntroStep(next);
      return;
    }
    finishIntro();
  }

  if (introStep === "share") {
    return (
      <>
        <SkipIntroButton onSkip={requestSkip} />
        <SkipOnboardingConfirmDialog
          open={skipConfirmOpen}
          onClose={() => setSkipConfirmOpen(false)}
          onConfirm={() => {
            setSkipConfirmOpen(false);
            skipAll();
          }}
        />
      </>
    );
  }

  const stepIndex = PROJECT_INTRO_STEPS.indexOf(introStep);
  const current = PROJECT_INTRO_MESSAGES[introStep];
  const showConnector =
    targetRef &&
    projectIntroStepHasTarget(introStep, hasFiles) &&
    cardPosition &&
    usesDynamicPosition;

  return (
    <>
      <ProjectOnboardingDimOverlay onBackdropClick={pauseIntro} />

      {showConnector && (
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
        stepLabel={`${stepIndex + 1} of ${PROJECT_INTRO_STEPS.length}`}
        primaryLabel={current.cta}
        onPrimary={goNext}
        onPrevious={goPrevious}
        showPrevious={stepIndex > 0}
        onClose={requestSkip}
        position={cardPosition}
        onBackdropClick={(event) => event.stopPropagation()}
      />
      <SkipIntroButton onSkip={requestSkip} />
      <SkipOnboardingConfirmDialog
        open={skipConfirmOpen}
        onClose={() => setSkipConfirmOpen(false)}
        onConfirm={() => {
          setSkipConfirmOpen(false);
          skipAll();
        }}
      />
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
  onPrevious,
  showPrevious,
  onClose,
  position,
  onBackdropClick,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  body: string;
  stepLabel: string;
  primaryLabel: string;
  onPrimary: () => void;
  onPrevious?: () => void;
  showPrevious?: boolean;
  onClose?: () => void;
  position: CardPosition | null;
  onBackdropClick?: (event: React.MouseEvent) => void;
}) {
  return (
    <div
      ref={cardRef}
      onClick={onBackdropClick}
      style={
        position
          ? { top: position.top, left: position.left, transform: "none" }
          : undefined
      }
      className={cn(
        "pointer-events-auto fixed z-50 w-[min(92vw,24rem)] rounded-xl bg-[#7c3aed] p-4 pt-8 text-white shadow-2xl",
        !position && "bottom-24 left-1/2 -translate-x-1/2",
      )}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close onboarding"
          className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      )}
      <p className="font-mono text-[0.6rem] uppercase tracking-wider text-white/60">
        {stepLabel}
      </p>
      <p className="mt-1 font-display text-base font-extrabold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/85">{body}</p>
      <div className="mt-4 flex items-center justify-center gap-2">
        {showPrevious && onPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            className="rounded-md border border-white/30 bg-transparent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Previous
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-white/90"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

function SkipOnboardingConfirmDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <HubDialog open={open} onClose={onClose} title="Skip the tour?">
      <p className="text-[0.8125rem] leading-relaxed text-hub-foreground/80">
        Are you sure you want to skip onboarding? It only takes 10 seconds — less
        time than deciding what to have for lunch.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[6px] px-2.5 py-1.5 text-[0.8125rem] text-hub-foreground/70 transition-colors hover:bg-hub-foreground/[0.05]"
        >
          Keep going
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-[6px] bg-hub-foreground px-2.5 py-1.5 text-[0.8125rem] font-medium text-hub-paper transition-colors hover:bg-hub-foreground/90"
        >
          Skip anyway
        </button>
      </div>
    </HubDialog>
  );
}

function SkipIntroButton({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className="pointer-events-auto fixed bottom-4 right-4 z-50 rounded-full border border-hub-foreground/12 bg-hub-surface px-3 py-1.5 text-sm font-medium text-hub-foreground shadow-sm transition-colors hover:bg-hub-foreground/[0.03]"
    >
      Skip intro ›
    </button>
  );
}
