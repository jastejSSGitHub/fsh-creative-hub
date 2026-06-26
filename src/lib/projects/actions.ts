"use server";

import { revalidatePath } from "next/cache";

import { validateInviteEmail } from "@/lib/email";
import { canAdmin } from "@/lib/permissions";
import { ensureHubProfile } from "@/lib/auth/ensure-profile";
import { PROJECTS_PATH, projectPath } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { HubRole } from "@/types/database";

import { getProjectMembership } from "./queries";

export type ActionResult =
  | { ok: true; projectId?: string }
  | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in.");
  }

  return { supabase, user };
}

async function uploadProjectCover(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  cover: File,
): Promise<string | null> {
  const extension = cover.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `covers/${projectId}/cover.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("hub-media")
    .upload(storagePath, cover, {
      upsert: true,
      contentType: cover.type || undefined,
    });

  if (uploadError) {
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("hub-media").getPublicUrl(storagePath);

  return publicUrl;
}

export async function createProjectAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const cover = formData.get("cover");

    if (!name) {
      return { ok: false, error: "Project name is required." };
    }

    await ensureHubProfile(user);

    const { data: project, error: projectError } = await supabase
      .from("hub_projects")
      .insert({
        name,
        description: description || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (projectError || !project) {
      return { ok: false, error: projectError?.message ?? "Could not create project." };
    }

    const { error: memberError } = await supabase
      .from("hub_project_members")
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: "admin",
      });

    if (memberError) {
      return { ok: false, error: memberError.message };
    }

    if (cover instanceof File && cover.size > 0) {
      const coverUrl = await uploadProjectCover(supabase, project.id, cover);
      if (coverUrl) {
        await supabase
          .from("hub_projects")
          .update({ cover_url: coverUrl })
          .eq("id", project.id);
      }
    }

    revalidatePath(PROJECTS_PATH);
    revalidatePath(projectPath(project.id));

    return { ok: true, projectId: project.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}

async function resolveUserIdByEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("hub_profiles")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (profile?.id) {
    return profile.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: normalized,
    email_confirm: true,
    user_metadata: {
      full_name: normalized.split("@")[0],
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Could not invite that email.");
  }

  return data.user.id;
}

export async function inviteProjectMemberAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const projectId = String(formData.get("projectId") ?? "");
    const rawEmail = String(formData.get("email") ?? "");
    const role = String(formData.get("role") ?? "viewer") as HubRole;

    const emailResult = validateInviteEmail(rawEmail);
    if (!emailResult.ok) {
      return { ok: false, error: emailResult.error };
    }

    const email = emailResult.email;

    if (!projectId) {
      return { ok: false, error: "Project is required." };
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return { ok: false, error: "Invalid role." };
    }

    const membership = await getProjectMembership(supabase, projectId, user.id);
    if (!canAdmin(membership)) {
      return { ok: false, error: "Only project admins can invite members." };
    }

    const invitedUserId = await resolveUserIdByEmail(email);

    if (invitedUserId === user.id) {
      return { ok: false, error: "You are already in this project." };
    }

    const { data: existing } = await supabase
      .from("hub_project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", invitedUserId)
      .maybeSingle();

    if (existing) {
      return { ok: false, error: "That person is already a member." };
    }

    const { error } = await supabase.from("hub_project_members").insert({
      project_id: projectId,
      user_id: invitedUserId,
      role,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(PROJECTS_PATH);
    revalidatePath(projectPath(projectId));

    return { ok: true, projectId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not invite member.",
    };
  }
}

export async function updateProjectMemberRoleAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const projectId = String(formData.get("projectId") ?? "");
    const memberUserId = String(formData.get("memberUserId") ?? "");
    const role = String(formData.get("role") ?? "") as HubRole;

    if (!projectId || !memberUserId || !role) {
      return { ok: false, error: "Missing member details." };
    }

    const membership = await getProjectMembership(supabase, projectId, user.id);
    if (!canAdmin(membership)) {
      return { ok: false, error: "Only project admins can change roles." };
    }

    const { count: adminCount } = await supabase
      .from("hub_project_members")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("role", "admin");

    const { data: target } = await supabase
      .from("hub_project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", memberUserId)
      .maybeSingle();

    if (
      target?.role === "admin" &&
      role !== "admin" &&
      (adminCount ?? 0) <= 1
    ) {
      return { ok: false, error: "Each project needs at least one admin." };
    }

    const { error } = await supabase
      .from("hub_project_members")
      .update({ role })
      .eq("project_id", projectId)
      .eq("user_id", memberUserId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(PROJECTS_PATH);
    revalidatePath(projectPath(projectId));

    return { ok: true, projectId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update role.",
    };
  }
}

export async function removeProjectMemberAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const projectId = String(formData.get("projectId") ?? "");
    const memberUserId = String(formData.get("memberUserId") ?? "");

    if (!projectId || !memberUserId) {
      return { ok: false, error: "Missing member details." };
    }

    const membership = await getProjectMembership(supabase, projectId, user.id);
    if (!canAdmin(membership)) {
      return { ok: false, error: "Only project admins can remove members." };
    }

    const { data: target } = await supabase
      .from("hub_project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", memberUserId)
      .maybeSingle();

    if (target?.role === "admin") {
      const { count } = await supabase
        .from("hub_project_members")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("role", "admin");

      if ((count ?? 0) <= 1) {
        return { ok: false, error: "Cannot remove the last admin." };
      }
    }

    const { error } = await supabase
      .from("hub_project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", memberUserId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(PROJECTS_PATH);
    revalidatePath(projectPath(projectId));

    return { ok: true, projectId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not remove member.",
    };
  }
}

export async function renameProjectAction(
  projectId: string,
  name: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const trimmed = name.trim();

    if (!projectId || !trimmed) {
      return { ok: false, error: "Project name is required." };
    }

    const membership = await getProjectMembership(supabase, projectId, user.id);
    if (!canAdmin(membership)) {
      return { ok: false, error: "Only project admins can rename projects." };
    }

    const { error } = await supabase
      .from("hub_projects")
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq("id", projectId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(PROJECTS_PATH);
    revalidatePath(projectPath(projectId));

    return { ok: true, projectId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not rename project.",
    };
  }
}

export async function toggleProjectFavoriteAction(
  projectId: string,
  favorite: boolean,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    if (!projectId) {
      return { ok: false, error: "Project is required." };
    }

    const membership = await getProjectMembership(supabase, projectId, user.id);
    if (!membership) {
      return { ok: false, error: "You are not a member of this project." };
    }

    const { error } = await supabase
      .from("hub_project_members")
      .update({
        is_favorite: favorite,
        favorited_at: favorite ? new Date().toISOString() : null,
      })
      .eq("project_id", projectId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(PROJECTS_PATH);

    return { ok: true, projectId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update favorite.",
    };
  }
}

export async function trashProjectAction(projectId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    if (!projectId) {
      return { ok: false, error: "Project is required." };
    }

    const membership = await getProjectMembership(supabase, projectId, user.id);
    if (!canAdmin(membership)) {
      return { ok: false, error: "Only project admins can move projects to trash." };
    }

    const { error } = await supabase
      .from("hub_projects")
      .update({
        trashed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(PROJECTS_PATH);
    revalidatePath(projectPath(projectId));

    return { ok: true, projectId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not move project to trash.",
    };
  }
}

export async function restoreProjectAction(projectId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    if (!projectId) {
      return { ok: false, error: "Project is required." };
    }

    const membership = await getProjectMembership(supabase, projectId, user.id);
    if (!canAdmin(membership)) {
      return { ok: false, error: "Only project admins can restore projects." };
    }

    const { error } = await supabase
      .from("hub_projects")
      .update({
        trashed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(PROJECTS_PATH);
    revalidatePath(projectPath(projectId));

    return { ok: true, projectId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not restore project.",
    };
  }
}

export async function duplicateProjectAction(projectId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    if (!projectId) {
      return { ok: false, error: "Project is required." };
    }

    const membership = await getProjectMembership(supabase, projectId, user.id);
    if (!canAdmin(membership)) {
      return { ok: false, error: "Only project admins can duplicate projects." };
    }

    const { data: source, error: sourceError } = await supabase
      .from("hub_projects")
      .select("name, description, cover_url")
      .eq("id", projectId)
      .single();

    if (sourceError || !source) {
      return { ok: false, error: sourceError?.message ?? "Project not found." };
    }

    const { data: newProject, error: projectError } = await supabase
      .from("hub_projects")
      .insert({
        name: `${source.name} copy`,
        description: source.description,
        cover_url: source.cover_url,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (projectError || !newProject) {
      return { ok: false, error: projectError?.message ?? "Could not duplicate project." };
    }

    const { data: members } = await supabase
      .from("hub_project_members")
      .select("user_id, role")
      .eq("project_id", projectId);

    const memberRows = (members ?? []).map((member) => ({
      project_id: newProject.id,
      user_id: member.user_id,
      role: member.role,
    }));

    if (memberRows.length > 0) {
      const { error: memberError } = await supabase
        .from("hub_project_members")
        .insert(memberRows);

      if (memberError) {
        return { ok: false, error: memberError.message };
      }
    }

    const { data: initiatives } = await supabase
      .from("hub_initiatives")
      .select("name, description, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (initiatives && initiatives.length > 0) {
      const { error: initiativeError } = await supabase.from("hub_initiatives").insert(
        initiatives.map((initiative) => ({
          project_id: newProject.id,
          name: initiative.name,
          description: initiative.description,
          sort_order: initiative.sort_order,
        })),
      );

      if (initiativeError) {
        return { ok: false, error: initiativeError.message };
      }
    }

    revalidatePath(PROJECTS_PATH);

    return { ok: true, projectId: newProject.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not duplicate project.",
    };
  }
}
