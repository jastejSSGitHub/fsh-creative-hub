import {
  getAllAccessibleTasks,
  getFilters,
  getLabels,
  getUserProjectsForTasks,
} from "@/lib/tasks/queries";
import { isMockCollaborationEnabledServer } from "@/lib/dev-tools/mock-collaboration-cookie";
import {
  getMockProjects,
  getMockTasks,
  getMockMembers,
} from "@/lib/dev-tools/mock-collaboration-data";
import { requireHubSession, getHubSupabase } from "@/lib/hub/session";
import type { TaskWithMeta } from "@/lib/tasks/types";
import type { HubFilter, HubLabel, HubProfile } from "@/types/database";

export type MainTasksViewData = {
  userId: string;
  userDisplayName: string;
  tasks: TaskWithMeta[];
  labels: HubLabel[];
  filters: HubFilter[];
  projects: { id: string; name: string }[];
  members: Pick<HubProfile, "id" | "display_name" | "avatar_url">[];
};

export async function loadMainTasksViewData(): Promise<MainTasksViewData> {
  const session = await requireHubSession();
  const displayName = session.displayName;
  const mockEnabled = await isMockCollaborationEnabledServer();
  const supabase = await getHubSupabase();

  const [tasks, labels, filters, projects] = await Promise.all([
    mockEnabled ? Promise.resolve([]) : getAllAccessibleTasks(supabase, session.userId),
    getLabels(supabase),
    getFilters(supabase),
    getUserProjectsForTasks(supabase),
  ]);

  if (mockEnabled) {
    return {
      userId: session.userId,
      userDisplayName: displayName,
      tasks: getMockTasks(session.userId, displayName, labels),
      labels,
      filters,
      projects: getMockProjects(),
      members: getMockMembers(),
    };
  }

  return {
    userId: session.userId,
    userDisplayName: displayName,
    tasks,
    labels,
    filters,
    projects,
    members: [],
  };
}
