import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ProjectsPageClient } from "@/components/projects/projects-page-client";
import { ProjectsPageSkeleton } from "@/components/projects/projects-page-skeleton";
import { LOGIN_PATH } from "@/lib/routes";
import { getProjectsForUser } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";

async function ProjectsPageContent() {
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsPageSkeleton />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
