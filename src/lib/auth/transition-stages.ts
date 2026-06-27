export type AuthTransitionKind =
  | "sign-in"
  | "create-account"
  | "send-magic-link"
  | "complete-sign-in"
  | "welcome-sign-in"
  | "open-hub"
  | "enter-hub";

export const AUTH_TRANSITION_STAGE_MS = 1_350;
export const AUTH_TRANSITION_WELCOME_STAGE_MS = 850;

export const AUTH_TRANSITION_STAGES: Record<
  AuthTransitionKind,
  readonly [string, string, string]
> = {
  "sign-in": [
    "Signing in…",
    "Loading your projects…",
    "Getting the hub ready…",
  ],
  "create-account": [
    "Creating your account…",
    "Setting up your profile…",
    "Preparing your workspace…",
  ],
  "send-magic-link": [
    "Sending sign-in link…",
    "Checking your email…",
    "Link on its way…",
  ],
  "complete-sign-in": [
    "Completing sign-in…",
    "Syncing your profile…",
    "Opening the hub…",
  ],
  "welcome-sign-in": [
    "Welcome",
    "Opening your hub…",
    "Almost there…",
  ],
  "open-hub": [
    "Opening hub…",
    "Loading your projects…",
    "Almost there…",
  ],
  "enter-hub": [
    "Loading…",
    "Warming up the hub…",
    "One moment…",
  ],
};

export function getAuthTransitionStages(
  kind: AuthTransitionKind,
  firstName?: string,
): readonly [string, string, string] {
  if (kind === "welcome-sign-in") {
    const name = firstName?.trim() || "there";
    return [`Welcome, ${name}`, "Opening your hub…", "Almost there…"];
  }

  return AUTH_TRANSITION_STAGES[kind];
}

export function getAuthTransitionStageMs(kind: AuthTransitionKind): number {
  return kind === "welcome-sign-in"
    ? AUTH_TRANSITION_WELCOME_STAGE_MS
    : AUTH_TRANSITION_STAGE_MS;
}
