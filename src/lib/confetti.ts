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
