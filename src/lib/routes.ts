export const LANDING_PATH = "/" as const;
export const LANDING_ALIAS_PATH = "/landing" as const;

/** Routes that always render in light mode (marketing / public landing). */
export const LANDING_PATHS = [LANDING_PATH, LANDING_ALIAS_PATH] as const;

export function isLandingPath(pathname: string): boolean {
  return (LANDING_PATHS as readonly string[]).includes(pathname);
}
export const LOGIN_PATH = "/login" as const;
export const PROJECTS_PATH = "/projects" as const;
export const FOR_YOU_PATH = "/for-you" as const;
export const TASKS_PATH = "/tasks" as const;
export const TASKS_TODAY_PATH = "/tasks/today" as const;
export const TASKS_UPCOMING_PATH = "/tasks/upcoming" as const;
export const TASKS_INBOX_PATH = "/tasks/inbox" as const;
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

export function projectTasksPath(
  projectId: string,
): `/projects/${string}/tasks` {
  return `/projects/${projectId}/tasks`;
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
