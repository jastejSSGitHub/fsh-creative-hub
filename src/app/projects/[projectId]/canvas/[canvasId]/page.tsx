import { notFound, redirect } from "next/navigation";

import { OpenCanvasWorkspace } from "@/components/canvas/open-canvas-workspace";
import { getProjectFile } from "@/lib/project-files/queries";
import { LOGIN_PATH } from "@/lib/routes";
import { getProjectDetailContext, getProjectMembership } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";

type CanvasPageProps = {
  params: Promise<{ projectId: string; canvasId: string }>;
};

export default async function CanvasPage({ params }: CanvasPageProps) {
  const { projectId, canvasId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const [role, { data: project }, canvas, projectContext] = await Promise.all([
    getProjectMembership(supabase, projectId, user.id),
    supabase.from("hub_projects").select("*").eq("id", projectId).maybeSingle(),
    getProjectFile(supabase, projectId, canvasId),
    getProjectDetailContext(supabase, projectId, user.id),
  ]);

  if (!role || !project || !canvas || canvas.type !== "canvas" || !projectContext) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("hub_profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const authorName =
    profile?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "You";

  return (
    <OpenCanvasWorkspace
      project={project}
      canvas={canvas}
      authorName={authorName}
      projectCard={projectContext.card}
      currentUserId={user.id}
    />
  );
}
