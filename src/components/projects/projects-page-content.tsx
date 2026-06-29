import { ProjectsPageClient } from "@/components/projects/projects-page-client";
import { getHubSupabase, requireHubSession } from "@/lib/hub/session";
import { getProjectsForUser } from "@/lib/projects/queries";

export async function ProjectsPageContent() {
  const session = await requireHubSession();
  const supabase = await getHubSupabase();
  const projects = await getProjectsForUser(supabase, session.userId);

  return (
    <ProjectsPageClient
      projects={projects}
      currentUserId={session.userId}
    />
  );
}
