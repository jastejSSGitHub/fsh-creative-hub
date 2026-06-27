import { normalizeEmbedUrl } from "@/lib/documents/embed-utils";

export type TextSegment =
  | { type: "text"; value: string }
  | { type: "url"; value: string; href: string };

const EXPLICIT_URL_PATTERN = /^https?:\/\/.+/i;

/** Bare domain + optional path — must include a TLD dot, no spaces. */
const BARE_DOMAIN_URL_PATTERN =
  /^(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])+)+\/?(?:[^\s]*)?$/;

const INLINE_URL_PATTERN = /\bhttps?:\/\/[^\s<>"')\]]+/gi;

/**
 * Strict URL check for inline link tags in document text/tables.
 * Does not treat arbitrary words ("title", "resources") as URLs.
 */
export function resolveDisplayUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/\s/.test(trimmed)) return null;
  if (trimmed.includes("<") && trimmed.includes(">")) return null;

  if (EXPLICIT_URL_PATTERN.test(trimmed)) {
    return normalizeEmbedUrl(trimmed);
  }

  if (BARE_DOMAIN_URL_PATTERN.test(trimmed)) {
    return normalizeEmbedUrl(trimmed);
  }

  return null;
}

export function truncateUrlDisplay(raw: string, maxLength = 40): string {
  const normalized = resolveDisplayUrl(raw) ?? raw.trim();

  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, "");
    const path = `${url.pathname}${url.search}${url.hash}`;
    const label = path === "/" ? host : `${host}${path}`;

    if (label.length <= maxLength) return label;
    return `${label.slice(0, maxLength - 1)}…`;
  } catch {
    const trimmed = raw.trim();
    if (trimmed.length <= maxLength) return trimmed;
    return `${trimmed.slice(0, maxLength - 1)}…`;
  }
}

export function isUrlOnlyText(value: string): boolean {
  return resolveDisplayUrl(value) !== null;
}

export function splitTextByUrls(text: string): TextSegment[] {
  if (!text) return [{ type: "text", value: "" }];

  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_URL_PATTERN)) {
    const raw = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    const href = resolveDisplayUrl(raw);
    if (href) {
      segments.push({ type: "url", value: raw, href });
    } else {
      segments.push({ type: "text", value: raw });
    }

    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", value: text }];
}

export function textContainsUrl(text: string): boolean {
  if (isUrlOnlyText(text)) return true;
  return splitTextByUrls(text).some((segment) => segment.type === "url");
}
