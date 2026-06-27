export const PROJECT_OPENING_STAGE_MS = 1_100;

export const PROJECT_OPENING_STAGES = [
  "Opening your project…",
  "Gathering boards and files…",
  "Almost there…",
] as const;

export type ProjectOpeningStage = (typeof PROJECT_OPENING_STAGES)[number];

export const PROJECT_OPENING_MIN_VISIBLE_MS = 720;
