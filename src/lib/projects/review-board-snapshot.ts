const STORAGE_KEY = "fsh-hub-review-board-nav";

export type ReviewBoardNavigationSnapshot = {
  projectId: string;
  boardId: string;
  projectName: string;
  boardName: string;
  sectionCount: number;
  assetCount: number;
};

export function captureReviewBoardNavigationSnapshot(
  snapshot: ReviewBoardNavigationSnapshot,
) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota / private mode
  }
}

export function readReviewBoardNavigationSnapshot(
  projectId: string,
  boardId: string,
): ReviewBoardNavigationSnapshot | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ReviewBoardNavigationSnapshot;
    if (parsed.projectId !== projectId || parsed.boardId !== boardId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
