import type { CollaborationOnboardingFeatureId } from "@/lib/collaboration-onboarding/types";

export const COLLABORATION_ONBOARDING_REQUEST = "fsh-collaboration-onboarding-request";

export function requestCollaborationOnboarding(
  featureId: CollaborationOnboardingFeatureId,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(COLLABORATION_ONBOARDING_REQUEST, { detail: { featureId } }),
  );
}
