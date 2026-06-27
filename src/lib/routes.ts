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

export function projectPath(projectId: string): `/projects/${string}` {
  return `/projects/${projectId}`;
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
