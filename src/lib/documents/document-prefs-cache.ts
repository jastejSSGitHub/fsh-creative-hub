import type { DocumentCover } from "@/lib/documents/types";

const PREFS_KEY_PREFIX = "fsh-hub-doc-prefs";
const LEGACY_SEEDED_KEY_PREFIX = "fsh-hub-doc-legacy-seeded";

export type DocumentPrefsCache = {
  cover: DocumentCover | null;
  icon: string | null;
  savedAt: number;
};

function prefsKey(projectId: string, docId: string) {
  return `${PREFS_KEY_PREFIX}:${projectId}:${docId}`;
}

function legacySeededKey(docId: string) {
  return `${LEGACY_SEEDED_KEY_PREFIX}:${docId}`;
}

export function readDocumentPrefsCache(
  projectId: string,
  docId: string,
): DocumentPrefsCache | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(prefsKey(projectId, docId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as DocumentPrefsCache;
    if (typeof parsed !== "object" || parsed === null) return null;

    return {
      cover: parsed.cover ?? null,
      icon: typeof parsed.icon === "string" ? parsed.icon : null,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function writeDocumentPrefsCache(
  projectId: string,
  docId: string,
  prefs: Pick<DocumentPrefsCache, "cover" | "icon">,
) {
  if (typeof window === "undefined") return;

  try {
    const payload: DocumentPrefsCache = {
      cover: prefs.cover ?? null,
      icon: prefs.icon ?? null,
      savedAt: Date.now(),
    };
    localStorage.setItem(prefsKey(projectId, docId), JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function hasLegacyDefaultsSeeded(docId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(legacySeededKey(docId)) === "1";
}

export function markLegacyDefaultsSeeded(docId: string) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(legacySeededKey(docId), "1");
  } catch {
    // ignore
  }
}
