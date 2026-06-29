const PREFIX = "fsh-for-you-triage";

type TriageMap = Record<string, number>;

function readMap(userId: string, suffix: string): TriageMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${PREFIX}:${suffix}:${userId}`);
    if (!raw) return {};
    return JSON.parse(raw) as TriageMap;
  } catch {
    return {};
  }
}

function writeMap(userId: string, suffix: string, map: TriageMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}:${suffix}:${userId}`, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function snoozeForYouItem(
  userId: string,
  itemId: string,
  wakeAt: Date,
): void {
  const map = readMap(userId, "snooze");
  map[itemId] = wakeAt.getTime();
  writeMap(userId, "snooze", map);
}

export function isForYouItemSnoozed(userId: string, itemId: string): boolean {
  const wakeAt = readMap(userId, "snooze")[itemId];
  if (!wakeAt) return false;
  if (Date.now() >= wakeAt) {
    const map = readMap(userId, "snooze");
    delete map[itemId];
    writeMap(userId, "snooze", map);
    return false;
  }
  return true;
}

export function markForYouItemHandled(userId: string, itemId: string): void {
  const map = readMap(userId, "handled");
  map[itemId] = Date.now();
  writeMap(userId, "handled", map);
}

export function isForYouItemHandled(userId: string, itemId: string): boolean {
  return Boolean(readMap(userId, "handled")[itemId]);
}

export function clearForYouItemHandled(userId: string, itemId: string): void {
  const map = readMap(userId, "handled");
  delete map[itemId];
  writeMap(userId, "handled", map);
}

export const SNOOZE_OPTIONS = [
  { id: "later-today", label: "Later today", hours: 4 },
  { id: "tomorrow", label: "Tomorrow", hours: 24 },
  { id: "next-week", label: "Next week", hours: 24 * 7 },
] as const;
