import { notFound, redirect } from "next/navigation";

import { ProjectBriefClient } from "@/components/intelligence/project-brief-client";
import { LOGIN_PATH } from "@/lib/routes";
import { getProjectDetailContext } from "@/lib/projects/queries";
import { getHubUser } from "@/lib/hub/session";

type ProjectBriefPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectBriefPage({ params }: ProjectBriefPageProps) {
  const { projectId } = await params;
  const { supabase, user } = await getHubUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  const context = await getProjectDetailContext(supabase, projectId, user.id);
  if (!context) {
    notFound();
  }

  return (
    <ProjectBriefClient
      projectId={projectId}
      projectName={context.card.name}
    />
  );
}
