import type { SupabaseClient } from "@supabase/supabase-js";

import { fileTypeLabel } from "@/lib/project-files/queries";
import {
  assetPath,
  canvasPath,
  projectPath,
  reviewBoardPath,
  taskDeepLinkPath,
  textDocumentPath,
} from "@/lib/routes";
import type { HubProjectFileType } from "@/types/database";

export type SearchResultKind = "project" | "file" | "asset" | "task";

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

const PER_KIND_LIMIT = 6;

export async function searchHub(
  supabase: SupabaseClient,
  userId: string,
  rawQuery: string,
  limit = 16,
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

  const [
    { data: projects },
    { data: files },
    { data: initiatives },
    { data: tasks },
  ] = await Promise.all([
    supabase
      .from("hub_projects")
      .select("id, name")
      .in("id", projectIds)
      .is("trashed_at", null)
      .ilike("name", pattern)
      .order("name")
      .limit(PER_KIND_LIMIT),
    supabase
      .from("hub_project_files")
      .select("id, name, type, project_id, config, project:hub_projects(name)")
      .in("project_id", projectIds)
      .or(`name.ilike.${pattern},config->>plainTextPreview.ilike.${pattern}`)
      .order("name")
      .limit(PER_KIND_LIMIT),
    supabase
      .from("hub_initiatives")
      .select("id, project_id, name, project:hub_projects(name)")
      .in("project_id", projectIds),
    supabase
      .from("hub_tasks")
      .select("id, name, description, project_id, project:hub_projects(name)")
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .eq("completed", false)
      .order("updated_at", { ascending: false })
      .limit(PER_KIND_LIMIT),
  ]);

  const initiativeIds = (initiatives ?? []).map((row) => row.id);
  const initiativeProject = new Map(
    (initiatives ?? []).map((row) => [row.id, row.project_id as string]),
  );
  const initiativeName = new Map(
    (initiatives ?? []).map((row) => {
      const rawProject = row.project as { name: string } | { name: string }[] | null;
      const projectName = Array.isArray(rawProject) ? rawProject[0]?.name : rawProject?.name;
      return [row.id, projectName ?? ""];
    }),
  );

  let assets: Array<{
    id: string;
    name: string;
    tag: string;
    initiative_id: string;
  }> = [];

  if (initiativeIds.length > 0) {
    const { data: assetRows } = await supabase
      .from("hub_assets")
      .select("id, name, tag, initiative_id")
      .in("initiative_id", initiativeIds)
      .is("variant_of", null)
      .or(`name.ilike.${pattern},tag.ilike.${pattern}`)
      .order("name")
      .limit(PER_KIND_LIMIT);

    assets = assetRows ?? [];
  }

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

    const config = file.config as { plainTextPreview?: string } | null;
    const matchedBody =
      config?.plainTextPreview &&
      config.plainTextPreview.toLowerCase().includes(query.toLowerCase());

    results.push({
      id: `file:${file.id}`,
      kind: "file",
      name: file.name,
      subtitle: matchedBody
        ? `${projectName ?? "Project"} · Document match`
        : projectName
          ? `${projectName} · ${fileTypeLabel(file.type)}`
          : fileTypeLabel(file.type),
      href,
      fileType: file.type as HubProjectFileType,
    });
  }

  for (const asset of assets) {
    const projectId = initiativeProject.get(asset.initiative_id);
    if (!projectId) continue;
    const projectName = initiativeName.get(asset.initiative_id) ?? "Project";

    results.push({
      id: `asset:${asset.id}`,
      kind: "asset",
      name: asset.name,
      subtitle: `${projectName} · ${asset.tag || "Asset"}`,
      href: assetPath(projectId, asset.initiative_id, asset.id),
    });
  }

  for (const task of tasks ?? []) {
    const rawProject = task.project as
      | { name: string }
      | { name: string }[]
      | null;
    const projectName = Array.isArray(rawProject)
      ? rawProject[0]?.name
      : rawProject?.name;

    const projectId = task.project_id as string | null;

    results.push({
      id: `task:${task.id}`,
      kind: "task",
      name: task.name,
      subtitle: projectName
        ? `${projectName} · Task`
        : projectId
          ? "Project task"
          : "Personal task",
      href: taskDeepLinkPath(task.id, projectId),
    });
  }

  return results
    .sort((a, b) => {
      const kindOrder: Record<SearchResultKind, number> = {
        project: 0,
        file: 1,
        asset: 2,
        task: 3,
      };
      const order = kindOrder[a.kind] - kindOrder[b.kind];
      if (order !== 0) return order;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}
