export const DEV_BYPASS_EMAIL = "dev@fshdesign.local";
export const DEV_BYPASS_DISPLAY_NAME = "Dev User";

/** Server-only: never enable in production deployments. */
export function isDevAuthBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_BYPASS === "true"
  );
}

export function getDevBypassPassword(): string {
  return process.env.DEV_AUTH_BYPASS_PASSWORD ?? "dev-bypass-local-only";
}
