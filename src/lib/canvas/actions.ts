"use server";

import { revalidatePath } from "next/cache";

import type { CanvasConfigV1 } from "@/lib/canvas/types";
import { canvasPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { getProjectMembership } from "@/lib/projects/queries";

export type SaveCanvasResult = { ok: true } | { ok: false; error: string };

export async function saveCanvasConfigAction(
  projectId: string,
  canvasId: string,
  config: CanvasConfigV1,
): Promise<SaveCanvasResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: "You must be signed in." };

    const role = await getProjectMembership(supabase, projectId, user.id);
    if (!role || (role !== "admin" && role !== "editor")) {
      return { ok: false, error: "Editor access required." };
    }

    const { error } = await supabase
      .from("hub_project_files")
      .update({ config })
      .eq("id", canvasId)
      .eq("project_id", projectId)
      .eq("type", "canvas");

    if (error) return { ok: false, error: error.message };

    revalidatePath(canvasPath(projectId, canvasId));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save canvas.",
    };
  }
}
