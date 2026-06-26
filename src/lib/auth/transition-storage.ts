const AUTH_TRANSITION_KEY = "fsh-hub-auth-transition";

export type StoredAuthTransition = {
  label: string;
  startedAt: number;
};

export function persistAuthTransition(label: string) {
  if (typeof window === "undefined") return;

  const payload: StoredAuthTransition = {
    label,
    startedAt: Date.now(),
  };
  sessionStorage.setItem(AUTH_TRANSITION_KEY, JSON.stringify(payload));
}

export function readAuthTransition(): StoredAuthTransition | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(AUTH_TRANSITION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuthTransition;
  } catch {
    sessionStorage.removeItem(AUTH_TRANSITION_KEY);
    return null;
  }
}

export function clearAuthTransition() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_TRANSITION_KEY);
}
