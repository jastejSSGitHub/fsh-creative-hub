import confetti from "canvas-confetti";

export function fireConfetti() {
  if (typeof window === "undefined") return;

  const duration = 1800;
  const end = Date.now() + duration;
  const colors = ["#ffc94b", "#18a0fb", "#22c55e", "#ef4444", "#fbf7ee"];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
