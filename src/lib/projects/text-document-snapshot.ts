import type { DocumentCover } from "@/lib/documents/types";

const STORAGE_KEY = "fsh-hub-text-document-nav";

export type TextDocumentNavigationSnapshot = {
  projectId: string;
  docId: string;
  docName: string;
  icon: string | null;
  cover: DocumentCover | null;
};

export function captureTextDocumentNavigationSnapshot(
  snapshot: TextDocumentNavigationSnapshot,
) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota / private mode
  }
}

export function readTextDocumentNavigationSnapshot(
  projectId: string,
  docId: string,
): TextDocumentNavigationSnapshot | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as TextDocumentNavigationSnapshot;
    if (parsed.projectId !== projectId || parsed.docId !== docId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
