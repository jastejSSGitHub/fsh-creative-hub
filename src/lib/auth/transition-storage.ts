import type { AuthTransitionKind } from "@/lib/auth/transition-stages";

const AUTH_TRANSITION_KEY = "fsh-hub-auth-transition";

/** Transitions older than this are treated as abandoned (back button, failed OAuth, etc.). */
export const AUTH_TRANSITION_MAX_AGE_MS = 90_000;

export type StoredAuthTransition = {
  kind: AuthTransitionKind;
  startedAt: number;
};

export function persistAuthTransition(kind: AuthTransitionKind) {
  if (typeof window === "undefined") return;

  const payload: StoredAuthTransition = {
    kind,
    startedAt: Date.now(),
  };
  sessionStorage.setItem(AUTH_TRANSITION_KEY, JSON.stringify(payload));
}

export function readAuthTransition(): StoredAuthTransition | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(AUTH_TRANSITION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredAuthTransition;
    if (!parsed.kind || typeof parsed.startedAt !== "number") {
      sessionStorage.removeItem(AUTH_TRANSITION_KEY);
      return null;
    }
    if (Date.now() - parsed.startedAt > AUTH_TRANSITION_MAX_AGE_MS) {
      sessionStorage.removeItem(AUTH_TRANSITION_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(AUTH_TRANSITION_KEY);
    return null;
  }
}

export function clearAuthTransition() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_TRANSITION_KEY);
}
