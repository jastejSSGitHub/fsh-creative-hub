"use client";

import { useEffect, useState } from "react";

import { FeatureOnboardingModal } from "@/components/onboarding/feature-onboarding-modal";
import { DEV_TOOLS_SIMULATE_CHANGED } from "@/lib/dev-tools/events";
import { shouldShowFeatureOnboarding } from "@/lib/onboarding/storage";

const ONBOARDING_DELAY_MS = 2000;

type FeatureOnboardingHostProps = {
  userId: string;
};

export function FeatureOnboardingHost({ userId }: FeatureOnboardingHostProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldShowFeatureOnboarding(userId)) return;

    const timer = window.setTimeout(() => {
      if (shouldShowFeatureOnboarding(userId)) {
        setOpen(true);
      }
    }, ONBOARDING_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [userId]);

  useEffect(() => {
    function handleSimulateChanged(event: Event) {
      const simulate = (event as CustomEvent<{ simulate: boolean }>).detail.simulate;
      if (simulate) {
        setOpen(true);
        return;
      }

      if (!shouldShowFeatureOnboarding(userId)) {
        setOpen(false);
      }
    }

    window.addEventListener(DEV_TOOLS_SIMULATE_CHANGED, handleSimulateChanged);
    return () => window.removeEventListener(DEV_TOOLS_SIMULATE_CHANGED, handleSimulateChanged);
  }, [userId]);

  return (
    <FeatureOnboardingModal
      open={open}
      userId={userId}
      onClose={() => setOpen(false)}
    />
  );
}
