const PREFIX = "fsh-canvas-onboarding";

export type CanvasOnboardingPhase = "intro" | "zoom" | "done";

export function readCanvasOnboardingPhase(
  canvasId: string,
  configCompleted?: boolean,
): CanvasOnboardingPhase {
  if (configCompleted) return "done";
  if (typeof window === "undefined") return "intro";
  const raw = localStorage.getItem(`${PREFIX}:${canvasId}`);
  if (raw === "zoom" || raw === "done") return raw;
  return "intro";
}

export function writeCanvasOnboardingPhase(
  canvasId: string,
  phase: CanvasOnboardingPhase,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}:${canvasId}`, phase);
  } catch {
    // ignore
  }
}

export function skipCanvasOnboarding(canvasId: string): void {
  writeCanvasOnboardingPhase(canvasId, "done");
}
