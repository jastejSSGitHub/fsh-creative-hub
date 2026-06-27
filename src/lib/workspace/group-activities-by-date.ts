import type { ActivityWithActor } from "@/lib/workspace/queries";

export type ActivityDateGroup = {
  id: string;
  label: string;
  sortOrder: number;
  activities: ActivityWithActor[];
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function dayDiff(from: Date, to: Date): number {
  return Math.round(
    (startOfDay(from).getTime() - startOfDay(to).getTime()) / 86_400_000,
  );
}

function startOfWeekMonday(date: Date): Date {
  const monday = startOfDay(date);
  const weekday = monday.getDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  monday.setDate(monday.getDate() - offset);
  return monday;
}

export function groupActivitiesByDate(
  activities: ActivityWithActor[],
): ActivityDateGroup[] {
  if (!activities.length) return [];

  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisWeekStart = startOfWeekMonday(today);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const buckets = new Map<string, ActivityDateGroup>();

  for (const activity of activities) {
    const date = new Date(activity.created_at);
    const dayStart = startOfDay(date);

    let id: string;
    let label: string;
    let sortOrder: number;

    if (isSameCalendarDay(date, today)) {
      id = "today";
      label = "Today";
      sortOrder = 0;
    } else if (isSameCalendarDay(date, yesterday)) {
      id = "yesterday";
      label = "Yesterday";
      sortOrder = 1;
    } else if (dayStart >= thisWeekStart) {
      const iso = dayStart.toISOString().slice(0, 10);
      id = `day-${iso}`;
      label = date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      sortOrder = 2 + dayDiff(today, date);
    } else if (dayStart >= lastWeekStart) {
      id = "last-week";
      label = "Last week";
      sortOrder = 20;
    } else {
      id = `month-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      label = date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
      sortOrder =
        100 +
        (today.getFullYear() - date.getFullYear()) * 12 +
        (today.getMonth() - date.getMonth());
    }

    const bucket = buckets.get(id);
    if (bucket) {
      bucket.activities.push(activity);
    } else {
      buckets.set(id, { id, label, sortOrder, activities: [activity] });
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group) => ({
      ...group,
      activities: [...group.activities].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    }));
}

export function isActivityGroupExpandedByDefault(): boolean {
  return false;
}
