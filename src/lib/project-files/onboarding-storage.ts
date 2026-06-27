import { readSimulateNewUser } from "@/lib/dev-tools/storage";

const PREFIX = "fsh-project-onboarding";

export type ProjectOnboardingPhase = "intro" | "done";

export function projectOnboardingKey(userId: string, projectId: string): string {
  return `${PREFIX}:${userId}:${projectId}`;
}

function stepKey(userId: string, projectId: string): string {
  return `${projectOnboardingKey(userId, projectId)}:step`;
}

export function readProjectOnboardingPhase(
  userId: string,
  projectId: string,
): ProjectOnboardingPhase {
  if (readSimulateNewUser()) return "intro";
  if (typeof window === "undefined") return "intro";
  const raw = localStorage.getItem(projectOnboardingKey(userId, projectId));
  return raw === "done" ? "done" : "intro";
}

export function readProjectOnboardingSavedStep(
  userId: string,
  projectId: string,
): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(stepKey(userId, projectId));
}

export function writeProjectOnboardingStep(
  userId: string,
  projectId: string,
  step: string,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(stepKey(userId, projectId), step);
  } catch {
    // ignore
  }
}

export function writeProjectOnboardingPhase(
  userId: string,
  projectId: string,
  phase: ProjectOnboardingPhase,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(projectOnboardingKey(userId, projectId), phase);
    if (phase === "done") {
      localStorage.removeItem(stepKey(userId, projectId));
    }
  } catch {
    // ignore
  }
}

export function skipProjectOnboarding(userId: string, projectId: string): void {
  writeProjectOnboardingPhase(userId, projectId, "done");
}
