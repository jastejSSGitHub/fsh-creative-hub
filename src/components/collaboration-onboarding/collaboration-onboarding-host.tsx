"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollaborationOnboardingModal } from "@/components/collaboration-onboarding/collaboration-onboarding-modal";
import { COLLABORATION_ONBOARDING_REQUEST } from "@/lib/collaboration-onboarding/events";
import { shouldShowCollaborationOnboarding } from "@/lib/collaboration-onboarding/storage";
import type { CollaborationOnboardingFeatureId } from "@/lib/collaboration-onboarding/types";
import { DEV_TOOLS_MOCK_COLLABORATION_CHANGED } from "@/lib/dev-tools/events";
import { FOR_YOU_PATH } from "@/lib/routes";

type CollaborationOnboardingHostProps = {
  userId: string;
};

export function CollaborationOnboardingHost({ userId }: CollaborationOnboardingHostProps) {
  const pathname = usePathname() ?? "";
  const [activeFeature, setActiveFeature] = useState<CollaborationOnboardingFeatureId | null>(
    null,
  );

  const tryShow = useCallback(
    (featureId: CollaborationOnboardingFeatureId) => {
      if (shouldShowCollaborationOnboarding(featureId, userId)) {
        setActiveFeature(featureId);
        return true;
      }
      return false;
    },
    [userId],
  );

  const evaluateRouteOnboarding = useCallback(() => {
    const onForYou =
      pathname === FOR_YOU_PATH || pathname.startsWith(`${FOR_YOU_PATH}?`);

    if (!onForYou) return;

    const params = new URLSearchParams(
      pathname.includes("?") ? pathname.split("?")[1] : window.location.search,
    );
    const lens = params.get("lens") ?? "needs-you";

    if (lens === "needs-you") {
      tryShow("needs-you-feed");
    } else {
      tryShow("for-you-lenses");
    }
  }, [pathname, tryShow]);

  useEffect(() => {
    evaluateRouteOnboarding();
  }, [evaluateRouteOnboarding]);

  useEffect(() => {
    function onMockChanged() {
      evaluateRouteOnboarding();
    }

    function onOnboardingRequest(event: Event) {
      const detail = (event as CustomEvent<{ featureId: CollaborationOnboardingFeatureId }>)
        .detail;
      if (detail?.featureId) tryShow(detail.featureId);
    }

    window.addEventListener(DEV_TOOLS_MOCK_COLLABORATION_CHANGED, onMockChanged);
    window.addEventListener(COLLABORATION_ONBOARDING_REQUEST, onOnboardingRequest);
    return () => {
      window.removeEventListener(DEV_TOOLS_MOCK_COLLABORATION_CHANGED, onMockChanged);
      window.removeEventListener(COLLABORATION_ONBOARDING_REQUEST, onOnboardingRequest);
    };
  }, [evaluateRouteOnboarding, tryShow]);

  if (!activeFeature) return null;

  return (
    <CollaborationOnboardingModal
      featureId={activeFeature}
      userId={userId}
      open
      onClose={() => setActiveFeature(null)}
    />
  );
}
