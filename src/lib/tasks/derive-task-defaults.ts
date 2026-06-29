import type { TasksViewKind } from "@/lib/tasks/types";
import type { HubLabel } from "@/types/database";

export type TaskCreateDefaults = {
  dueAt?: string | null;
  assigneeId?: string | null;
  labelIds?: string[];
  projectId?: string | null;
};

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function labelIdsFromQuery(query: string, labels: HubLabel[]): string[] {
  const matches = query.match(/@([a-z0-9_-]+)/gi) ?? [];
  const ids = matches
    .map((token) => token.slice(1).replace(/\*$/, ""))
    .map((name) => labels.find((l) => l.name.toLowerCase() === name.toLowerCase())?.id)
    .filter((id): id is string => id != null);

  return [...new Set(ids)];
}

/** Defaults so a task created in the current view matches that view's filters. */
export function deriveTaskCreateDefaults(options: {
  viewKind: TasksViewKind;
  filterQuery?: string;
  labelSlug?: string;
  userId: string;
  labels: HubLabel[];
  now?: Date;
}): TaskCreateDefaults {
  const now = options.now ?? new Date();
  const defaults: TaskCreateDefaults = {};

  if (options.viewKind === "today") {
    defaults.dueAt = endOfDay(now).toISOString();
  }

  if (options.viewKind === "upcoming") {
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    defaults.dueAt = endOfDay(nextDay).toISOString();
  }

  if (options.viewKind === "inbox") {
    defaults.projectId = null;
  }

  if (options.viewKind === "label" && options.labelSlug) {
    const label = options.labels.find(
      (l) => l.name.toLowerCase() === options.labelSlug!.toLowerCase(),
    );
    if (label) defaults.labelIds = [label.id];
  }

  if (options.viewKind === "filter" && options.filterQuery) {
    const query = options.filterQuery.toLowerCase();

    if (query.includes("today")) {
      defaults.dueAt = endOfDay(now).toISOString();
    } else if (query.includes("overdue")) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      defaults.dueAt = endOfDay(yesterday).toISOString();
    } else if (query.includes("7 days")) {
      const inWeek = new Date(now);
      inWeek.setDate(inWeek.getDate() + 7);
      defaults.dueAt = endOfDay(inWeek).toISOString();
    }

    if (query.includes("assigned to: me")) {
      defaults.assigneeId = options.userId;
    }

    const labelIds = labelIdsFromQuery(options.filterQuery, options.labels);
    if (labelIds.length) defaults.labelIds = labelIds;
  }

  return defaults;
}
