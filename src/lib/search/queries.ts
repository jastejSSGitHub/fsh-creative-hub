import type { SupabaseClient } from "@supabase/supabase-js";

import { fileTypeLabel } from "@/lib/project-files/queries";
import { canvasPath, projectPath, reviewBoardPath, textDocumentPath } from "@/lib/routes";
import type { HubProjectFileType } from "@/types/database";

export type SearchResultKind = "project" | "file";

export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  name: string;
  subtitle: string;
  href: string;
  fileType?: HubProjectFileType;
};

function escapeIlikePattern(query: string): string {
  return query.replace(/[%_\\]/g, "\\$&");
}

export async function searchHub(
  supabase: SupabaseClient,
  userId: string,
  rawQuery: string,
  limit = 12,
): Promise<SearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 1) return [];

  const pattern = `%${escapeIlikePattern(query)}%`;

  const { data: memberships, error: membershipError } = await supabase
    .from("hub_project_members")
    .select("project_id")
    .eq("user_id", userId);

  if (membershipError) throw membershipError;

  const projectIds = (memberships ?? []).map((row) => row.project_id);
  if (projectIds.length === 0) return [];

  const [{ data: projects }, { data: files }] = await Promise.all([
    supabase
      .from("hub_projects")
      .select("id, name")
      .in("id", projectIds)
      .is("trashed_at", null)
      .ilike("name", pattern)
      .order("name")
      .limit(limit),
    supabase
      .from("hub_project_files")
      .select("id, name, type, project_id, project:hub_projects(name)")
      .in("project_id", projectIds)
      .ilike("name", pattern)
      .order("name")
      .limit(limit),
  ]);

  const results: SearchResult[] = [];

  for (const project of projects ?? []) {
    results.push({
      id: `project:${project.id}`,
      kind: "project",
      name: project.name,
      subtitle: "Project",
      href: projectPath(project.id),
    });
  }

  for (const file of files ?? []) {
    const rawProject = file.project as
      | { name: string }
      | { name: string }[]
      | null;
    const projectName = Array.isArray(rawProject)
      ? rawProject[0]?.name
      : rawProject?.name;

    const href =
      file.type === "review_board"
        ? reviewBoardPath(file.project_id, file.id)
        : file.type === "canvas"
          ? canvasPath(file.project_id, file.id)
          : file.type === "text_document"
            ? textDocumentPath(file.project_id, file.id)
            : projectPath(file.project_id);

    results.push({
      id: `file:${file.id}`,
      kind: "file",
      name: file.name,
      subtitle: projectName
        ? `${projectName} · ${fileTypeLabel(file.type)}`
        : fileTypeLabel(file.type),
      href,
      fileType: file.type as HubProjectFileType,
    });
  }

  return results
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}
