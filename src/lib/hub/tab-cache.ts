export type HubTabCacheKey = "projects" | "for-you" | "tasks";

const PREFIX = "fsh-hub-tab:";
const TTL_MS = 10 * 60 * 1000;

type CacheEnvelope<T> = {
  at: number;
  data: T;
};

export function readHubTabCache<T>(key: HubTabCacheKey): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() - parsed.at > TTL_MS) {
      sessionStorage.removeItem(`${PREFIX}${key}`);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function writeHubTabCache<T>(key: HubTabCacheKey, data: T) {
  if (typeof window === "undefined") return;

  try {
    const envelope: CacheEnvelope<T> = { at: Date.now(), data };
    sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify(envelope));
  } catch {
    // Storage full or unavailable — ignore.
  }
}
