export const DEV_TOOLS_SIMULATE_CHANGED = "fsh-dev-tools-simulate-changed";
export const DEV_TOOLS_UNLOCKED_CHANGED = "fsh-dev-tools-unlocked-changed";

export function dispatchDevToolsSimulateChanged(simulate: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DEV_TOOLS_SIMULATE_CHANGED, { detail: { simulate } }),
  );
}

export function dispatchDevToolsUnlockedChanged(unlocked: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DEV_TOOLS_UNLOCKED_CHANGED, { detail: { unlocked } }),
  );
}
