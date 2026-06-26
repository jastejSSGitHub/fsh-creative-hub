import type { SupabaseClient } from "@supabase/supabase-js";

import type { HubRole } from "@/types/database";

export type ProjectMemberPreview = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: HubRole;
};

export type ProjectCardData = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  trashed_at: string | null;
  role: HubRole;
  isFavorite: boolean;
  favoritedAt: string | null;
  assetCount: number;
  lastActivityAt: string | null;
  lastActivitySummary: string | null;
  members: ProjectMemberPreview[];
};

export async function getProjectsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProjectCardData[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("hub_project_members")
    .select(
      `
      role,
      is_favorite,
      favorited_at,
      project:hub_projects (
        id,
        name,
        description,
        cover_url,
        created_at,
        updated_at,
        trashed_at
      )
    `,
    )
    .eq("user_id", userId);

  if (membershipError) {
    throw membershipError;
  }

  const projects = (memberships ?? [])
    .map((row) => {
      const rawProject = row.project as
        | {
            id: string;
            name: string;
            description: string | null;
            cover_url: string | null;
            created_at: string;
            updated_at: string;
            trashed_at: string | null;
          }
        | {
            id: string;
            name: string;
            description: string | null;
            cover_url: string | null;
            created_at: string;
            updated_at: string;
            trashed_at: string | null;
          }[]
        | null;

      const project = Array.isArray(rawProject) ? rawProject[0] : rawProject;

      if (!project) return null;

      return {
        project,
        role: row.role as HubRole,
        isFavorite: Boolean(row.is_favorite),
        favoritedAt: (row.favorited_at as string | null) ?? null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  if (projects.length === 0) {
    return [];
  }

  const projectIds = projects.map((p) => p.project.id);

  const [{ data: allMembers }, { data: initiatives }, { data: activities }] =
    await Promise.all([
      supabase
        .from("hub_project_members")
        .select(
          `
          project_id,
          role,
          profile:hub_profiles (
            id,
            display_name,
            avatar_url
          )
        `,
        )
        .in("project_id", projectIds),
      supabase
        .from("hub_initiatives")
        .select("id, project_id")
        .in("project_id", projectIds),
      supabase
        .from("hub_activity")
        .select("project_id, created_at, summary")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false }),
    ]);

  const initiativeIds = (initiatives ?? []).map((i) => i.id);
  const initiativeToProject = new Map(
    (initiatives ?? []).map((i) => [i.id, i.project_id]),
  );

  let assetCountByProject = new Map<string, number>();
  if (initiativeIds.length > 0) {
    const { data: assets } = await supabase
      .from("hub_assets")
      .select("initiative_id")
      .in("initiative_id", initiativeIds);

    assetCountByProject = (assets ?? []).reduce((map, asset) => {
      const projectId = initiativeToProject.get(asset.initiative_id);
      if (!projectId) return map;
      map.set(projectId, (map.get(projectId) ?? 0) + 1);
      return map;
    }, new Map<string, number>());
  }

  const membersByProject = new Map<string, ProjectMemberPreview[]>();
  for (const row of allMembers ?? []) {
    const rawProfile = row.profile as
      | {
          id: string;
          display_name: string;
          avatar_url: string | null;
        }
      | {
          id: string;
          display_name: string;
          avatar_url: string | null;
        }[]
      | null;

    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    if (!profile) continue;

    const list = membersByProject.get(row.project_id) ?? [];
    list.push({
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      role: row.role as HubRole,
    });
    membersByProject.set(row.project_id, list);
  }

  const lastActivityByProject = new Map<
    string,
    { created_at: string; summary: string }
  >();
  for (const activity of activities ?? []) {
    if (!lastActivityByProject.has(activity.project_id)) {
      lastActivityByProject.set(activity.project_id, {
        created_at: activity.created_at,
        summary: activity.summary,
      });
    }
  }

  return projects
    .map(({ project, role, isFavorite, favoritedAt }) => {
      const members = (membersByProject.get(project.id) ?? []).sort((a, b) =>
        a.display_name.localeCompare(b.display_name),
      );
      const lastActivity = lastActivityByProject.get(project.id);

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        cover_url: project.cover_url,
        created_at: project.created_at,
        updated_at: project.updated_at ?? project.created_at,
        trashed_at: project.trashed_at ?? null,
        role,
        isFavorite,
        favoritedAt,
        assetCount: assetCountByProject.get(project.id) ?? 0,
        lastActivityAt: lastActivity?.created_at ?? null,
        lastActivitySummary: lastActivity?.summary ?? null,
        members,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastActivityAt ?? b.updated_at ?? b.created_at).getTime() -
        new Date(a.lastActivityAt ?? a.updated_at ?? a.created_at).getTime(),
    );
}

export async function getProjectMembership(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<HubRole | null> {
  const { data } = await supabase
    .from("hub_project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.role as HubRole | undefined) ?? null;
}
