const UNLOCKED_KEY = "fsh-dev-tools-unlocked";
const SIMULATE_NEW_USER_KEY = "fsh-dev-tools-simulate-new-user";
const MOCK_COLLABORATION_KEY = "fsh-dev-tools-mock-collaboration";

export const MOCK_COLLABORATION_COOKIE = "fsh-mock-collaboration";

export function readDevToolsUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(UNLOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeDevToolsUnlocked(unlocked: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (unlocked) {
      localStorage.setItem(UNLOCKED_KEY, "1");
    } else {
      localStorage.removeItem(UNLOCKED_KEY);
    }
  } catch {
    // ignore
  }
}

export function readSimulateNewUser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIMULATE_NEW_USER_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSimulateNewUser(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) {
      localStorage.setItem(SIMULATE_NEW_USER_KEY, "1");
    } else {
      localStorage.removeItem(SIMULATE_NEW_USER_KEY);
    }
  } catch {
    // ignore
  }
}

export function readMockCollaborationData(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MOCK_COLLABORATION_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeMockCollaborationData(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) {
      localStorage.setItem(MOCK_COLLABORATION_KEY, "1");
      document.cookie = `${MOCK_COLLABORATION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      localStorage.removeItem(MOCK_COLLABORATION_KEY);
      document.cookie = `${MOCK_COLLABORATION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch {
    // ignore
  }
}
