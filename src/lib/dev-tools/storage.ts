const UNLOCKED_KEY = "fsh-dev-tools-unlocked";
const SIMULATE_NEW_USER_KEY = "fsh-dev-tools-simulate-new-user";

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
