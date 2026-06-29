import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveProjectCoverUrl } from "@/lib/projects/project-thumbnails";
import type { HubRole } from "@/types/database";

export type IntelligenceProjectOption = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  role: HubRole;
};

/** Lightweight project list for Ask AI picker — one query, no assets/activity/members. */
export async function getIntelligenceProjectOptions(
  supabase: SupabaseClient,
  userId: string,
): Promise<IntelligenceProjectOption[]> {
  const { data, error } = await supabase
    .from("hub_project_members")
    .select(
      `
      role,
      project:hub_projects (
        id,
        name,
        description,
        cover_url,
        trashed_at
      )
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;

  const options = (data ?? [])
    .map((row) => {
      const rawProject = row.project as
        | {
            id: string;
            name: string;
            description: string | null;
            cover_url: string | null;
            trashed_at: string | null;
          }
        | {
            id: string;
            name: string;
            description: string | null;
            cover_url: string | null;
            trashed_at: string | null;
          }[]
        | null;

      const project = Array.isArray(rawProject) ? rawProject[0] : rawProject;
      if (!project || project.trashed_at) return null;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        cover_url: resolveProjectCoverUrl(project.name, project.cover_url),
        role: row.role as HubRole,
      };
    })
    .filter((row): row is IntelligenceProjectOption => row != null);

  return options.sort((a, b) => a.name.localeCompare(b.name));
}

export function filterIntelligenceProjectOptions(
  projects: IntelligenceProjectOption[],
  query: string,
): IntelligenceProjectOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return projects;

  return projects.filter(
    (project) =>
      project.name.toLowerCase().includes(normalized) ||
      project.description?.toLowerCase().includes(normalized),
  );
}

export function paginateIntelligenceProjectOptions(
  projects: IntelligenceProjectOption[],
  page: number,
  pageSize: number,
): {
  items: IntelligenceProjectOption[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const total = projects.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: projects.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}
