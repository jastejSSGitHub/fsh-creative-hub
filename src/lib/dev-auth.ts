export const DEV_BYPASS_EMAIL = "dev@fshdesign.local";
export const DEV_BYPASS_DISPLAY_NAME = "Jastej Sehra";

/** Previous dev-bypass labels stored in canvas nodes before display name was personalized. */
export const LEGACY_DEV_BYPASS_DISPLAY_NAMES = ["Dev User"] as const;

/** Maps legacy dev-bypass author labels to the current display name. */
export function resolveDevBypassDisplayName(name: string): string {
  if (
    LEGACY_DEV_BYPASS_DISPLAY_NAMES.includes(
      name as (typeof LEGACY_DEV_BYPASS_DISPLAY_NAMES)[number],
    )
  ) {
    return DEV_BYPASS_DISPLAY_NAME;
  }
  return name;
}

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
