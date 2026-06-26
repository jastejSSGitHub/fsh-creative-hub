import type { SupabaseClient } from "@supabase/supabase-js";

import type { HubProjectFile, HubProjectFileType } from "@/types/database";

export type ProjectFileWithMeta = HubProjectFile & {
  section_count: number;
  asset_count: number;
  approved_count: number;
  isFavorite: boolean;
  favoritedAt: string | null;
};

export async function getProjectFiles(
  supabase: SupabaseClient,
  projectId: string,
  userId?: string,
): Promise<ProjectFileWithMeta[]> {
  const { data: files, error } = await supabase
    .from("hub_project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!files?.length) return [];

  const fileIds = files.map((f) => f.id);

  const { data: initiatives } = await supabase
    .from("hub_initiatives")
    .select("id, review_board_id")
    .in("review_board_id", fileIds);

  const initiativeIds = (initiatives ?? []).map((i) => i.id);
  const initiativesByBoard = new Map<string, string[]>();

  for (const initiative of initiatives ?? []) {
    if (!initiative.review_board_id) continue;
    const list = initiativesByBoard.get(initiative.review_board_id) ?? [];
    list.push(initiative.id);
    initiativesByBoard.set(initiative.review_board_id, list);
  }

  let assets: { initiative_id: string; status: string }[] = [];
  if (initiativeIds.length) {
    const { data } = await supabase
      .from("hub_assets")
      .select("initiative_id, status")
      .in("initiative_id", initiativeIds)
      .is("variant_of", null);
    assets = data ?? [];
  }

  let favoriteByFileId = new Map<string, string>();
  if (userId && fileIds.length) {
    const { data: favorites } = await supabase
      .from("hub_project_file_favorites")
      .select("file_id, favorited_at")
      .eq("user_id", userId)
      .in("file_id", fileIds);

    favoriteByFileId = new Map(
      (favorites ?? []).map((favorite) => [
        favorite.file_id as string,
        favorite.favorited_at as string,
      ]),
    );
  }

  return (files as HubProjectFile[]).map((file) => {
    const sectionIds = initiativesByBoard.get(file.id) ?? [];
    const fileAssets = assets.filter((a) => sectionIds.includes(a.initiative_id));

    return {
      ...file,
      section_count: sectionIds.length,
      asset_count: fileAssets.length,
      approved_count: fileAssets.filter((a) => a.status === "approved" || a.status === "final").length,
      isFavorite: favoriteByFileId.has(file.id),
      favoritedAt: favoriteByFileId.get(file.id) ?? null,
    };
  });
}

export async function getProjectFile(
  supabase: SupabaseClient,
  projectId: string,
  fileId: string,
): Promise<HubProjectFile | null> {
  const { data, error } = await supabase
    .from("hub_project_files")
    .select("*")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  return data as HubProjectFile | null;
}

export function fileTypeLabel(type: HubProjectFileType): string {
  switch (type) {
    case "review_board":
      return "Review board";
    case "canvas":
      return "Canvas";
    case "text_document":
      return "Text document";
    default:
      return type;
  }
}
