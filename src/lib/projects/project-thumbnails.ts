/** Local /public thumbnails for project cards (keyed by lowercase project name). */
const PROJECT_THUMBNAILS: Record<string, string> = {
  blenz: "/media/projects_thumbnails/blenz_thumbnail.png",
};

export function resolveProjectCoverUrl(
  projectName: string,
  coverUrl: string | null,
): string | null {
  const mapped = PROJECT_THUMBNAILS[projectName.trim().toLowerCase()];
  if (mapped) return mapped;
  return coverUrl;
}
