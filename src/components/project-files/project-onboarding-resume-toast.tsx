"use client";

import { useEffect, useState } from "react";

const TOAST_DURATION_MS = 5000;

type ProjectOnboardingResumeToastProps = {
  open: boolean;
  onResume: () => void;
  onDismiss: () => void;
};

export function ProjectOnboardingResumeToast({
  open,
  onResume,
  onDismiss,
}: ProjectOnboardingResumeToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!open) {
      setProgress(100);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;

    function tick(now: number) {
      const elapsed = now - startedAt;
      const remaining = Math.max(0, 1 - elapsed / TOAST_DURATION_MS);
      setProgress(remaining * 100);

      if (elapsed >= TOAST_DURATION_MS) {
        onDismiss();
        return;
      }

      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [onDismiss, open]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed bottom-6 left-1/2 z-[60] w-[min(92vw,26rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-hub-approved/25 bg-hub-paper shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
    >
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-hub-foreground">
          Project tour paused
        </p>
        <p className="mt-0.5 text-xs text-hub-foreground/55">
          Resume now or we&apos;ll mark it complete.
        </p>
        <button
          type="button"
          onClick={onResume}
          className="mt-3 rounded-md bg-hub-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1590e8]"
        >
          Resume onboarding
        </button>
      </div>
      <div className="h-1 bg-hub-foreground/8">
        <div
          className="h-full bg-hub-approved transition-[width] duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
