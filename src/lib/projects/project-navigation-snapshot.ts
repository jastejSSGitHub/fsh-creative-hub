const STORAGE_KEY = "fsh-hub-project-nav";

export type ProjectNavigationSnapshot = {
  projectId: string;
  projectName: string;
  fileCount?: number;
};

export function captureProjectNavigationSnapshot(
  snapshot: ProjectNavigationSnapshot,
) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota / private mode
  }
}

export function readProjectNavigationSnapshot(
  projectId: string,
): ProjectNavigationSnapshot | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ProjectNavigationSnapshot;
    if (parsed?.projectId !== projectId) return null;

    return parsed;
  } catch {
    return null;
  }
}
