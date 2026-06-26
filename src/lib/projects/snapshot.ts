import type { ProjectCardData } from "@/lib/projects/queries";

const STORAGE_KEY = "fsh-hub-projects-page-snapshot";
export const PROJECTS_SNAPSHOT_CHANGE_EVENT = "fsh-hub-projects-snapshot-change";

export type ProjectCardSnapshot = {
  titleWidth: "sm" | "md" | "lg";
  hasCover: boolean;
};

export type ProjectsPageSnapshot = {
  capturedOn: string;
  activeCount: number;
  trashCount: number;
  favoriteCount: number;
  showFavoritesSection: boolean;
  showAllProjectsSection: boolean;
  cards: ProjectCardSnapshot[];
};

export const DEFAULT_PROJECTS_PAGE_SNAPSHOT: ProjectsPageSnapshot = {
  capturedOn: "",
  activeCount: 1,
  trashCount: 0,
  favoriteCount: 0,
  showFavoritesSection: false,
  showAllProjectsSection: true,
  cards: [{ titleWidth: "md", hasCover: false }],
};

const FALLBACK_CARD: ProjectCardSnapshot = {
  titleWidth: "md",
  hasCover: false,
};

function normalizeCards(
  cards: ProjectCardSnapshot[],
  activeCount: number,
): ProjectCardSnapshot[] {
  const target = Math.max(activeCount, 0);
  if (target === 0) return [];

  if (cards.length === target) return cards;
  if (cards.length > target) return cards.slice(0, target);

  return [
    ...cards,
    ...Array.from({ length: target - cards.length }, () => ({ ...FALLBACK_CARD })),
  ];
}

function normalizeSnapshot(
  snapshot: Partial<ProjectsPageSnapshot>,
): ProjectsPageSnapshot {
  const activeCount = Math.max(snapshot.activeCount ?? 1, 0);
  const favoriteCount = Math.min(
    Math.max(snapshot.favoriteCount ?? 0, 0),
    activeCount,
  );
  const cards = normalizeCards(
    Array.isArray(snapshot.cards) ? snapshot.cards : [],
    activeCount,
  );

  return {
    capturedOn: snapshot.capturedOn ?? "",
    activeCount,
    trashCount: Math.max(snapshot.trashCount ?? 0, 0),
    favoriteCount,
    showFavoritesSection:
      snapshot.showFavoritesSection !== undefined
        ? Boolean(snapshot.showFavoritesSection)
        : favoriteCount > 0,
    showAllProjectsSection:
      snapshot.showAllProjectsSection !== undefined
        ? Boolean(snapshot.showAllProjectsSection)
        : activeCount - favoriteCount > 0,
    cards,
  };
}

let cachedRaw: string | null | undefined;
let cachedSnapshot: ProjectsPageSnapshot = DEFAULT_PROJECTS_PAGE_SNAPSHOT;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function titleWidthBucket(name: string): ProjectCardSnapshot["titleWidth"] {
  if (name.length <= 12) return "sm";
  if (name.length <= 22) return "md";
  return "lg";
}

function buildSnapshot(projects: ProjectCardData[]): ProjectsPageSnapshot {
  const active = projects.filter((project) => !project.trashed_at);
  const trashed = projects.filter((project) => project.trashed_at);
  const favorites = active.filter((project) => project.isFavorite);
  const regular = active.filter((project) => !project.isFavorite);

  const favoriteCards = favorites.map((project) => ({
    titleWidth: titleWidthBucket(project.name),
    hasCover: Boolean(project.cover_url),
  }));
  const regularCards = regular.map((project) => ({
    titleWidth: titleWidthBucket(project.name),
    hasCover: Boolean(project.cover_url),
  }));

  return normalizeSnapshot({
    capturedOn: todayKey(),
    activeCount: active.length,
    trashCount: trashed.length,
    favoriteCount: favorites.length,
    showFavoritesSection: favorites.length > 0,
    showAllProjectsSection: regular.length > 0,
    cards: [...favoriteCards, ...regularCards].slice(0, 12),
  });
}

function parseSnapshot(raw: string | null): ProjectsPageSnapshot {
  if (!raw) return DEFAULT_PROJECTS_PAGE_SNAPSHOT;

  try {
    const parsed = JSON.parse(raw) as ProjectsPageSnapshot;
    if (!parsed) return DEFAULT_PROJECTS_PAGE_SNAPSHOT;

    return normalizeSnapshot(parsed);
  } catch {
    return DEFAULT_PROJECTS_PAGE_SNAPSHOT;
  }
}

function syncSnapshotCache(raw: string | null, snapshot: ProjectsPageSnapshot) {
  cachedRaw = raw;
  cachedSnapshot = snapshot;
}

export function readProjectsPageSnapshot(): ProjectsPageSnapshot {
  if (typeof window === "undefined") {
    return DEFAULT_PROJECTS_PAGE_SNAPSHOT;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedSnapshot;
  }

  const snapshot = parseSnapshot(raw);
  syncSnapshotCache(raw, snapshot);
  return snapshot;
}

export function captureProjectsPageSnapshot(projects: ProjectCardData[]): void {
  if (typeof window === "undefined") return;

  const next = buildSnapshot(projects);
  const existing = readProjectsPageSnapshot();

  if (existing.capturedOn === next.capturedOn && existing.activeCount === next.activeCount) {
    const sameCards =
      existing.cards.length === next.cards.length &&
      existing.cards.every(
        (card, index) =>
          card.titleWidth === next.cards[index]?.titleWidth &&
          card.hasCover === next.cards[index]?.hasCover,
      );

    if (sameCards) return;
  }

  try {
    const serialized = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, serialized);
    syncSnapshotCache(serialized, next);
    window.dispatchEvent(new Event(PROJECTS_SNAPSHOT_CHANGE_EVENT));
  } catch {
    // ignore quota / private mode
  }
}

export function activeProjectLabel(count: number): string {
  return `${count} active project${count === 1 ? "" : "s"}`;
}

export function subscribeToProjectsPageSnapshot(onStoreChange: () => void) {
  const handleChange = () => onStoreChange();

  window.addEventListener(PROJECTS_SNAPSHOT_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(PROJECTS_SNAPSHOT_CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}
