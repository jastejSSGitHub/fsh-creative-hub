import { notFound, redirect } from "next/navigation";

import { ProjectHomeClient } from "@/components/project-files/project-home-client";
import { getProjectFiles } from "@/lib/project-files/queries";
import { getProjectMembership } from "@/lib/projects/queries";
import { LOGIN_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const [role, { data: project }, files] = await Promise.all([
    getProjectMembership(supabase, projectId, user.id),
    supabase.from("hub_projects").select("*").eq("id", projectId).maybeSingle(),
    getProjectFiles(supabase, projectId),
  ]);

  if (!role || !project) notFound();

  return (
    <ProjectHomeClient project={project} role={role} files={files} />
  );
}
