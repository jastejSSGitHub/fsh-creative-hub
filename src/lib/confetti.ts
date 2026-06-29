import confetti from "canvas-confetti";

type ConfettiOrigin = { x: number; y: number };

function normalizedOrigin(clientX: number, clientY: number): ConfettiOrigin {
  return {
    x: clientX / window.innerWidth,
    y: clientY / window.innerHeight,
  };
}

/** Small, localized burst — e.g. placing a sticker on the canvas. */
export function fireSubtleConfetti(clientX?: number, clientY?: number) {
  if (typeof window === "undefined") return;

  const origin =
    clientX !== undefined && clientY !== undefined
      ? normalizedOrigin(clientX, clientY)
      : { x: 0.5, y: 0.5 };

  void confetti({
    particleCount: 8,
    spread: 42,
    startVelocity: 14,
    scalar: 0.5,
    ticks: 60,
    gravity: 0.9,
    origin,
    colors: ["#ffc94b", "#18a0fb", "#22c55e", "#a855f7"],
    disableForReducedMotion: true,
  });
}

/** Brief welcome burst after Google / OAuth sign-in. */
export function fireWelcomeConfetti() {
  if (typeof window === "undefined") return;

  const colors = ["#ffc94b", "#18a0fb", "#22c55e", "#fbf7ee"];

  void confetti({
    particleCount: 12,
    spread: 58,
    startVelocity: 18,
    scalar: 0.55,
    ticks: 80,
    gravity: 0.85,
    origin: { x: 0.5, y: 0.42 },
    colors,
    disableForReducedMotion: true,
  });

  window.setTimeout(() => {
    void confetti({
      particleCount: 6,
      spread: 72,
      startVelocity: 12,
      scalar: 0.45,
      ticks: 60,
      origin: { x: 0.35, y: 0.5 },
      colors,
      disableForReducedMotion: true,
    });
    void confetti({
      particleCount: 6,
      spread: 72,
      startVelocity: 12,
      scalar: 0.45,
      ticks: 60,
      origin: { x: 0.65, y: 0.5 },
      colors,
      disableForReducedMotion: true,
    });
  }, 180);
}

/** Brief burst when dev tools unlock at bottom-right. */
export function fireDevToolsUnlockConfetti() {
  if (typeof window === "undefined") return;

  const colors = ["#7c3aed", "#ffc94b", "#18a0fb", "#22c55e"];

  void confetti({
    particleCount: 28,
    spread: 62,
    startVelocity: 22,
    scalar: 0.7,
    ticks: 90,
    gravity: 0.85,
    origin: { x: 0.92, y: 0.92 },
    colors,
    disableForReducedMotion: true,
  });
}

/** Brief burst when a task is created via quick add. */
export function fireTaskAddedConfetti() {
  if (typeof window === "undefined") return;

  const colors = ["#22c55e", "#18a0fb", "#ffc94b", "#a855f7"];

  void confetti({
    particleCount: 14,
    spread: 58,
    startVelocity: 18,
    scalar: 0.5,
    ticks: 60,
    gravity: 0.9,
    origin: { x: 0.5, y: 0.48 },
    colors,
    disableForReducedMotion: true,
  });
}

/** Medium celebration — e.g. restoring a project. Kept brief and light. */
export function fireConfetti() {
  if (typeof window === "undefined") return;

  const duration = 700;
  const end = Date.now() + duration;
  const colors = ["#ffc94b", "#18a0fb", "#22c55e", "#ef4444", "#fbf7ee"];

  (function frame() {
    void confetti({
      particleCount: 2,
      angle: 60,
      spread: 45,
      startVelocity: 20,
      scalar: 0.65,
      ticks: 70,
      origin: { x: 0, y: 0.72 },
      colors,
      disableForReducedMotion: true,
    });
    void confetti({
      particleCount: 2,
      angle: 120,
      spread: 45,
      startVelocity: 20,
      scalar: 0.65,
      ticks: 70,
      origin: { x: 1, y: 0.72 },
      colors,
      disableForReducedMotion: true,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
