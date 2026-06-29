import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActivityTargetType,
  ActivityVerb,
  AssetStatus,
  HubActivity,
  HubAsset,
  HubComment,
  HubIdea,
  HubInitiative,
  HubProfile,
  HubRole,
  HubVote,
  VoteReaction,
} from "@/types/database";

import { buildConsensusCounts, type ConsensusCounts } from "../assets/consensus";
import {
  getAssetVersionCounts,
  resolveAssetThreadRootId,
} from "@/lib/workspace/asset-versions";

export type AssetWithVotes = HubAsset & {
  votes: HubVote[];
  consensus: ConsensusCounts;
  versionCount?: number;
};

export type CommentWithAuthor = HubComment & {
  author: Pick<HubProfile, "id" | "display_name" | "avatar_url">;
  replies: CommentWithAuthor[];
};

export type IdeaWithMeta = HubIdea & {
  author: Pick<HubProfile, "id" | "display_name" | "avatar_url">;
  vote_count: number;
  user_voted: boolean;
};

export type ActivityWithActor = HubActivity & {
  actor: Pick<HubProfile, "id" | "display_name" | "avatar_url">;
};

export async function getInitiatives(
  supabase: SupabaseClient,
  projectId: string,
  reviewBoardId?: string | null,
): Promise<HubInitiative[]> {
  let query = supabase
    .from("hub_initiatives")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (reviewBoardId) {
    query = query.eq("review_board_id", reviewBoardId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as HubInitiative[];
}

export type ProjectMemberWithRole = HubProfile & { role: HubRole };

export async function getProjectMembers(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectMemberWithRole[]> {
  const { data, error } = await supabase
    .from("hub_project_members")
    .select(
      `
      role,
      profile:hub_profiles (
        id,
        email,
        display_name,
        avatar_url,
        created_at
      )
    `,
    )
    .eq("project_id", projectId);

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const raw = row.profile as HubProfile | HubProfile[] | null;
      const profile = Array.isArray(raw) ? raw[0] : raw;
      if (!profile) return null;

      return {
        ...profile,
        role: row.role as HubRole,
      };
    })
    .filter((p): p is ProjectMemberWithRole => p != null)
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
}

function attachVotesToAssets(
  assets: HubAsset[],
  votes: HubVote[] | null | undefined,
): AssetWithVotes[] {
  const votesByAsset = new Map<string, HubVote[]>();
  for (const vote of votes ?? []) {
    const list = votesByAsset.get(vote.asset_id) ?? [];
    list.push(vote);
    votesByAsset.set(vote.asset_id, list);
  }

  return assets.map((asset) => {
    const assetVotes = votesByAsset.get(asset.id) ?? [];
    return {
      ...asset,
      votes: assetVotes,
      consensus: buildConsensusCounts(assetVotes.map((v) => v.reaction)),
    };
  });
}

export async function getAssetsForInitiative(
  supabase: SupabaseClient,
  initiativeId: string,
  statusFilter?: AssetStatus | "all",
): Promise<AssetWithVotes[]> {
  let query = supabase
    .from("hub_assets")
    .select("*")
    .eq("initiative_id", initiativeId)
    .is("variant_of", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: assets, error } = await query;
  if (error) throw error;
  if (!assets?.length) return [];

  const assetIds = assets.map((a) => a.id);
  const [{ data: votes }, versionCounts] = await Promise.all([
    supabase.from("hub_votes").select("*").in("asset_id", assetIds),
    getAssetVersionCounts(supabase, assetIds),
  ]);

  return attachVotesToAssets(assets as HubAsset[], votes as HubVote[] | null).map(
    (asset) => ({
      ...asset,
      versionCount: versionCounts[asset.id] ?? 1,
    }),
  );
}

export async function getAssetsForInitiatives(
  supabase: SupabaseClient,
  initiativeIds: string[],
): Promise<Record<string, AssetWithVotes[]>> {
  const empty: Record<string, AssetWithVotes[]> = Object.fromEntries(
    initiativeIds.map((id) => [id, [] as AssetWithVotes[]]),
  );
  if (!initiativeIds.length) return empty;

  const { data: assets, error } = await supabase
    .from("hub_assets")
    .select("*")
    .in("initiative_id", initiativeIds)
    .is("variant_of", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!assets?.length) return empty;

  const assetIds = assets.map((a) => a.id);
  const [{ data: votes }, versionCounts] = await Promise.all([
    supabase.from("hub_votes").select("*").in("asset_id", assetIds),
    getAssetVersionCounts(supabase, assetIds),
  ]);

  const assetsWithVotes = attachVotesToAssets(
    assets as HubAsset[],
    votes as HubVote[] | null,
  ).map((asset) => ({
    ...asset,
    versionCount: versionCounts[asset.id] ?? 1,
  }));

  const grouped: Record<string, AssetWithVotes[]> = { ...empty };
  for (const asset of assetsWithVotes) {
    grouped[asset.initiative_id]?.push(asset);
  }

  return grouped;
}

export async function getAssetDetail(
  supabase: SupabaseClient,
  assetId: string,
): Promise<AssetWithVotes | null> {
  const { data: asset } = await supabase
    .from("hub_assets")
    .select("*")
    .eq("id", assetId)
    .maybeSingle();

  if (!asset) return null;

  const rootId = resolveAssetThreadRootId(asset as HubAsset);
  const detailId = rootId === asset.id ? asset.id : rootId;

  const { data: rootAsset } =
    detailId === asset.id
      ? { data: asset }
      : await supabase.from("hub_assets").select("*").eq("id", detailId).maybeSingle();

  if (!rootAsset) return null;

  const { data: votes } = await supabase
    .from("hub_votes")
    .select("*")
    .eq("asset_id", detailId);

  const assetVotes = (votes ?? []) as HubVote[];
  const versionCounts = await getAssetVersionCounts(supabase, [detailId]);

  return {
    ...(rootAsset as HubAsset),
    votes: assetVotes,
    consensus: buildConsensusCounts(assetVotes.map((v) => v.reaction)),
    versionCount: versionCounts[detailId] ?? 1,
  };
}

export async function getCommentsForAsset(
  supabase: SupabaseClient,
  assetId: string,
): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("hub_comments")
    .select(
      `
      *,
      author:hub_profiles (
        id,
        display_name,
        avatar_url
      )
    `,
    )
    .eq("asset_id", assetId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []).map((row) => {
    const rawAuthor = row.author as
      | Pick<HubProfile, "id" | "display_name" | "avatar_url">
      | Pick<HubProfile, "id" | "display_name" | "avatar_url">[]
      | null;
    const author = Array.isArray(rawAuthor) ? rawAuthor[0] : rawAuthor;

    return {
      ...(row as HubComment),
      author: author ?? {
        id: row.author_id,
        display_name: "Unknown",
        avatar_url: null,
      },
      replies: [] as CommentWithAuthor[],
    };
  });

  const topLevel = rows.filter((c) => !c.parent_id);
  const replies = rows.filter((c) => c.parent_id);

  for (const reply of replies) {
    const parent = topLevel.find((c) => c.id === reply.parent_id);
    if (parent) parent.replies.push(reply);
  }

  return topLevel;
}

export async function getIdeasForInitiative(
  supabase: SupabaseClient,
  initiativeId: string,
  userId: string,
): Promise<IdeaWithMeta[]> {
  const { data: ideas, error } = await supabase
    .from("hub_ideas")
    .select(
      `
      *,
      author:hub_profiles (
        id,
        display_name,
        avatar_url
      )
    `,
    )
    .eq("initiative_id", initiativeId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!ideas?.length) return [];

  const ideaIds = ideas.map((i) => i.id);
  const { data: ideaVotes } = await supabase
    .from("hub_idea_votes")
    .select("*")
    .in("idea_id", ideaIds);

  return ideas.map((idea) => {
    const rawAuthor = idea.author as
      | Pick<HubProfile, "id" | "display_name" | "avatar_url">
      | Pick<HubProfile, "id" | "display_name" | "avatar_url">[]
      | null;
    const author = Array.isArray(rawAuthor) ? rawAuthor[0] : rawAuthor;
    const votes = (ideaVotes ?? []).filter((v) => v.idea_id === idea.id);

    return {
      ...(idea as HubIdea),
      author: author ?? {
        id: idea.author_id,
        display_name: "Unknown",
        avatar_url: null,
      },
      vote_count: votes.length,
      user_voted: votes.some((v) => v.user_id === userId),
    };
  }).sort((a, b) => b.vote_count - a.vote_count);
}

export async function getActivityForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ActivityWithActor[]> {
  const { data, error } = await supabase
    .from("hub_activity")
    .select(
      `
      *,
      actor:hub_profiles (
        id,
        display_name,
        avatar_url
      )
    `,
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const rawActor = row.actor as
      | Pick<HubProfile, "id" | "display_name" | "avatar_url">
      | Pick<HubProfile, "id" | "display_name" | "avatar_url">[]
      | null;
    const actor = Array.isArray(rawActor) ? rawActor[0] : rawActor;

    return {
      ...(row as HubActivity),
      actor: actor ?? {
        id: row.actor_id,
        display_name: "Unknown",
        avatar_url: null,
      },
    };
  });
}

export function getUserReaction(
  votes: HubVote[],
  userId: string,
): VoteReaction | null {
  return votes.find((v) => v.user_id === userId)?.reaction ?? null;
}
