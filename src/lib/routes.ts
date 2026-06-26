export const LANDING_PATH = "/" as const;
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

export function assetPath(
  projectId: string,
  initiativeId: string,
  assetId: string,
): `/projects/${string}/i/${string}/a/${string}` {
  return `/projects/${projectId}/i/${initiativeId}/a/${assetId}`;
}
