"use server";

import { revalidatePath } from "next/cache";

import { toUserFacingError } from "@/lib/errors/user-facing";
import { canAdmin, canEdit } from "@/lib/permissions";
import { PROJECTS_PATH, projectPath, reviewBoardPath } from "@/lib/routes";
import { getProjectMembership } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/workspace/activity";
import { stickyColorToIdeaColor } from "@/lib/workspace/idea-sticky-colors";
import { ensureInitiativeIdeasCanvas } from "@/lib/workspace/ideas-canvas";
import { getIdeasForInitiative } from "@/lib/workspace/queries";
import type { AssetStatus, HubProjectFile, HubRole, VoteReaction } from "@/types/database";
import type { CanvasTextSize, StickyColorId } from "@/lib/canvas/types";

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

async function requireIdeaAuthor(ideaId: string) {
  const { supabase, user } = await requireUser();

  const { data: idea, error } = await supabase
    .from("hub_ideas")
    .select("id, author_id, initiative_id")
    .eq("id", ideaId)
    .maybeSingle();

  if (error || !idea) throw new Error("Idea not found.");
  if (idea.author_id !== user.id) {
    throw new Error("You can only edit your own sticky notes.");
  }

  return { supabase, user, idea };
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

    if (error || !data) return { ok: false, error: toUserFacingError(error?.message, "Something went wrong. Please try again.") };

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
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
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

    if (error || !data) return { ok: false, error: toUserFacingError(error?.message, "Something went wrong. Please try again.") };

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
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
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

    if (error) return { ok: false, error: toUserFacingError(error.message, "Something went wrong. Please try again.") };

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
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
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
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
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

    if (error || !data) return { ok: false, error: toUserFacingError(error?.message, "Something went wrong. Please try again.") };

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
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
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

    if (error) return { ok: false, error: toUserFacingError(error.message, "Something went wrong. Please try again.") };

    revalidateProject(projectId);
    return { ok: true, id: commentId };
  } catch (e) {
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
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

    if (error) return { ok: false, error: toUserFacingError(error.message, "Something went wrong. Please try again.") };

    revalidateProject(projectId);
    return { ok: true, id: commentId };
  } catch (e) {
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
  }
}

export async function deleteAssetAction(
  assetId: string,
  projectId: string,
  boardId?: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireProjectRole(projectId, "editor");

    const { data: asset } = await supabase
      .from("hub_assets")
      .select("storage_path, uploaded_by")
      .eq("id", assetId)
      .single();

    if (!asset) return { ok: false, error: "Asset not found." };

    if (asset.uploaded_by !== user.id) {
      return { ok: false, error: "You can only delete assets you uploaded." };
    }

    if (asset.storage_path) {
      await supabase.storage.from("hub-media").remove([asset.storage_path]);
    }

    const { error } = await supabase.from("hub_assets").delete().eq("id", assetId);

    if (error) return { ok: false, error: toUserFacingError(error.message, "Something went wrong. Please try again.") };

    revalidateProject(projectId, boardId);
    return { ok: true, id: assetId };
  } catch (e) {
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
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

    if (error || !data) return { ok: false, error: toUserFacingError(error?.message, "Something went wrong. Please try again.") };

    revalidateProject(projectId);
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
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
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
  }
}

export async function updateIdeaSizeAction(
  ideaId: string,
  projectId: string,
  width: number,
  height: number,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireIdeaAuthor(ideaId);
    await requireProjectRole(projectId);

    const nextWidth = Math.round(width);
    const nextHeight = Math.round(height);

    if (nextWidth < 100 || nextWidth > 400 || nextHeight < 88 || nextHeight > 400) {
      return { ok: false, error: "Invalid sticky size." };
    }

    const { error } = await supabase
      .from("hub_ideas")
      .update({ width: nextWidth, height: nextHeight })
      .eq("id", ideaId);

    if (error) return { ok: false, error: toUserFacingError(error.message, "Something went wrong. Please try again.") };

    revalidateProject(projectId);
    return { ok: true, id: ideaId };
  } catch (e) {
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
  }
}

export async function updateIdeaBodyAction(
  ideaId: string,
  projectId: string,
  body: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireIdeaAuthor(ideaId);
    await requireProjectRole(projectId);

    const trimmed = body.trim();
    if (!trimmed) return { ok: false, error: "Idea cannot be empty." };

    const { error } = await supabase
      .from("hub_ideas")
      .update({ body: trimmed })
      .eq("id", ideaId);

    if (error) return { ok: false, error: toUserFacingError(error.message, "Something went wrong. Please try again.") };

    revalidateProject(projectId);
    return { ok: true, id: ideaId };
  } catch (e) {
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
  }
}

export async function updateIdeaFormatAction(
  ideaId: string,
  projectId: string,
  patch: {
    color?: StickyColorId;
    textSize?: CanvasTextSize;
    bold?: boolean;
    strikethrough?: boolean;
  },
): Promise<ActionResult> {
  try {
    const { supabase } = await requireIdeaAuthor(ideaId);
    await requireProjectRole(projectId);

    const update: Record<string, unknown> = {};

    if (patch.color !== undefined) {
      update.color = stickyColorToIdeaColor(patch.color);
    }
    if (patch.textSize !== undefined) {
      update.text_size = patch.textSize;
    }
    if (patch.bold !== undefined) {
      update.bold = patch.bold;
    }
    if (patch.strikethrough !== undefined) {
      update.strikethrough = patch.strikethrough;
    }

    if (Object.keys(update).length === 0) {
      return { ok: true, id: ideaId };
    }

    const { error } = await supabase.from("hub_ideas").update(update).eq("id", ideaId);

    if (error) return { ok: false, error: toUserFacingError(error.message, "Something went wrong. Please try again.") };

    revalidateProject(projectId);
    return { ok: true, id: ideaId };
  } catch (e) {
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
  }
}

export async function deleteIdeaAction(
  ideaId: string,
  projectId: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireIdeaAuthor(ideaId);
    await requireProjectRole(projectId);

    const { error } = await supabase.from("hub_ideas").delete().eq("id", ideaId);

    if (error) return { ok: false, error: toUserFacingError(error.message, "Something went wrong. Please try again.") };

    revalidateProject(projectId);
    return { ok: true, id: ideaId };
  } catch (e) {
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
  }
}

export async function duplicateIdeaAction(
  ideaId: string,
  projectId: string,
  initiativeId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireIdeaAuthor(ideaId);
    await requireProjectRole(projectId, "editor");

    const { data: source, error: fetchError } = await supabase
      .from("hub_ideas")
      .select("*")
      .eq("id", ideaId)
      .single();

    if (fetchError || !source) {
      return { ok: false, error: toUserFacingError(fetchError?.message, "That idea could not be found.") };
    }

    const { data, error } = await supabase
      .from("hub_ideas")
      .insert({
        initiative_id: initiativeId,
        author_id: user.id,
        body: source.body,
        color: source.color,
        width: source.width,
        height: source.height,
        text_size: source.text_size,
        bold: source.bold,
        strikethrough: source.strikethrough,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: toUserFacingError(error?.message, "Something went wrong. Please try again.") };

    revalidateProject(projectId);
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
  }
}

export type IdeasCanvasActionResult =
  | { ok: true; canvas: HubProjectFile }
  | { ok: false; error: string };

export async function getInitiativeIdeasCanvasAction(
  projectId: string,
  initiativeId: string,
  initiativeName: string,
): Promise<IdeasCanvasActionResult> {
  try {
    const { supabase, user } = await requireProjectRole(projectId);

    const ideas = await getIdeasForInitiative(supabase, initiativeId, user.id);
    const canvas = await ensureInitiativeIdeasCanvas(
      supabase,
      projectId,
      initiativeId,
      initiativeName,
      user.id,
      ideas,
    );

    if (!canvas) {
      return { ok: false, error: "Could not create ideas whiteboard." };
    }

    return { ok: true, canvas };
  } catch (e) {
    return { ok: false, error: toUserFacingError(e, "Something went wrong. Please try again.") };
  }
}
