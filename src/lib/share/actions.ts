"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { toUserFacingError } from "@/lib/errors/user-facing";
import { getProjectMembership } from "@/lib/projects/queries";
import { canEdit } from "@/lib/permissions";
import { projectPath, sharePath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/workspace/activity";
import type { ShareLinkConfig, ShareLinkScopeType } from "@/types/database";

export type ShareActionResult =
  | { ok: true; token?: string; id?: string }
  | { ok: false; error: string };

async function requireEditor(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("You must be signed in.");

  const role = await getProjectMembership(supabase, projectId, user.id);
  if (!role || !canEdit(role)) {
    throw new Error("Editor access required.");
  }

  return { supabase, user, role };
}

export async function createShareLinkAction(input: {
  projectId: string;
  scopeType: ShareLinkScopeType;
  scopeId: string;
  config?: ShareLinkConfig;
  expiresAt?: string | null;
}): Promise<ShareActionResult> {
  try {
    const { supabase, user } = await requireEditor(input.projectId);

    const { data, error } = await supabase
      .from("hub_share_links")
      .insert({
        project_id: input.projectId,
        created_by: user.id,
        scope_type: input.scopeType,
        scope_id: input.scopeId,
        config: input.config ?? {},
        expires_at: input.expiresAt ?? null,
      })
      .select("id, token")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: toUserFacingError(error?.message, "We couldn't create that share link."),
      };
    }

    const label = input.config?.label?.trim() || input.scopeType;
    await logActivity(supabase, {
      projectId: input.projectId,
      actorId: user.id,
      verb: "shared",
      targetType: input.scopeType === "asset" ? "asset" : "initiative",
      targetId: input.scopeId,
      summary: `Shared ${label} via link`,
    });

    revalidatePath(projectPath(input.projectId));
    revalidatePath(sharePath(data.token));

    return { ok: true, token: data.token, id: data.id };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function revokeShareLinkAction(linkId: string): Promise<ShareActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You must be signed in." };

    const { data: link, error: fetchError } = await supabase
      .from("hub_share_links")
      .select("project_id")
      .eq("id", linkId)
      .maybeSingle();

    if (fetchError || !link) {
      return { ok: false, error: "Share link not found." };
    }

    await requireEditor(link.project_id);

    const { error } = await supabase
      .from("hub_share_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", linkId);

    if (error) {
      return { ok: false, error: toUserFacingError(error.message) };
    }

    revalidatePath(projectPath(link.project_id));
    return { ok: true, id: linkId };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function rotateShareLinkAction(linkId: string): Promise<ShareActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You must be signed in." };

    const { data: link, error: fetchError } = await supabase
      .from("hub_share_links")
      .select("project_id")
      .eq("id", linkId)
      .maybeSingle();

    if (fetchError || !link) {
      return { ok: false, error: "Share link not found." };
    }

    await requireEditor(link.project_id);

    const { data: newToken, error } = await supabase.rpc("hub_rotate_share_token", {
      p_link_id: linkId,
    });

    if (error || !newToken) {
      return { ok: false, error: toUserFacingError(error?.message) };
    }

    revalidatePath(projectPath(link.project_id));
    revalidatePath(sharePath(newToken));

    return { ok: true, token: newToken, id: linkId };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function recordShareViewAction(token: string): Promise<void> {
  try {
    const supabase = await createClient();
    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? "anonymous";
    const viewerKey = `ip:${ip}`;

    await supabase.rpc("hub_record_share_view", {
      p_token: token,
      p_viewer_key: viewerKey,
    });
  } catch {
    // View recording is best-effort.
  }
}
