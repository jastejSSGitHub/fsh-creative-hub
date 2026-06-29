/** Google OAuth often stores the photo as `picture` instead of `avatar_url`. */
export function avatarUrlFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata) return null;

  for (const key of ["avatar_url", "picture"] as const) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return normalizeExternalAvatarUrl(value);
    }
  }

  return null;
}

/** Normalize third-party avatar URLs (Google profile photos, etc.). */
export function normalizeExternalAvatarUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith("http://") ? trimmed.replace("http://", "https://") : trimmed;
}
