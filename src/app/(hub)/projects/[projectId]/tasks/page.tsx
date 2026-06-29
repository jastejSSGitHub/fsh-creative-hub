import { notFound, redirect } from "next/navigation";

import { TasksWorkspaceClient } from "@/components/tasks/tasks-workspace-client";
import { ensureProjectSectionsAction } from "@/lib/tasks/actions";
import { isMockCollaborationEnabledServer } from "@/lib/dev-tools/mock-collaboration-cookie";
import { loadProjectTasksViewData } from "@/lib/tasks/load-project-tasks-data";
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

  const [role, { data: project }, mockEnabled] = await Promise.all([
    getProjectMembership(supabase, projectId, user.id),
    supabase.from("hub_projects").select("*").eq("id", projectId).maybeSingle(),
    isMockCollaborationEnabledServer(),
  ]);

  if (!role || !project) notFound();

  if (!mockEnabled) {
    await ensureProjectSectionsAction(projectId);
  }

  const { data: profile } = await supabase
    .from("hub_profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { sections, tasks, labels, filters, projects, members } =
    await loadProjectTasksViewData(
      supabase,
      projectId,
      project.name,
      user.id,
      profile?.display_name ?? "Me",
    );

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
