import type { SupabaseClient } from "@supabase/supabase-js";

import type { HubComment, HubProfile } from "@/types/database";

export type ForYouItemKind = "mention" | "upload_thread";

export type ForYouItem = {
  id: string;
  kind: ForYouItemKind;
  comment: HubComment & {
    author: Pick<HubProfile, "id" | "display_name" | "avatar_url">;
  };
  asset: {
    id: string;
    name: string;
    initiative_id: string;
  };
  initiative: {
    id: string;
    name: string;
    project_id: string;
  };
  project: {
    id: string;
    name: string;
  };
};

type CommentRow = HubComment & {
  author:
    | Pick<HubProfile, "id" | "display_name" | "avatar_url">
    | Pick<HubProfile, "id" | "display_name" | "avatar_url">[]
    | null;
  asset:
    | {
        id: string;
        name: string;
        initiative_id: string;
        uploaded_by: string;
        initiative:
          | {
              id: string;
              name: string;
              project_id: string;
              project: { id: string; name: string } | { id: string; name: string }[];
            }
          | {
              id: string;
              name: string;
              project_id: string;
              project: { id: string; name: string } | { id: string; name: string }[];
            }[]
          | null;
      }
    | {
        id: string;
        name: string;
        initiative_id: string;
        uploaded_by: string;
        initiative:
          | {
              id: string;
              name: string;
              project_id: string;
              project: { id: string; name: string } | { id: string; name: string }[];
            }
          | {
              id: string;
              name: string;
              project_id: string;
              project: { id: string; name: string } | { id: string; name: string }[];
            }[]
          | null;
      }[]
    | null;
};

const COMMENT_SELECT = `
  *,
  author:hub_profiles (
    id,
    display_name,
    avatar_url
  ),
  asset:hub_assets (
    id,
    name,
    initiative_id,
    uploaded_by,
    initiative:hub_initiatives (
      id,
      name,
      project_id,
      project:hub_projects (
        id,
        name
      )
    )
  )
`;

function normalizeCommentRow(
  row: CommentRow,
  kind: ForYouItemKind,
): ForYouItem | null {
  const rawAsset = row.asset;
  const asset = Array.isArray(rawAsset) ? rawAsset[0] : rawAsset;
  if (!asset) return null;

  const rawInitiative = asset.initiative;
  const initiative = Array.isArray(rawInitiative) ? rawInitiative[0] : rawInitiative;
  if (!initiative) return null;

  const rawProject = initiative.project;
  const project = Array.isArray(rawProject) ? rawProject[0] : rawProject;
  if (!project) return null;

  const rawAuthor = row.author;
  const author = Array.isArray(rawAuthor) ? rawAuthor[0] : rawAuthor;

  return {
    id: `${kind}:${row.id}`,
    kind,
    comment: {
      id: row.id,
      asset_id: row.asset_id,
      parent_id: row.parent_id,
      author_id: row.author_id,
      body: row.body,
      mentions: row.mentions,
      resolved: row.resolved,
      created_at: row.created_at,
      author: author ?? {
        id: row.author_id,
        display_name: "Unknown",
        avatar_url: null,
      },
    },
    asset: {
      id: asset.id,
      name: asset.name,
      initiative_id: asset.initiative_id,
    },
    initiative: {
      id: initiative.id,
      name: initiative.name,
      project_id: initiative.project_id,
    },
    project: {
      id: project.id,
      name: project.name,
    },
  };
}

export async function getForYouItems(
  supabase: SupabaseClient,
  userId: string,
): Promise<ForYouItem[]> {
  const [{ data: mentionRows, error: mentionError }, { data: myAssets }] =
    await Promise.all([
      supabase
        .from("hub_comments")
        .select(COMMENT_SELECT)
        .contains("mentions", [userId])
        .eq("resolved", false)
        .neq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.from("hub_assets").select("id").eq("uploaded_by", userId),
    ]);

  if (mentionError) throw mentionError;

  const myAssetIds = (myAssets ?? []).map((asset) => asset.id);
  let uploadRows: CommentRow[] = [];

  if (myAssetIds.length > 0) {
    const { data, error } = await supabase
      .from("hub_comments")
      .select(COMMENT_SELECT)
      .in("asset_id", myAssetIds)
      .is("parent_id", null)
      .eq("resolved", false)
      .neq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) throw error;
    uploadRows = (data ?? []) as CommentRow[];
  }

  const byCommentId = new Map<string, ForYouItem>();

  for (const row of (mentionRows ?? []) as CommentRow[]) {
    const item = normalizeCommentRow(row, "mention");
    if (item) byCommentId.set(row.id, item);
  }

  for (const row of uploadRows) {
    if (byCommentId.has(row.id)) continue;
    const item = normalizeCommentRow(row, "upload_thread");
    if (item) byCommentId.set(row.id, item);
  }

  return [...byCommentId.values()].sort(
    (a, b) =>
      new Date(b.comment.created_at).getTime() -
      new Date(a.comment.created_at).getTime(),
  );
}

export async function getForYouCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const items = await getForYouItems(supabase, userId);
  return items.length;
}
