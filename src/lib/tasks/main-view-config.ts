import {
  TASKS_INBOX_PATH,
  TASKS_PATH,
  TASKS_TODAY_PATH,
  TASKS_UPCOMING_PATH,
} from "@/lib/routes";
import type { TasksViewKind } from "@/lib/tasks/types";
import type { HubFilter, HubLabel } from "@/types/database";

export const MAIN_TASK_VIEW_PATHS = [
  TASKS_TODAY_PATH,
  TASKS_UPCOMING_PATH,
  TASKS_INBOX_PATH,
] as const;

export type MainTaskViewPath = (typeof MAIN_TASK_VIEW_PATHS)[number];

export type TaskViewConfig = {
  viewKind: TasksViewKind;
  title: string;
  filterQuery?: string;
  labelSlug?: string;
};

export function isMainTaskViewPath(pathname: string): pathname is MainTaskViewPath {
  return (MAIN_TASK_VIEW_PATHS as readonly string[]).includes(pathname);
}

export function mainTaskViewFromPath(pathname: string): {
  viewKind: TasksViewKind;
  title: string;
} | null {
  switch (pathname) {
    case TASKS_TODAY_PATH:
      return { viewKind: "today", title: "Today" };
    case TASKS_UPCOMING_PATH:
      return { viewKind: "upcoming", title: "Upcoming" };
    case TASKS_INBOX_PATH:
      return { viewKind: "inbox", title: "Inbox" };
    case TASKS_PATH:
      return { viewKind: "browse", title: "Browse" };
    default:
      return null;
  }
}

const FILTER_PATH = /^\/tasks\/filters\/([^/]+)$/;
const LABEL_PATH = /^\/tasks\/labels\/([^/]+)$/;

export function taskViewFromPath(
  pathname: string,
  filters: HubFilter[],
  labels: HubLabel[],
): TaskViewConfig | null {
  const main = mainTaskViewFromPath(pathname);
  if (main) return main;

  const filterMatch = pathname.match(FILTER_PATH);
  if (filterMatch) {
    const filter = filters.find((entry) => entry.id === filterMatch[1]);
    if (!filter) return null;
    return {
      viewKind: "filter",
      title: filter.name,
      filterQuery: filter.query,
    };
  }

  const labelMatch = pathname.match(LABEL_PATH);
  if (labelMatch) {
    const slug = decodeURIComponent(labelMatch[1]);
    const label = labels.find((entry) => entry.name.toLowerCase() === slug.toLowerCase());
    return {
      viewKind: "label",
      title: label ? `@${label.name}` : `@${slug}`,
      labelSlug: slug,
    };
  }

  return null;
}

export type ProjectTaskScope = {
  title: string;
  filterQuery?: string;
  labelSlug?: string;
  view?: "today" | "upcoming";
};

/** Resolve project tasks sidebar scope from `?filter=`, `?label=`, or `?view=` search params. */
export function projectTaskScopeFromSearch(
  searchParams: Pick<URLSearchParams, "get">,
  filters: HubFilter[],
  labels: HubLabel[],
): ProjectTaskScope {
  const view = searchParams.get("view");
  if (view === "today") return { view: "today", title: "Today" };
  if (view === "upcoming") return { view: "upcoming", title: "Upcoming" };

  const filterId = searchParams.get("filter");
  if (filterId) {
    const filter = filters.find((entry) => entry.id === filterId);
    if (filter) {
      return { filterQuery: filter.query, title: filter.name };
    }
  }

  const labelSlug = searchParams.get("label");
  if (labelSlug) {
    const label = labels.find(
      (entry) => entry.name.toLowerCase() === labelSlug.toLowerCase(),
    );
    return {
      labelSlug,
      title: label ? `@${label.name}` : `@${labelSlug}`,
    };
  }

  return { title: "Tasks" };
}
