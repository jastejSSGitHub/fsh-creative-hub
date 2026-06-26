"use server";

import { revalidatePath } from "next/cache";

import {
  initiativeNameForSection,
  type SectionPresetId,
} from "@/lib/project-files/section-presets";
import { getProjectMembership } from "@/lib/projects/queries";
import { projectPath, reviewBoardPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/workspace/activity";

export type ActionResult =
  | { ok: true; boardId?: string; initiativeIds?: string[] }
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
