const STORAGE_PREFIX = "fsh-hub-feature-onboarding-seen";

export function hasSeenFeatureOnboarding(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}:${userId}`) === "1";
  } catch {
    return true;
  }
}

export function markFeatureOnboardingSeen(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}:${userId}`, "1");
  } catch {
    // ignore quota / private mode
  }
}
