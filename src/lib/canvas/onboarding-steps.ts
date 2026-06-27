export type CanvasIntroStep = "welcome" | "sticky" | "sticker" | "timer" | "share";

export const CANVAS_INTRO_STEPS: CanvasIntroStep[] = [
  "welcome",
  "sticky",
  "sticker",
  "timer",
  "share",
];

export const CANVAS_INTRO_MESSAGES: Record<
  CanvasIntroStep,
  { title: string; body: string; cta: string }
> = {
  welcome: {
    title: "Brainstorming on Open canvas",
    body: "Drop stickies, add stickers, and run timed brainstorms with your team.",
    cta: "Go on…",
  },
  sticky: {
    title: "Sticky notes let you share ideas",
    body: "Use the sticky tool in the bottom toolbar. Place one in the blue Ideas section — it snaps in magnetically.",
    cta: "Next",
  },
  sticker: {
    title: "Stickers are here",
    body: "They're great for voting. Open the sticker tool and place a thumbs up anywhere on the canvas.",
    cta: "Next",
  },
  timer: {
    title: "Timer",
    body: "The Brainstorming panel is open on the right — start a timer during live sessions.",
    cta: "Next",
  },
  share: {
    title: "When you're ready…",
    body: "Invite teammates to this project so everyone can brainstorm together on this canvas.",
    cta: "Share board",
  },
};

export function introStepCardClass(step: CanvasIntroStep): string {
  switch (step) {
    case "welcome":
      return "bottom-24 left-1/2 -translate-x-1/2";
    case "sticky":
      return "bottom-[8.5rem] left-[max(1rem,calc(50%-11.5rem))]";
    case "sticker":
      return "bottom-[8.5rem] left-[max(1rem,calc(50%-5.5rem))]";
    case "timer":
      return "right-[18rem] top-20 max-sm:bottom-36 max-sm:left-1/2 max-sm:right-auto max-sm:top-auto max-sm:-translate-x-1/2";
    case "share":
      return "top-16 right-[18rem] max-sm:top-20 max-sm:left-4 max-sm:right-4";
    default:
      return "bottom-24 left-1/2 -translate-x-1/2";
  }
}

export function introStepHasTarget(step: CanvasIntroStep): boolean {
  return step !== "welcome";
}
