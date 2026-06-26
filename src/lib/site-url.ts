/**
 * Canonical site URL for auth redirects (magic link + OAuth).
 * Set NEXT_PUBLIC_SITE_URL in .env.local and Vercel env vars.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3010";
}
