"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";

import { CollaborationOnboardingIllustration } from "@/components/collaboration-onboarding/collaboration-onboarding-illustration";
import { FeatureIllustrationFrame } from "@/components/landing/feature-illustration-frame";
import { COLLABORATION_ONBOARDING_FLOWS } from "@/lib/collaboration-onboarding/steps";
import {
  markCollaborationOnboardingSeen,
} from "@/lib/collaboration-onboarding/storage";
import type { CollaborationOnboardingFeatureId } from "@/lib/collaboration-onboarding/types";
import {
  LANDING_ART_BACKGROUNDS,
  type LandingArtKey,
} from "@/lib/landing/art-backgrounds";
import { cn } from "@/lib/utils";

const COLLAB_ONBOARDING_ART_KEYS: LandingArtKey[] = [
  "art1",
  "art2",
  "art3",
  "art4",
  "art5",
];

function collaborationOnboardingArt(stepIndex: number): string {
  return LANDING_ART_BACKGROUNDS[
    COLLAB_ONBOARDING_ART_KEYS[stepIndex % COLLAB_ONBOARDING_ART_KEYS.length]
  ];
}

type CollaborationOnboardingModalProps = {
  featureId: CollaborationOnboardingFeatureId;
  userId: string;
  open: boolean;
  onClose: () => void;
};

export function CollaborationOnboardingModal({
  featureId,
  userId,
  open,
  onClose,
}: CollaborationOnboardingModalProps) {
  const flow = COLLABORATION_ONBOARDING_FLOWS[featureId];
  const [stepIndex, setStepIndex] = useState(0);

  const steps = flow?.steps ?? [];
  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  const finish = useCallback(
    (permanent: boolean) => {
      markCollaborationOnboardingSeen(featureId, userId, permanent);
      onClose();
      setStepIndex(0);
    },
    [featureId, userId, onClose],
  );

  if (!open || !flow || !step) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => finish(false)}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-labelledby="colab-onboarding-title"
            className="fixed inset-x-4 bottom-4 z-[61] mx-auto max-w-md rounded-xl border border-hub-foreground/10 bg-hub-paper p-5 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <FeatureIllustrationFrame
              backgroundImage={collaborationOnboardingArt(stepIndex)}
              className="mb-4"
            >
              <CollaborationOnboardingIllustration
                variant={step.illustration}
                className="border-0 bg-white/95 shadow-none"
              />
            </FeatureIllustrationFrame>
            <h2
              id="colab-onboarding-title"
              className="font-display text-lg font-extrabold tracking-tight text-hub-foreground"
            >
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-hub-foreground/55">
              {step.body}
            </p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => finish(true)}
                className="text-xs font-medium text-hub-foreground/45 hover:text-hub-foreground/70"
              >
                Don&apos;t show again
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isLast) finish(false);
                  else setStepIndex((i) => i + 1);
                }}
                className={cn(
                  "rounded-[6px] bg-hub-foreground px-4 py-2 text-sm font-semibold text-hub-paper",
                  "hover:bg-hub-foreground/90",
                )}
              >
                {isLast ? step.cta : step.cta}
              </button>
            </div>
            {steps.length > 1 && (
              <p className="mt-3 text-center text-[0.625rem] text-hub-foreground/35">
                {stepIndex + 1} / {steps.length}
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
