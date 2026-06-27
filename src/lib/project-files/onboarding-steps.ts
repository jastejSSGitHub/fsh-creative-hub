export type ProjectIntroStep =
  | "welcome"
  | "create"
  | "templates"
  | "favorite"
  | "share";

export const PROJECT_INTRO_STEPS: ProjectIntroStep[] = [
  "welcome",
  "create",
  "templates",
  "favorite",
  "share",
];

export const PROJECT_INTRO_MESSAGES: Record<
  ProjectIntroStep,
  { title: string; body: string; cta: string }
> = {
  welcome: {
    title: "Welcome to your project",
    body: "Create files, pick a template, star your go-tos, and invite the team — all from here.",
    cta: "Show me",
  },
  create: {
    title: "Create any file type",
    body: "Review boards for assets, open canvases for ideas, and text docs for notes.",
    cta: "Next",
  },
  templates: {
    title: "Or start from a sample",
    body: "Pick a template below to jump in with a pre-built structure.",
    cta: "Next",
  },
  favorite: {
    title: "Star files you use most",
    body: "Hover a file and tap the star to pin it to Favorites at the top.",
    cta: "Next",
  },
  share: {
    title: "Invite your team",
    body: "Share the project link or invite by email so everyone can collaborate.",
    cta: "Got it",
  },
};

export function projectIntroStepCardClass(step: ProjectIntroStep): string {
  switch (step) {
    case "welcome":
      return "bottom-24 left-1/2 -translate-x-1/2";
    case "create":
      return "top-24 right-[max(1rem,calc(50%-12rem))] max-sm:left-4 max-sm:right-4 max-sm:top-28";
    case "templates":
      return "bottom-24 left-1/2 -translate-x-1/2 max-sm:bottom-32";
    case "favorite":
      return "bottom-24 left-4 max-sm:left-1/2 max-sm:-translate-x-1/2";
    case "share":
      return "";
    default:
      return "bottom-24 left-1/2 -translate-x-1/2";
  }
}

export function projectIntroStepHasTarget(
  step: ProjectIntroStep,
  hasFiles: boolean,
): boolean {
  if (step === "welcome" || step === "share") return false;
  if (step === "favorite" && !hasFiles) return false;
  return true;
}
