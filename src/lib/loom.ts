const LOOM_SHARE_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/;

export function extractLoomId(shareOrEmbedUrl: string): string | null {
  const match = shareOrEmbedUrl.match(LOOM_SHARE_PATTERN);
  return match?.[1] ?? null;
}

type LoomEmbedOptions = {
  autoplay?: boolean;
  muted?: boolean;
};

export function loomEmbedUrl(
  shareOrEmbedUrl: string,
  { autoplay = false, muted = false }: LoomEmbedOptions = {},
): string | null {
  const id = extractLoomId(shareOrEmbedUrl);
  if (!id) return null;

  const params = new URLSearchParams({
    hide_owner: "true",
    hide_share: "true",
    hide_title: "true",
    hideEmbedTopBar: "true",
  });

  if (autoplay) params.set("autoplay", "1");
  if (muted) params.set("muted", "1");

  return `https://www.loom.com/embed/${id}?${params.toString()}`;
}
