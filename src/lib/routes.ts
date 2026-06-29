export const LANDING_PATH = "/" as const;
export const LANDING_ALIAS_PATH = "/landing" as const;
export const DOCS_PATH = "/docs" as const;

/** Routes that always render in light mode (marketing / public landing). */
export const LANDING_PATHS = [LANDING_PATH, LANDING_ALIAS_PATH] as const;

export const DOCS_PATH_PREFIX = "/docs" as const;

export function isDocsPath(pathname: string): boolean {
  return pathname === DOCS_PATH_PREFIX || pathname.startsWith(`${DOCS_PATH_PREFIX}/`);
}

export function isLandingPath(pathname: string): boolean {
  return (LANDING_PATHS as readonly string[]).includes(pathname);
}

/** Marketing and public docs routes always render in light mode. */
export function isMarketingLightPath(pathname: string): boolean {
  return isLandingPath(pathname) || isDocsPath(pathname);
}
export const LOGIN_PATH = "/login" as const;
export const PROJECTS_PATH = "/projects" as const;

/** Project grid hub tab — `/projects` only, not project detail routes. */
export function isProjectsGridPath(pathname: string): boolean {
  return pathname === PROJECTS_PATH;
}
export const FOR_YOU_PATH = "/for-you" as const;
export const TASKS_PATH = "/tasks" as const;
export const TASKS_TODAY_PATH = "/tasks/today" as const;
export const TASKS_UPCOMING_PATH = "/tasks/upcoming" as const;
export const TASKS_INBOX_PATH = "/tasks/inbox" as const;

const TASKS_PRIMARY_VIEW_PATHS = [
  TASKS_TODAY_PATH,
  TASKS_UPCOMING_PATH,
  TASKS_INBOX_PATH,
] as const;

/** Mobile “Browse” tab — filters, labels, and other non-primary task views. */
export function isTasksBrowsePath(pathname: string): boolean {
  if (pathname === TASKS_PATH) return true;
  if (!pathname.startsWith(`${TASKS_PATH}/`)) return false;
  return !(TASKS_PRIMARY_VIEW_PATHS as readonly string[]).includes(pathname);
}
export const SHARE_PATH_PREFIX = "/share" as const;

export function sharePath(token: string): `/share/${string}` {
  return `/share/${token}`;
}

export function isSharePath(pathname: string): boolean {
  return pathname === SHARE_PATH_PREFIX || pathname.startsWith(`${SHARE_PATH_PREFIX}/`);
}

export function projectPath(projectId: string): `/projects/${string}` {
  return `/projects/${projectId}`;
}

export function projectBriefPath(
  projectId: string,
): `/projects/${string}/brief` {
  return `/projects/${projectId}/brief`;
}

export function projectTasksPath(
  projectId: string,
): `/projects/${string}/tasks` {
  return `/projects/${projectId}/tasks`;
}

export type ProjectTasksSubview = "today" | "upcoming";

export type ProjectTasksScopeParams = {
  filter?: string;
  label?: string;
  view?: ProjectTasksSubview;
  task?: string;
};

/** Project tasks URL with optional in-project filter, label, or view scope. */
export function projectTasksScopedPath(
  projectId: string,
  params?: ProjectTasksScopeParams,
): string {
  const base = projectTasksPath(projectId);
  if (!params) return base;

  const query = new URLSearchParams();
  if (params.filter) query.set("filter", params.filter);
  if (params.label) query.set("label", params.label);
  if (params.view) query.set("view", params.view);
  if (params.task) query.set("task", params.task);

  const serialized = query.toString();
  return serialized ? `${base}?${serialized}` : base;
}

export function projectTasksFilterPath(
  projectId: string,
  filterId: string,
): string {
  return projectTasksScopedPath(projectId, { filter: filterId });
}

export function projectTasksLabelPath(projectId: string, slug: string): string {
  return projectTasksScopedPath(projectId, { label: slug });
}

export function projectTasksViewPath(
  projectId: string,
  view: ProjectTasksSubview,
): string {
  return projectTasksScopedPath(projectId, { view });
}

export function isProjectTasksPath(pathname: string): boolean {
  return /^\/projects\/[^/]+\/tasks$/.test(pathname);
}

/** Global tasks workspace or project-scoped tasks board. */
export function isTasksHubPath(pathname: string): boolean {
  if (pathname === TASKS_PATH || pathname.startsWith(`${TASKS_PATH}/`)) {
    return true;
  }
  return isProjectTasksPath(pathname);
}

export type HubRootTab = "projects" | "for-you" | "tasks";

export function pathnameFromHubHref(href: string): string {
  return href.split("?")[0]?.split("#")[0] ?? href;
}

export function hubRootTabFromPathname(pathname: string): HubRootTab {
  if (pathname.startsWith(FOR_YOU_PATH)) return "for-you";
  if (isTasksHubPath(pathname)) return "tasks";
  return "projects";
}

export function hubRootTabFromHref(href: string): HubRootTab {
  return hubRootTabFromPathname(pathnameFromHubHref(href));
}

export function tasksLabelPath(slug: string): `/tasks/labels/${string}` {
  return `/tasks/labels/${slug}`;
}

export function tasksFilterPath(filterId: string): `/tasks/filters/${string}` {
  return `/tasks/filters/${filterId}`;
}

export function reviewBoardPath(
  projectId: string,
  boardId: string,
): `/projects/${string}/boards/${string}` {
  return `/projects/${projectId}/boards/${boardId}`;
}

export function canvasPath(
  projectId: string,
  canvasId: string,
): `/projects/${string}/canvas/${string}` {
  return `/projects/${projectId}/canvas/${canvasId}`;
}

export function textDocumentPath(
  projectId: string,
  docId: string,
): `/projects/${string}/docs/${string}` {
  return `/projects/${projectId}/docs/${docId}`;
}

export function assetPath(
  projectId: string,
  initiativeId: string,
  assetId: string,
): `/projects/${string}/i/${string}/a/${string}` {
  return `/projects/${projectId}/i/${initiativeId}/a/${assetId}`;
}

const HUB_DETAIL_PATH_RE = /^\/projects\/[^/]+\/(boards|canvas|docs)\/[^/]+/;
const CANVAS_PATH_RE = /^\/projects\/[^/]+\/canvas\/[^/]+/;

/** Review boards, canvases, and other project file detail views. */
export function isHubDetailPath(pathname: string): boolean {
  return HUB_DETAIL_PATH_RE.test(pathname);
}

/** Open canvas editor — full-bleed, no hub chrome. */
export function isCanvasPath(pathname: string): boolean {
  return CANVAS_PATH_RE.test(pathname);
}

/** Routes that manage their own internal scroll instead of the hub shell scroller. */
export function usesHubFillScrollLayout(pathname: string): boolean {
  return isCanvasPath(pathname) || pathname.startsWith(FOR_YOU_PATH);
}

export type ForYouLens =
  | "needs-you"
  | "waiting-on-others"
  | "following"
  | "your-uploads"
  | "replies"
  | "assigned";

export function taskDeepLinkPath(
  taskId: string,
  projectId?: string | null,
): string {
  const query = `task=${encodeURIComponent(taskId)}`;
  if (projectId) {
    return `${projectTasksPath(projectId)}?${query}`;
  }
  return `${TASKS_TODAY_PATH}?${query}`;
}

export function forYouLensPath(lens: ForYouLens): string {
  if (lens === "needs-you") return FOR_YOU_PATH;
  return `${FOR_YOU_PATH}?lens=${encodeURIComponent(lens)}`;
}

/** Extract default project id from hub pathname for quick-add context. */
export function projectIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match?.[1] ?? null;
}
