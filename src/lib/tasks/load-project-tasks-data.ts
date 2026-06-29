import type { SupabaseClient } from "@supabase/supabase-js";

import { isMockCollaborationEnabledServer } from "@/lib/dev-tools/mock-collaboration-cookie";
import {
  getMockMembers,
  getMockProjectBoardData,
  getMockProjects,
} from "@/lib/dev-tools/mock-collaboration-data";
import {
  ensureDefaultSections,
  getFilters,
  getLabels,
  getProjectMembersForTasks,
  getProjectTasksGrouped,
  getTasksRaw,
  getUserProjectsForTasks,
} from "@/lib/tasks/queries";
import type { SectionWithTasks, TaskWithMeta } from "@/lib/tasks/types";
import type { HubFilter, HubLabel, HubProfile } from "@/types/database";

export type ProjectTasksViewData = {
  sections: SectionWithTasks[];
  tasks: TaskWithMeta[];
  labels: HubLabel[];
  filters: HubFilter[];
  projects: { id: string; name: string }[];
  members: HubProfile[];
};

export async function loadProjectTasksViewData(
  supabase: SupabaseClient,
  projectId: string,
  projectName: string,
  userId: string,
  userDisplayName: string,
): Promise<ProjectTasksViewData> {
  const mockEnabled = await isMockCollaborationEnabledServer();

  const [labels, filters, projects, members] = await Promise.all([
    getLabels(supabase),
    getFilters(supabase),
    mockEnabled ? Promise.resolve(getMockProjects()) : getUserProjectsForTasks(supabase),
    mockEnabled
      ? Promise.resolve(getMockMembers() as HubProfile[])
      : getProjectMembersForTasks(supabase, projectId),
  ]);

  if (mockEnabled) {
    const { sections, tasks } = getMockProjectBoardData(
      projectId,
      projectName,
      userId,
      userDisplayName,
      labels,
    );
    return { sections, tasks, labels, filters, projects, members };
  }

  await ensureDefaultSections(supabase, projectId);

  const [sections, tasks] = await Promise.all([
    getProjectTasksGrouped(supabase, projectId),
    getTasksRaw(supabase, { projectId }),
  ]);

  return { sections, tasks, labels, filters, projects, members };
}
