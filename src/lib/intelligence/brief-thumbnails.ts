const VIDEO_URL_RE = /\.(mp4|webm|mov)(\?|$)/i;

export function isVideoMediaUrl(url: string): boolean {
  return VIDEO_URL_RE.test(url);
}

/** Small preview URL for intelligence rows (~36–40px display, 2× for retina). */
export function resolveBriefItemThumbnail(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  if (isVideoMediaUrl(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes("/storage/v1/object/public/")) {
    const renderUrl = trimmed.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );
    const separator = renderUrl.includes("?") ? "&" : "?";
    return `${renderUrl}${separator}width=80&height=80&resize=cover&quality=55`;
  }

  return trimmed;
}

export function resolveBriefItemMediaType(
  url: string,
  explicit?: "image" | "video",
): "image" | "video" {
  if (explicit) return explicit;
  return isVideoMediaUrl(url) ? "video" : "image";
}
