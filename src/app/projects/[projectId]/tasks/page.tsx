import { notFound, redirect } from "next/navigation";

import { TasksWorkspaceClient } from "@/components/tasks/tasks-workspace-client";
import { ensureProjectSectionsAction } from "@/lib/tasks/actions";
import {
  ensureDefaultSections,
  getFilters,
  getLabels,
  getProjectMembersForTasks,
  getProjectTasksGrouped,
  getTasksRaw,
  getUserProjectsForTasks,
} from "@/lib/tasks/queries";
import { getProjectMembership } from "@/lib/projects/queries";
import { LOGIN_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

type ProjectTasksPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectTasksPage({ params }: ProjectTasksPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const [role, { data: project }] = await Promise.all([
    getProjectMembership(supabase, projectId, user.id),
    supabase.from("hub_projects").select("*").eq("id", projectId).maybeSingle(),
  ]);

  if (!role || !project) notFound();

  await ensureProjectSectionsAction(projectId);
  await ensureDefaultSections(supabase, projectId);

  const { data: profile } = await supabase
    .from("hub_profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const [sections, tasks, labels, filters, projects, members] = await Promise.all([
    getProjectTasksGrouped(supabase, projectId),
    getTasksRaw(supabase, { projectId }),
    getLabels(supabase),
    getFilters(supabase),
    getUserProjectsForTasks(supabase),
    getProjectMembersForTasks(supabase, projectId),
  ]);

  return (
    <TasksWorkspaceClient
      viewKind="project"
      title="Tasks"
      userId={user.id}
      userDisplayName={profile?.display_name ?? "Me"}
      userAvatarUrl={profile?.avatar_url ?? null}
      initialTasks={tasks}
      initialSections={sections}
      labels={labels}
      filters={filters}
      projects={projects}
      members={members}
      project={project}
      role={role}
    />
  );
}
