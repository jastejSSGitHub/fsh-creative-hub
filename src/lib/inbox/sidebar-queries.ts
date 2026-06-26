import type { SupabaseClient } from "@supabase/supabase-js";

import { fileTypeLabel } from "@/lib/project-files/queries";
import { projectPath, reviewBoardPath } from "@/lib/routes";
import type { HubProjectFileType } from "@/types/database";

export type SharedProjectFile = {
  id: string;
  name: string;
  type: HubProjectFileType;
  href: string;
  canOpen: boolean;
};

export type SharedProjectNode = {
  id: string;
  name: string;
  href: string;
  files: SharedProjectFile[];
};

export async function getSharedWithMeTree(
  supabase: SupabaseClient,
  userId: string,
): Promise<SharedProjectNode[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("hub_project_members")
    .select(
      `
      project:hub_projects (
        id,
        name,
        trashed_at
      )
    `,
    )
    .eq("user_id", userId);

  if (membershipError) throw membershipError;

  const projects = (memberships ?? [])
    .map((row) => {
      const raw = row.project as
        | { id: string; name: string; trashed_at: string | null }
        | { id: string; name: string; trashed_at: string | null }[]
        | null;
      const project = Array.isArray(raw) ? raw[0] : raw;
      if (!project || project.trashed_at) return null;
      return project;
    })
    .filter((p): p is NonNullable<typeof p> => p != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  const { data: files, error: filesError } = await supabase
    .from("hub_project_files")
    .select("id, name, type, project_id, sort_order, created_at")
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (filesError) throw filesError;

  const filesByProject = new Map<string, SharedProjectFile[]>();

  for (const file of files ?? []) {
    const canOpen = file.type === "review_board";
    const href = canOpen
      ? reviewBoardPath(file.project_id, file.id)
      : projectPath(file.project_id);

    const list = filesByProject.get(file.project_id) ?? [];
    list.push({
      id: file.id,
      name: file.name,
      type: file.type as HubProjectFileType,
      href,
      canOpen,
    });
    filesByProject.set(file.project_id, list);
  }

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    href: projectPath(project.id),
    files: filesByProject.get(project.id) ?? [],
  }));
}

export function fileTypeShortLabel(type: HubProjectFileType): string {
  return fileTypeLabel(type);
}
