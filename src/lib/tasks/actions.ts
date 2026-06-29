"use server";

import { revalidatePath } from "next/cache";

import { mentionHandle } from "@/lib/mentions/utils";
import { toUserFacingError } from "@/lib/errors/user-facing";
import { getProjectMembership } from "@/lib/projects/queries";
import { computeNextDueDate } from "@/lib/tasks/recurring";
import {
  getTaskById,
  resolveSectionByName,
  ensureDefaultSections,
} from "@/lib/tasks/queries";
import type { ParsedQuickAdd, TaskPriority } from "@/lib/tasks/types";
import {
  FOR_YOU_PATH,
  TASKS_PATH,
  projectTasksPath,
} from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export type TaskActionResult =
  | { ok: true; taskId?: string; suggestResolveCommentId?: string }
  | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  return { supabase, user };
}

async function requireProjectEditor(projectId: string) {
  const { supabase, user } = await requireUser();
  const role = await getProjectMembership(supabase, projectId, user.id);
  if (!role || (role !== "admin" && role !== "editor")) {
    throw new Error("Editor access required.");
  }
  return { supabase, user, role };
}

function revalidateTaskPaths(projectId: string | null) {
  revalidatePath(TASKS_PATH, "layout");
  if (projectId) revalidatePath(projectTasksPath(projectId));
}

export async function createTaskAction(input: {
  name: string;
  projectId?: string | null;
  sectionId?: string | null;
  parentId?: string | null;
  description?: string | null;
  dueAt?: string | null;
  priority?: TaskPriority;
  assigneeId?: string | null;
  recurringRule?: string | null;
  labelIds?: string[];
  sortOrder?: number;
}): Promise<TaskActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const name = input.name.trim();
    if (!name) return { ok: false, error: "Task name is required." };

    if (input.projectId) {
      await requireProjectEditor(input.projectId);
    }

    const insertPayload = {
      name,
      project_id: input.projectId ?? null,
      section_id: input.sectionId ?? null,
      parent_id: input.parentId ?? null,
      description: input.description ?? null,
      due_at: input.dueAt ?? null,
      priority: input.priority ?? 4,
      assignee_id: input.assigneeId ?? null,
      recurring_rule: input.recurringRule ?? null,
      created_by: user.id,
      sort_order: input.sortOrder ?? 0,
    };

    const { data: task, error } = await supabase
      .from("hub_tasks")
      .insert(insertPayload)
      .select("id, project_id")
      .single();

    if (error) {
      // Fallback when INSERT ... RETURNING is blocked by RLS (legacy policy).
      const { error: insertError } = await supabase.from("hub_tasks").insert(insertPayload);
      if (insertError) return { ok: false, error: toUserFacingError(insertError) };

      const { data: fetched, error: fetchError } = await supabase
        .from("hub_tasks")
        .select("id, project_id")
        .eq("created_by", user.id)
        .eq("name", name)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError || !fetched) {
        return { ok: false, error: toUserFacingError(fetchError ?? "Task was created but could not be loaded.") };
      }

      if (input.labelIds?.length) {
        await supabase.from("hub_task_labels").insert(
          input.labelIds.map((labelId) => ({
            task_id: fetched.id,
            label_id: labelId,
          })),
        );
      }

      revalidateTaskPaths(fetched.project_id);
      return { ok: true, taskId: fetched.id };
    }

    if (input.labelIds?.length) {
      await supabase.from("hub_task_labels").insert(
        input.labelIds.map((labelId) => ({
          task_id: task.id,
          label_id: labelId,
        })),
      );
    }

    revalidateTaskPaths(task.project_id);
    return { ok: true, taskId: task.id };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function createTaskFromQuickAddAction(
  parsed: ParsedQuickAdd,
  projects: { id: string; name: string }[],
  members: { id: string; display_name: string }[],
  labels: { id: string; name: string }[],
  options?: { assetId?: string | null },
): Promise<TaskActionResult> {
  let projectId = parsed.projectId;
  if (!projectId && parsed.projectName) {
    const match = projects.find(
      (p) => p.name.toLowerCase() === parsed.projectName!.toLowerCase(),
    );
    projectId = match?.id ?? null;
  }

  let sectionId: string | null = null;
  if (projectId && parsed.sectionName) {
    const { supabase } = await requireUser();
    sectionId = await resolveSectionByName(
      supabase,
      projectId,
      parsed.sectionName,
    );
  } else if (projectId) {
    const { supabase } = await requireUser();
    const sections = await ensureDefaultSections(supabase, projectId);
    sectionId = sections[0]?.id ?? null;
  }

  let assigneeId: string | null = null;
  if (parsed.assigneeName) {
    const normalized = parsed.assigneeName.toLowerCase();
    const member = members.find(
      (m) =>
        m.display_name.toLowerCase().includes(normalized) ||
        mentionHandle(m.display_name).toLowerCase() === normalized,
    );
    assigneeId = member?.id ?? null;
  }

  const labelIds = parsed.labelNames
    .map((name) => labels.find((l) => l.name.toLowerCase() === name)?.id)
    .filter((id): id is string => id != null);

  const result = await createTaskAction({
    name: parsed.name,
    projectId: parsed.isInbox && !projectId ? null : projectId,
    sectionId,
    dueAt: parsed.dueAt?.toISOString() ?? null,
    priority: parsed.priority,
    assigneeId,
    recurringRule: parsed.recurringRule,
    labelIds,
  });

  if (!result.ok || !result.taskId || !options?.assetId) {
    return result;
  }

  const linkResult = await linkTaskAssetAction(result.taskId, options.assetId);
  if (!linkResult.ok) return linkResult;
  return result;
}

export async function updateTaskAction(
  taskId: string,
  patch: {
    name?: string;
    description?: string | null;
    dueAt?: string | null;
    priority?: TaskPriority;
    assigneeId?: string | null;
    sectionId?: string | null;
    parentId?: string | null;
    recurringRule?: string | null;
    sortOrder?: number;
    labelIds?: string[];
  },
): Promise<TaskActionResult> {
  try {
    const { supabase } = await requireUser();

    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name.trim();
    if (patch.description !== undefined) updates.description = patch.description;
    if (patch.dueAt !== undefined) updates.due_at = patch.dueAt;
    if (patch.priority !== undefined) updates.priority = patch.priority;
    if (patch.assigneeId !== undefined) updates.assignee_id = patch.assigneeId;
    if (patch.sectionId !== undefined) updates.section_id = patch.sectionId;
    if (patch.parentId !== undefined) updates.parent_id = patch.parentId;
    if (patch.recurringRule !== undefined) updates.recurring_rule = patch.recurringRule;
    if (patch.sortOrder !== undefined) updates.sort_order = patch.sortOrder;

    const { data, error } = await supabase
      .from("hub_tasks")
      .update(updates)
      .eq("id", taskId)
      .select("project_id")
      .single();

    if (error) return { ok: false, error: toUserFacingError(error) };

    if (patch.labelIds !== undefined) {
      await supabase.from("hub_task_labels").delete().eq("task_id", taskId);
      if (patch.labelIds.length) {
        await supabase.from("hub_task_labels").insert(
          patch.labelIds.map((labelId) => ({ task_id: taskId, label_id: labelId })),
        );
      }
    }

    revalidateTaskPaths(data.project_id);
    return { ok: true, taskId };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function completeTaskAction(taskId: string): Promise<TaskActionResult> {
  try {
    const { supabase } = await requireUser();
    const task = await getTaskById(supabase, taskId);
    if (!task) return { ok: false, error: "Task not found." };

    const completedAt = new Date().toISOString();

    const { error } = await supabase
      .from("hub_tasks")
      .update({ completed: true, completed_at: completedAt })
      .eq("id", taskId);

    if (error) return { ok: false, error: toUserFacingError(error) };

    if (task.recurring_rule) {
      const nextDue = computeNextDueDate(task.recurring_rule, new Date(completedAt));
      if (nextDue) {
        await createTaskAction({
          name: task.name,
          projectId: task.project_id,
          sectionId: task.section_id,
          description: task.description,
          dueAt: nextDue.toISOString(),
          priority: task.priority as TaskPriority,
          assigneeId: task.assignee_id,
          recurringRule: task.recurring_rule,
          labelIds: task.labels.map((l) => l.id),
        });
      }
    }

    let suggestResolveCommentId: string | undefined;
    const { data: linkedComments } = await supabase
      .from("hub_comments")
      .select("id")
      .eq("linked_task_id", taskId)
      .eq("resolved", false)
      .limit(1);

    if (linkedComments?.[0]) {
      suggestResolveCommentId = linkedComments[0].id;
    }

    revalidateTaskPaths(task.project_id);
    revalidatePath(FOR_YOU_PATH);
    return { ok: true, taskId, suggestResolveCommentId };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function uncompleteTaskAction(taskId: string): Promise<TaskActionResult> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("hub_tasks")
      .update({ completed: false, completed_at: null })
      .eq("id", taskId)
      .select("project_id")
      .single();

    if (error) return { ok: false, error: toUserFacingError(error) };
    revalidateTaskPaths(data.project_id);
    return { ok: true, taskId };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function deleteTaskAction(taskId: string): Promise<TaskActionResult> {
  try {
    const { supabase } = await requireUser();
    const task = await getTaskById(supabase, taskId);
    if (!task) return { ok: false, error: "Task not found." };

    const { error } = await supabase.from("hub_tasks").delete().eq("id", taskId);
    if (error) return { ok: false, error: toUserFacingError(error) };

    revalidateTaskPaths(task.project_id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function reorderTasksAction(
  updates: { id: string; sortOrder: number; sectionId?: string | null; parentId?: string | null }[],
): Promise<TaskActionResult> {
  try {
    const { supabase } = await requireUser();

    for (const item of updates) {
      const patch: Record<string, unknown> = { sort_order: item.sortOrder };
      if (item.sectionId !== undefined) patch.section_id = item.sectionId;
      if (item.parentId !== undefined) patch.parent_id = item.parentId;

      const { error } = await supabase
        .from("hub_tasks")
        .update(patch)
        .eq("id", item.id);

      if (error) return { ok: false, error: toUserFacingError(error) };
    }

    revalidatePath(TASKS_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function createSectionAction(
  projectId: string,
  name: string,
): Promise<TaskActionResult & { sectionId?: string }> {
  try {
    const { supabase } = await requireProjectEditor(projectId);
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Section name is required." };

    const sections = await ensureDefaultSections(supabase, projectId);
    const { data, error } = await supabase
      .from("hub_sections")
      .insert({
        project_id: projectId,
        name: trimmed,
        sort_order: sections.length,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: toUserFacingError(error) };
    revalidateTaskPaths(projectId);
    return { ok: true, sectionId: data.id };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function addTaskCommentAction(input: {
  taskId: string;
  body: string;
  mentions: string[];
}): Promise<TaskActionResult & { commentId?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const body = input.body.trim();
    if (!body) return { ok: false, error: "Comment cannot be empty." };

    const { data, error } = await supabase
      .from("hub_task_comments")
      .insert({
        task_id: input.taskId,
        author_id: user.id,
        body,
        mentions: input.mentions,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: toUserFacingError(error) };
    return { ok: true, commentId: data.id };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function createFilterAction(input: {
  name: string;
  query: string;
  color?: string;
}): Promise<TaskActionResult & { filterId?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const name = input.name.trim();
    const query = input.query.trim();
    if (!name || !query) {
      return { ok: false, error: "Filter name and query are required." };
    }

    const { data, error } = await supabase
      .from("hub_filters")
      .insert({
        owner_id: user.id,
        name,
        query,
        color: input.color ?? "#64748b",
        is_preset: false,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: toUserFacingError(error) };
    revalidatePath(TASKS_PATH);
    return { ok: true, filterId: data.id };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function ensureProjectSectionsAction(
  projectId: string,
): Promise<TaskActionResult> {
  try {
    const { supabase } = await requireProjectEditor(projectId);
    await ensureDefaultSections(supabase, projectId);
    revalidateTaskPaths(projectId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function promoteTaskToProjectAction(
  taskId: string,
  projectId: string,
  sectionId?: string | null,
): Promise<TaskActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const task = await getTaskById(supabase, taskId);
    if (!task) return { ok: false, error: "Task not found." };
    if (task.project_id) {
      return { ok: false, error: "Task is already in a project." };
    }
    if (task.created_by !== user.id && task.assignee_id !== user.id) {
      return { ok: false, error: "You cannot move this task." };
    }

    await requireProjectEditor(projectId);

    let resolvedSectionId = sectionId ?? null;
    if (!resolvedSectionId) {
      const sections = await ensureDefaultSections(supabase, projectId);
      resolvedSectionId = sections[0]?.id ?? null;
    }

    const { error } = await supabase
      .from("hub_tasks")
      .update({ project_id: projectId, section_id: resolvedSectionId })
      .eq("id", taskId);

    if (error) return { ok: false, error: toUserFacingError(error) };

    revalidateTaskPaths(projectId);
    revalidatePath(FOR_YOU_PATH);
    return { ok: true, taskId };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function linkTaskAssetAction(
  taskId: string,
  assetId: string,
): Promise<TaskActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("hub_task_assets").insert({
      task_id: taskId,
      asset_id: assetId,
      created_by: user.id,
    });

    if (error) return { ok: false, error: toUserFacingError(error) };
    return { ok: true, taskId };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function createTaskFromCommentAction(input: {
  commentId: string;
  assetId: string;
  projectId: string;
  initiativeId: string;
  commentBody: string;
  assigneeId?: string | null;
}): Promise<TaskActionResult> {
  try {
    const { supabase, user } = await requireUser();
    await requireProjectEditor(input.projectId);

    const name = input.commentBody.trim().slice(0, 120) || "Follow up from feedback";
    const sections = await ensureDefaultSections(supabase, input.projectId);

    const { data: task, error } = await supabase
      .from("hub_tasks")
      .insert({
        name,
        project_id: input.projectId,
        section_id: sections[0]?.id ?? null,
        description: input.commentBody.trim(),
        assignee_id: input.assigneeId ?? user.id,
        created_by: user.id,
        priority: 4,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: toUserFacingError(error) };

    await supabase.from("hub_task_assets").insert({
      task_id: task.id,
      asset_id: input.assetId,
      created_by: user.id,
    });

    await supabase
      .from("hub_comments")
      .update({ linked_task_id: task.id })
      .eq("id", input.commentId);

    revalidateTaskPaths(input.projectId);
    revalidatePath(FOR_YOU_PATH);
    return { ok: true, taskId: task.id };
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}

export async function createFollowUpTaskAction(input: {
  name: string;
  projectId?: string | null;
  assetId?: string | null;
  description?: string | null;
  assigneeId?: string | null;
}): Promise<TaskActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const name = input.name.trim().slice(0, 120) || "Follow-up task";
    let sectionId: string | null = null;

    if (input.projectId) {
      await requireProjectEditor(input.projectId);
      const sections = await ensureDefaultSections(supabase, input.projectId);
      sectionId = sections[0]?.id ?? null;
    }

    const result = await createTaskAction({
      name,
      projectId: input.projectId ?? null,
      sectionId,
      description: input.description ?? null,
      assigneeId: input.assigneeId ?? user.id,
    });

    if (!result.ok || !result.taskId || !input.assetId) {
      return result;
    }

    return linkTaskAssetAction(result.taskId, input.assetId);
  } catch (error) {
    return { ok: false, error: toUserFacingError(error) };
  }
}
