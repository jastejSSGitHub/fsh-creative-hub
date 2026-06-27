export const PROJECT_CREATION_STAGE_MS = 1_200;

export const PROJECT_CREATION_STAGES = [
  "Creating your project…",
  "Setting up the workspace…",
  "Preparing templates…",
  "Almost ready…",
] as const;

export type ProjectCreationStage = (typeof PROJECT_CREATION_STAGES)[number];
