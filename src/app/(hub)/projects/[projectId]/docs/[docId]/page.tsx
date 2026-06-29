import { notFound, redirect } from "next/navigation";

import { TextDocumentWorkspace } from "@/components/documents/text-document-workspace";
import { getProjectFiles, getProjectFile } from "@/lib/project-files/queries";
import { LOGIN_PATH } from "@/lib/routes";
import { getProjectMembership } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";

type TextDocumentPageProps = {
  params: Promise<{ projectId: string; docId: string }>;
};

export default async function TextDocumentPage({ params }: TextDocumentPageProps) {
  const { projectId, docId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const [role, { data: project }, document, files] = await Promise.all([
    getProjectMembership(supabase, projectId, user.id),
    supabase.from("hub_projects").select("*").eq("id", projectId).maybeSingle(),
    getProjectFile(supabase, projectId, docId),
    getProjectFiles(supabase, projectId, user.id),
  ]);

  if (!role || !project || !document || document.type !== "text_document") {
    notFound();
  }

  return (
    <TextDocumentWorkspace
      project={project}
      document={document}
      role={role}
      siblingDocs={files}
    />
  );
}
