import { redirect } from "next/navigation";

import { ProjectsPageClient } from "@/components/projects/projects-page-client";
import { LOGIN_PATH } from "@/lib/routes";
import { getProjectsForUser } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  const projects = await getProjectsForUser(supabase, user.id);

  return (
    <ProjectsPageClient projects={projects} currentUserId={user.id} />
  );
}
