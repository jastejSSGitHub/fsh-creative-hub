"use server";

import { revalidatePath } from "next/cache";

import {
  initiativeNameForSection,
  type SectionPresetId,
} from "@/lib/project-files/section-presets";
import { getProjectMembership } from "@/lib/projects/queries";
import { emptyDocumentConfig } from "@/lib/documents/types";
import { canvasPath, projectPath, reviewBoardPath, textDocumentPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/workspace/activity";

export type ActionResult =
  | {
      ok: true;
      boardId?: string;
      canvasId?: string;
      docId?: string;
      initiativeIds?: string[];
    }
  | { ok: false; error: string };

async function requireEditor(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be signed in.");

  const role = await getProjectMembership(supabase, projectId, user.id);
  if (!role || (role !== "admin" && role !== "editor")) {
    throw new Error("Editor access required.");
  }

  return { supabase, user, role };
}

type CreateReviewBoardInput = {
  projectId: string;
  name: string;
  sections: { preset: SectionPresetId; customName?: string }[];
};

export async function createReviewBoardAction(
  input: CreateReviewBoardInput,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireEditor(input.projectId);
    const name = input.name.trim();

    if (!name) return { ok: false, error: "Review board name is required." };
    if (!input.sections.length) {
      return { ok: false, error: "Pick at least one section." };
    }

    const { data: board, error: boardError } = await supabase
      .from("hub_project_files")
      .insert({
        project_id: input.projectId,
        type: "review_board",
        name,
        config: {
          sections: input.sections.map((s) => ({
            preset: s.preset,
            customName: s.customName ?? null,
          })),
        },
        created_by: user.id,
      })
      .select("id")
      .single();

    if (boardError || !board) {
      return { ok: false, error: boardError?.message ?? "Could not create review board." };
    }

    const initiativeRows = input.sections.map((section, index) => ({
      project_id: input.projectId,
      review_board_id: board.id,
      name: initiativeNameForSection(section.preset, section.customName),
      sort_order: index,
    }));

    const { data: initiatives, error: initiativeError } = await supabase
      .from("hub_initiatives")
      .insert(initiativeRows)
      .select("id");

    if (initiativeError || !initiatives?.length) {
      return { ok: false, error: initiativeError?.message ?? "Could not create sections." };
    }

    await logActivity(supabase, {
      projectId: input.projectId,
      actorId: user.id,
      verb: "uploaded",
      targetType: "initiative",
      targetId: board.id,
      summary: `Created review board "${name}"`,
    });

    revalidatePath(projectPath(input.projectId));
    revalidatePath(reviewBoardPath(input.projectId, board.id));

    return {
      ok: true,
      boardId: board.id,
      initiativeIds: initiatives.map((i) => i.id),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

export async function createCanvasAction(
  projectId: string,
  name: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireEditor(projectId);
    const trimmed = name.trim();

    if (!trimmed) return { ok: false, error: "Canvas name is required." };

    const { data: canvas, error } = await supabase
      .from("hub_project_files")
      .insert({
        project_id: projectId,
        type: "canvas",
        name: trimmed,
        config: {
          version: 1,
          nodes: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          backgroundColor: "#1a1a1a",
        },
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !canvas) {
      return { ok: false, error: error?.message ?? "Could not create canvas." };
    }

    await logActivity(supabase, {
      projectId,
      actorId: user.id,
      verb: "uploaded",
      targetType: "initiative",
      targetId: canvas.id,
      summary: `Created open canvas "${trimmed}"`,
    });

    revalidatePath(projectPath(projectId));
    revalidatePath(canvasPath(projectId, canvas.id));

    return { ok: true, canvasId: canvas.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

export async function createTextDocumentAction(
  projectId: string,
  name: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireEditor(projectId);
    const trimmed = name.trim();

    if (!trimmed) return { ok: false, error: "Document name is required." };

    const config = emptyDocumentConfig(trimmed);

    const { data: doc, error } = await supabase
      .from("hub_project_files")
      .insert({
        project_id: projectId,
        type: "text_document",
        name: trimmed,
        config,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !doc) {
      return { ok: false, error: error?.message ?? "Could not create document." };
    }

    await logActivity(supabase, {
      projectId,
      actorId: user.id,
      verb: "uploaded",
      targetType: "initiative",
      targetId: doc.id,
      summary: `Created text document "${trimmed}"`,
    });

    revalidatePath(projectPath(projectId));
    revalidatePath(textDocumentPath(projectId, doc.id));

    return { ok: true, docId: doc.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

type UpdateTextDocumentInput = {
  projectId: string;
  docId: string;
  name?: string;
  config?: Record<string, unknown>;
};

export async function updateTextDocumentAction(
  input: UpdateTextDocumentInput,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireEditor(input.projectId);

    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (!trimmed) return { ok: false, error: "Document name is required." };
      patch.name = trimmed;
    }
    if (input.config !== undefined) {
      patch.config = input.config;
    }

    if (!Object.keys(patch).length) {
      return { ok: true, docId: input.docId };
    }

    const { error } = await supabase
      .from("hub_project_files")
      .update(patch)
      .eq("id", input.docId)
      .eq("project_id", input.projectId)
      .eq("type", "text_document");

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(projectPath(input.projectId));
    revalidatePath(textDocumentPath(input.projectId, input.docId));

    return { ok: true, docId: input.docId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

export async function toggleProjectFileFavoriteAction(
  projectId: string,
  fileId: string,
  favorite: boolean,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "You must be signed in." };
    }

    if (!projectId || !fileId) {
      return { ok: false, error: "Project file is required." };
    }

    const membership = await getProjectMembership(supabase, projectId, user.id);
    if (!membership) {
      return { ok: false, error: "You are not a member of this project." };
    }

    const { data: file } = await supabase
      .from("hub_project_files")
      .select("id")
      .eq("id", fileId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (!file) {
      return { ok: false, error: "File not found in this project." };
    }

    if (favorite) {
      const { error } = await supabase.from("hub_project_file_favorites").upsert(
        {
          user_id: user.id,
          file_id: fileId,
          favorited_at: new Date().toISOString(),
        },
        { onConflict: "user_id,file_id" },
      );

      if (error) {
        return { ok: false, error: error.message };
      }
    } else {
      const { error } = await supabase
        .from("hub_project_file_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("file_id", fileId);

      if (error) {
        return { ok: false, error: error.message };
      }
    }

    revalidatePath(projectPath(projectId));

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update favorite.",
    };
  }
}
