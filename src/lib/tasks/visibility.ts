import type { HubProject } from "@/types/database";

export type TaskVisibility = "personal" | "project" | "team";

export function deriveTaskVisibility(
  projectId: string | null,
  project?: Pick<HubProject, "is_org_wide"> | null,
): TaskVisibility {
  if (!projectId) return "personal";
  if (project?.is_org_wide) return "team";
  return "project";
}

export const VISIBILITY_LABELS: Record<TaskVisibility, string> = {
  personal: "Personal",
  project: "Project",
  team: "Team",
};
