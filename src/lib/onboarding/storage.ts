import { readSimulateNewUser } from "@/lib/dev-tools/storage";

const STORAGE_PREFIX = "fsh-hub-feature-onboarding-views";
export const FEATURE_ONBOARDING_MAX_VIEWS = 3;
export const FEATURE_ONBOARDING_DISMISSED_EVENT = "fsh-hub-feature-onboarding-dismissed";

function readViewCount(userId: string): number {
  if (typeof window === "undefined") return FEATURE_ONBOARDING_MAX_VIEWS;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${userId}`);
    if (raw === "1") return FEATURE_ONBOARDING_MAX_VIEWS;
    const parsed = Number.parseInt(raw ?? "0", 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return FEATURE_ONBOARDING_MAX_VIEWS;
  }
}

export function shouldShowFeatureOnboarding(userId: string): boolean {
  if (readSimulateNewUser()) return true;
  return readViewCount(userId) < FEATURE_ONBOARDING_MAX_VIEWS;
}

export function markFeatureOnboardingSeen(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const nextCount = Math.min(
      readViewCount(userId) + 1,
      FEATURE_ONBOARDING_MAX_VIEWS,
    );
    localStorage.setItem(`${STORAGE_PREFIX}:${userId}`, String(nextCount));
  } catch {
    // ignore quota / private mode
  }
}
