/** Match env vars, paths, hub tables, and file names inside prose. */
const INLINE_CODE_RE = new RegExp(
  [
    "(?:NEXT_PUBLIC_|SUPABASE_|DEV_|E2E_)[A-Z0-9_]+(?:=[^\\s,.;]+)?",
    "\\.env(?:\\.\\w+)?",
    "hub_[a-z0-9_]+",
    "/[\\w./-]+",
    "[A-Z][A-Z0-9]*_[A-Z0-9_]+",
    "[\\w./-]+\\.(?:ts|tsx|sql|md|mjs|js|local)",
  ].join("|"),
  "g",
);

export type InlineDocsSegment = { kind: "text" | "code"; value: string };

export function splitInlineDocsCode(text: string): InlineDocsSegment[] {
  const segments: InlineDocsSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_CODE_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, index) });
    }
    segments.push({ kind: "code", value: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ kind: "text", value: text }];
}

export function hasInlineDocsCode(text: string): boolean {
  INLINE_CODE_RE.lastIndex = 0;
  return INLINE_CODE_RE.test(text);
}
