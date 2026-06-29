export function isEnvToken(value: string): boolean {
  return /^(NEXT_PUBLIC_|SUPABASE_|DEV_|E2E_)/.test(value);
}

export function looksLikeDocsCodeToken(value: string): boolean {
  return (
    isEnvToken(value) ||
    /^[A-Z][A-Z0-9_]+$/.test(value) ||
    /^--[\w-]+$/.test(value) ||
    /^\//.test(value) ||
    /^hub_[\w]+$/.test(value) ||
    /^[\w./-]+\.(ts|tsx|sql|md|mjs|js)$/.test(value) ||
    /^\d{3}_[\w.]+\.sql$/.test(value)
  );
}
