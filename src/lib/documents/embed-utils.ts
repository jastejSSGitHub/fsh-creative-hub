export type EmbedKind = "url" | "html";

export function normalizeEmbedUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isLikelyUrl(value: string): boolean {
  return normalizeEmbedUrl(value) !== null;
}

/** When input is only a URL (not HTML markup), return the normalized URL. */
export function resolveUrlOnlyEmbed(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("<") && trimmed.includes(">")) return null;
  return normalizeEmbedUrl(trimmed);
}

export function isHtmlMarkup(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.includes("<") && trimmed.includes(">");
}

export function extractUrlFromDataTransfer(dataTransfer: DataTransfer): string | null {
  const uriList = dataTransfer.getData("text/uri-list").split("\n")[0]?.trim();
  if (uriList && isLikelyUrl(uriList)) return normalizeEmbedUrl(uriList)!;

  const plain = dataTransfer.getData("text/plain").trim();
  if (plain && isLikelyUrl(plain)) return normalizeEmbedUrl(plain)!;

  return null;
}

export function embedHostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function wrapHtmlDocument(html: string): string {
  const trimmed = html.trim();
  if (/<html[\s>]/i.test(trimmed)) return trimmed;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { margin: 0; font-family: system-ui, sans-serif; padding: 1rem; }
</style>
</head>
<body>${trimmed}</body>
</html>`;
}
