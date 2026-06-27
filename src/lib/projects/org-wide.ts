/** Projects every authenticated hub user can see (org-wide / universal). */
export const ORG_WIDE_PROJECT_NAMES = ["Blenz", "Healthy Cart Canada"] as const;

export type OrgWideProjectName = (typeof ORG_WIDE_PROJECT_NAMES)[number];

export function isOrgWideProjectName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return ORG_WIDE_PROJECT_NAMES.some(
    (projectName) => projectName.toLowerCase() === normalized,
  );
}
