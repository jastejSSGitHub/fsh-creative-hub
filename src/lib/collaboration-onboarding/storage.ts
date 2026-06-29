import { readSimulateNewUser, readMockCollaborationData } from "@/lib/dev-tools/storage";
import type { CollaborationOnboardingFeatureId } from "@/lib/collaboration-onboarding/types";

export const COLLABORATION_ONBOARDING_MAX_VIEWS = 2;

export function shouldShowCollaborationOnboarding(
  featureId: CollaborationOnboardingFeatureId,
  userId: string,
): boolean {
  if (readSimulateNewUser()) return true;
  if (readMockCollaborationData()) return true;
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(
      `fsh-colab-onboarding-${featureId}:${userId}`,
    );
    const count = Number.parseInt(raw ?? "0", 10);
    return !Number.isFinite(count) || count < COLLABORATION_ONBOARDING_MAX_VIEWS;
  } catch {
    return false;
  }
}

export function markCollaborationOnboardingSeen(
  featureId: CollaborationOnboardingFeatureId,
  userId: string,
  permanent = false,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = `fsh-colab-onboarding-${featureId}:${userId}`;
    if (permanent) {
      localStorage.setItem(key, String(COLLABORATION_ONBOARDING_MAX_VIEWS));
      return;
    }
    const raw = localStorage.getItem(key);
    const count = Number.parseInt(raw ?? "0", 10);
    localStorage.setItem(
      key,
      String(Math.min((Number.isFinite(count) ? count : 0) + 1, COLLABORATION_ONBOARDING_MAX_VIEWS)),
    );
  } catch {
    // ignore
  }
}

export function resetCollaborationOnboarding(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("fsh-colab-onboarding-") && key.endsWith(`:${userId}`)) {
        keys.push(key);
      }
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
