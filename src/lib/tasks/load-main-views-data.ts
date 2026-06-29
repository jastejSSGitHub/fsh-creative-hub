import { redirect } from "next/navigation";

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
import { LOGIN_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const { data: profile } = await supabase
    .from("hub_profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? "Me";

  const mockEnabled = await isMockCollaborationEnabledServer();

  const [tasks, labels, filters, projects] = await Promise.all([
    mockEnabled ? Promise.resolve([]) : getAllAccessibleTasks(supabase, user.id),
    getLabels(supabase),
    getFilters(supabase),
    getUserProjectsForTasks(supabase),
  ]);

  if (mockEnabled) {
    return {
      userId: user.id,
      userDisplayName: displayName,
      tasks: getMockTasks(user.id, displayName, labels),
      labels,
      filters,
      projects: getMockProjects(),
      members: getMockMembers(),
    };
  }

  return {
    userId: user.id,
    userDisplayName: displayName,
    tasks,
    labels,
    filters,
    projects,
    members: [],
  };
}
