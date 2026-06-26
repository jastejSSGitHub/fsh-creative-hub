"use client";

import { useEffect, useState } from "react";

import { FeatureOnboardingModal } from "@/components/onboarding/feature-onboarding-modal";
import { hasSeenFeatureOnboarding } from "@/lib/onboarding/storage";

const ONBOARDING_DELAY_MS = 2000;

type FeatureOnboardingHostProps = {
  userId: string;
};

export function FeatureOnboardingHost({ userId }: FeatureOnboardingHostProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasSeenFeatureOnboarding(userId)) return;

    const timer = window.setTimeout(() => {
      if (!hasSeenFeatureOnboarding(userId)) {
        setOpen(true);
      }
    }, ONBOARDING_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [userId]);

  return (
    <FeatureOnboardingModal
      open={open}
      userId={userId}
      onClose={() => setOpen(false)}
    />
  );
}
