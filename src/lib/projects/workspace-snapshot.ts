const STORAGE_KEY = "fsh-hub-workspace-snapshots";

export type WorkspaceSnapshot = {
  hasInitiatives: boolean;
};

type WorkspaceSnapshotStore = Record<string, WorkspaceSnapshot>;

function readStore(): WorkspaceSnapshotStore {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WorkspaceSnapshotStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: WorkspaceSnapshotStore) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private mode
  }
}

export function readWorkspaceSnapshot(
  projectId: string,
): WorkspaceSnapshot | null {
  return readStore()[projectId] ?? null;
}

export function captureWorkspaceSnapshot(
  projectId: string,
  snapshot: WorkspaceSnapshot,
) {
  const store = readStore();
  const existing = store[projectId];

  if (existing?.hasInitiatives === snapshot.hasInitiatives) {
    return;
  }

  writeStore({
    ...store,
    [projectId]: snapshot,
  });
}
