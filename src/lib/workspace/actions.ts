"use server";

import { revalidatePath } from "next/cache";

import { canAdmin, canEdit } from "@/lib/permissions";
import { PROJECTS_PATH, projectPath, reviewBoardPath } from "@/lib/routes";
import { getProjectMembership } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/workspace/activity";
import type { AssetStatus, HubRole, VoteReaction } from "@/types/database";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("You must be signed in.");
  return { supabase, user };
}

async function requireProjectRole(
  projectId: string,
  minRole?: "editor" | "admin",
) {
  const { supabase, user } = await requireUser();
  const role = await getProjectMembership(supabase, projectId, user.id);
  if (!role) throw new Error("You are not a member of this project.");

  if (minRole === "admin" && !canAdmin(role)) {
    throw new Error("Admin access required.");
  }
  if (minRole === "editor" && !canEdit(role)) {
    throw new Error("Editor access required.");
  }

  return { supabase, user, role };
}

async function getProjectIdForAsset(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assetId: string,
) {
  const { data } = await supabase
    .from("hub_assets")
    .select("initiative_id, name, hub_initiatives(project_id)")
    .eq("id", assetId)
    .single();

  const initiative = data?.hub_initiatives as
    | { project_id: string }
    | { project_id: string }[]
    | null;
  const projectId = Array.isArray(initiative)
    ? initiative[0]?.project_id
    : initiative?.project_id;

  return {
    projectId,
    assetName: data?.name as string | undefined,
    initiativeId: data?.initiative_id as string | undefined,
  };
}

function revalidateProject(projectId: string, boardId?: string) {
  revalidatePath(projectPath(projectId));
  if (boardId) revalidatePath(reviewBoardPath(projectId, boardId));
  revalidatePath(PROJECTS_PATH);
}

export async function createInitiativeAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const projectId = String(formData.get("projectId") ?? "");
    const reviewBoardId = String(formData.get("reviewBoardId") ?? "").trim() || null;
    const name = String(formData.get("name") ?? "").trim();
    const { supabase, user } = await requireProjectRole(projectId, "editor");

    if (!name) return { ok: false, error: "Initiative name is required." };

    const { data, error } = await supabase
      .from("hub_initiatives")
      .insert({
        project_id: projectId,
        review_board_id: reviewBoardId,
        name,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Failed." };

    await logActivity(supabase, {
      projectId,
      actorId: user.id,
      verb: "uploaded",
      targetType: "initiative",
      targetId: data.id,
      summary: `Created section "${name}"`,
    });

    revalidateProject(projectId, reviewBoardId ?? undefined);
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function registerAssetAction(input: {
  initiativeId: string;
  projectId: string;
  boardId?: string;
  name: string;
  type: "image" | "video";
  storagePath: string;
  publicUrl: string;
  tag: string;
  isFixCandidate?: boolean;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireProjectRole(input.projectId, "editor");

    const { data, error } = await supabase
      .from("hub_assets")
      .insert({
        initiative_id: input.initiativeId,
        name: input.name,
        type: input.type,
        storage_path: input.storagePath,
        public_url: input.publicUrl,
        tag: input.tag,
        uploaded_by: user.id,
        status: "pending",
        is_fix_candidate: input.isFixCandidate ?? false,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Failed." };

    await logActivity(supabase, {
      projectId: input.projectId,
      actorId: user.id,
      verb: "uploaded",
      targetType: "asset",
      targetId: data.id,
      summary: `Uploaded "${input.name}"`,
    });

    revalidateProject(input.projectId, input.boardId);
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function updateAssetStatusAction(
  assetId: string,
  status: AssetStatus,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { projectId, assetName, initiativeId } = await getProjectIdForAsset(
      supabase,
      assetId,
    );
    if (!projectId) return { ok: false, error: "Asset not found." };

    const role = await getProjectMembership(supabase, projectId, user.id);
    if (!role) return { ok: false, error: "Not a member." };

    if (status === "final" && !canAdmin(role)) {
      return { ok: false, error: "Only admins can set Final Pick." };
    }
    if (status !== "final" && !canEdit(role)) {
      return { ok: false, error: "Editor access required." };
    }

    const { error } = await supabase
      .from("hub_assets")
      .update({ status })
      .eq("id", assetId);

    if (error) return { ok: false, error: error.message };

    const verb =
      status === "approved"
        ? "approved"
        : status === "rejected"
          ? "rejected"
          : status === "final"
            ? "final"
            : "uploaded";

    await logActivity(supabase, {
      projectId,
      actorId: user.id,
      verb,
      targetType: "asset",
      targetId: assetId,
      summary: `${status === "final" ? "Locked final pick" : status.charAt(0).toUpperCase() + status.slice(1)} on "${assetName ?? "asset"}"`,
    });

    revalidateProject(projectId);
    if (initiativeId) {
      revalidatePath(`${projectPath(projectId)}/i/${initiativeId}/a/${assetId}`);
    }
    return { ok: true, id: assetId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function toggleVoteAction(
  assetId: string,
  reaction: VoteReaction,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { projectId, assetName } = await getProjectIdForAsset(supabase, assetId);
    if (!projectId) return { ok: false, error: "Asset not found." };

    const role = await getProjectMembership(supabase, projectId, user.id);
    if (!role) return { ok: false, error: "Not a member." };

    const { data: asset } = await supabase
      .from("hub_assets")
      .select("status")
      .eq("id", assetId)
      .single();

    if (asset?.status === "final") {
      return { ok: false, error: "Voting is closed on final picks." };
    }

    const { data: existing } = await supabase
      .from("hub_votes")
      .select("id, reaction")
      .eq("asset_id", assetId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.reaction === reaction) {
      await supabase.from("hub_votes").delete().eq("id", existing.id);
    } else if (existing) {
      await supabase.from("hub_votes").update({ reaction }).eq("id", existing.id);
    } else {
      await supabase.from("hub_votes").insert({
        asset_id: assetId,
        user_id: user.id,
        reaction,
      });
    }

    await logActivity(supabase, {
      projectId,
      actorId: user.id,
      verb: "voted",
      targetType: "asset",
      targetId: assetId,
      summary: `Reacted on "${assetName ?? "asset"}"`,
    });

    revalidateProject(projectId);
    return { ok: true, id: assetId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addCommentAction(input: {
  assetId: string;
  body: string;
  parentId?: string | null;
  mentions?: string[];
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { projectId, assetName } = await getProjectIdForAsset(
      supabase,
      input.assetId,
    );
    if (!projectId) return { ok: false, error: "Asset not found." };

    const role = await getProjectMembership(supabase, projectId, user.id);
    if (!role) return { ok: false, error: "Not a member." };

    const body = input.body.trim();
    if (!body) return { ok: false, error: "Comment cannot be empty." };

    const { data, error } = await supabase
      .from("hub_comments")
      .insert({
        asset_id: input.assetId,
        parent_id: input.parentId ?? null,
        author_id: user.id,
        body,
        mentions: input.mentions ?? [],
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Failed." };

    await logActivity(supabase, {
      projectId,
      actorId: user.id,
      verb: "commented",
      targetType: "asset",
      targetId: input.assetId,
      summary: `Commented on "${assetName ?? "asset"}"`,
    });

    revalidateProject(projectId);
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deleteCommentAction(
  commentId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    const { data: comment } = await supabase
      .from("hub_comments")
      .select("asset_id, author_id")
      .eq("id", commentId)
      .single();

    if (!comment) return { ok: false, error: "Comment not found." };

    const { projectId } = await getProjectIdForAsset(supabase, comment.asset_id);
    if (!projectId) return { ok: false, error: "Asset not found." };

    const role = await getProjectMembership(supabase, projectId, user.id);
    const canDelete = comment.author_id === user.id || canAdmin(role);

    if (!canDelete) return { ok: false, error: "Cannot delete this comment." };

    const { error } = await supabase
      .from("hub_comments")
      .delete()
      .eq("id", commentId);

    if (error) return { ok: false, error: error.message };

    revalidateProject(projectId);
    return { ok: true, id: commentId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function resolveCommentAction(
  commentId: string,
  resolved: boolean,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    const { data: comment } = await supabase
      .from("hub_comments")
      .select("asset_id, author_id")
      .eq("id", commentId)
      .single();

    if (!comment) return { ok: false, error: "Comment not found." };

    const { projectId } = await getProjectIdForAsset(supabase, comment.asset_id);
    if (!projectId) return { ok: false, error: "Asset not found." };

    const role = await getProjectMembership(supabase, projectId, user.id);
    const canResolve = comment.author_id === user.id || canAdmin(role);

    if (!canResolve) return { ok: false, error: "Cannot resolve this thread." };

    const { error } = await supabase
      .from("hub_comments")
      .update({ resolved })
      .eq("id", commentId);

    if (error) return { ok: false, error: error.message };

    revalidateProject(projectId);
    return { ok: true, id: commentId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addIdeaAction(
  initiativeId: string,
  projectId: string,
  body: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireProjectRole(projectId, "editor");
    const trimmed = body.trim();
    if (!trimmed) return { ok: false, error: "Idea cannot be empty." };

    const colors = ["yellow", "pink", "blue", "green", "lavender"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const { data, error } = await supabase
      .from("hub_ideas")
      .insert({
        initiative_id: initiativeId,
        author_id: user.id,
        body: trimmed,
        color,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Failed." };

    revalidateProject(projectId);
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function toggleIdeaVoteAction(
  ideaId: string,
  projectId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireProjectRole(projectId);

    const { data: existing } = await supabase
      .from("hub_idea_votes")
      .select("id")
      .eq("idea_id", ideaId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("hub_idea_votes").delete().eq("id", existing.id);
    } else {
      await supabase.from("hub_idea_votes").insert({
        idea_id: ideaId,
        user_id: user.id,
      });
    }

    revalidateProject(projectId);
    return { ok: true, id: ideaId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
}
