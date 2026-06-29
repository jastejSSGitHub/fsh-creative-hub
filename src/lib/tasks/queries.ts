import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_SECTION_NAMES } from "@/lib/tasks/constants";
import { normalizeBoardSections } from "@/lib/tasks/board-sections";
import type {
  SectionWithTasks,
  TaskCommentWithAuthor,
  TaskWithMeta,
} from "@/lib/tasks/types";
import type { HubFilter, HubLabel, HubProfile, HubSection } from "@/types/database";

const TASK_SELECT = `
  *,
  assignee:hub_profiles!hub_tasks_assignee_id_fkey (
    id,
    display_name,
    avatar_url
  ),
  project:hub_projects (
    id,
    name
  ),
  hub_task_labels (
    label:hub_labels (*)
  )
`;

type RawTaskRow = {
  id: string;
  project_id: string | null;
  section_id: string | null;
  parent_id: string | null;
  name: string;
  description: string | null;
  due_at: string | null;
  priority: number;
  assignee_id: string | null;
  recurring_rule: string | null;
  completed: boolean;
  completed_at: string | null;
  created_by: string;
  sort_order: number;
  created_at: string;
  assignee:
    | Pick<HubProfile, "id" | "display_name" | "avatar_url">
    | Pick<HubProfile, "id" | "display_name" | "avatar_url">[]
    | null;
  project:
    | Pick<{ id: string; name: string }, "id" | "name">
    | Pick<{ id: string; name: string }, "id" | "name">[]
    | null;
  hub_task_labels: {
    label: HubLabel | HubLabel[];
  }[];
};

function normalizeTask(row: RawTaskRow): TaskWithMeta {
  const assignee = Array.isArray(row.assignee) ? row.assignee[0] : row.assignee;
  const project = Array.isArray(row.project) ? row.project[0] : row.project;
  const labels = (row.hub_task_labels ?? []).flatMap((entry) => {
    const label = Array.isArray(entry.label) ? entry.label[0] : entry.label;
    return label ? [label] : [];
  });

  return {
    id: row.id,
    project_id: row.project_id,
    section_id: row.section_id,
    parent_id: row.parent_id,
    name: row.name,
    description: row.description,
    due_at: row.due_at,
    priority: row.priority as TaskWithMeta["priority"],
    assignee_id: row.assignee_id,
    recurring_rule: row.recurring_rule,
    completed: row.completed,
    completed_at: row.completed_at,
    created_by: row.created_by,
    sort_order: row.sort_order,
    created_at: row.created_at,
    assignee: assignee ?? null,
    project: project ?? null,
    labels,
  };
}

function nestTasks(tasks: TaskWithMeta[]): TaskWithMeta[] {
  const roots = tasks.filter((t) => !t.parent_id);
  const byParent = new Map<string, TaskWithMeta[]>();

  for (const task of tasks) {
    if (!task.parent_id) continue;
    const list = byParent.get(task.parent_id) ?? [];
    list.push(task);
    byParent.set(task.parent_id, list);
  }

  return roots.map((root) => ({
    ...root,
    subtasks: (byParent.get(root.id) ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export async function getLabels(supabase: SupabaseClient): Promise<HubLabel[]> {
  const { data, error } = await supabase
    .from("hub_labels")
    .select("*")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getFilters(supabase: SupabaseClient): Promise<HubFilter[]> {
  const { data, error } = await supabase
    .from("hub_filters")
    .select("*")
    .order("is_favorite", { ascending: false })
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getFilterById(
  supabase: SupabaseClient,
  filterId: string,
): Promise<HubFilter | null> {
  const { data, error } = await supabase
    .from("hub_filters")
    .select("*")
    .eq("id", filterId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getSectionsForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<HubSection[]> {
  const { data, error } = await supabase
    .from("hub_sections")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getTasksRaw(
  supabase: SupabaseClient,
  options: {
    projectId?: string;
    inboxForUserId?: string;
    includeCompleted?: boolean;
  } = {},
): Promise<TaskWithMeta[]> {
  let query = supabase.from("hub_tasks").select(TASK_SELECT);

  if (options.projectId) {
    query = query.eq("project_id", options.projectId);
  } else if (options.inboxForUserId) {
    query = query
      .is("project_id", null)
      .or(
        `created_by.eq.${options.inboxForUserId},assignee_id.eq.${options.inboxForUserId}`,
      );
  }

  if (!options.includeCompleted) {
    query = query.eq("completed", false);
  }

  query = query.order("sort_order");

  const { data, error } = await query;
  if (error) throw error;

  return (data as RawTaskRow[]).map(normalizeTask);
}

export async function getAllAccessibleTasks(
  supabase: SupabaseClient,
  userId: string,
): Promise<TaskWithMeta[]> {
  const { data, error } = await supabase
    .from("hub_tasks")
    .select(TASK_SELECT)
    .eq("completed", false)
    .order("sort_order");

  if (error) throw error;

  const tasks = (data as RawTaskRow[]).map(normalizeTask);
  return tasks.filter(
    (t) =>
      t.project_id != null ||
      t.created_by === userId ||
      t.assignee_id === userId,
  );
}

export async function getProjectTasksGrouped(
  supabase: SupabaseClient,
  projectId: string,
): Promise<SectionWithTasks[]> {
  const [sections, tasks] = await Promise.all([
    getSectionsForProject(supabase, projectId),
    getTasksRaw(supabase, { projectId }),
  ]);

  const nested = nestTasks(tasks);

  if (sections.length === 0) {
    return [
      {
        id: "unsectioned",
        project_id: projectId,
        name: "",
        sort_order: 0,
        created_at: new Date().toISOString(),
        tasks: nested.filter((t) => !t.section_id),
      },
    ];
  }

  return normalizeBoardSections(
    sections.map((section) => ({
      ...section,
      tasks: nested.filter((t) => t.section_id === section.id),
    })),
  );
}

export async function getTaskById(
  supabase: SupabaseClient,
  taskId: string,
): Promise<TaskWithMeta | null> {
  const { data, error } = await supabase
    .from("hub_tasks")
    .select(TASK_SELECT)
    .eq("id", taskId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return normalizeTask(data as RawTaskRow);
}

export async function getTaskComments(
  supabase: SupabaseClient,
  taskId: string,
): Promise<TaskCommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("hub_task_comments")
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
    .eq("task_id", taskId)
    .order("created_at");

  if (error) throw error;

  return (data ?? []).map((row) => {
    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    return {
      id: row.id,
      task_id: row.task_id,
      author_id: row.author_id,
      body: row.body,
      mentions: row.mentions,
      created_at: row.created_at,
      author: author ?? {
        id: row.author_id,
        display_name: "Unknown",
        avatar_url: null,
      },
    };
  });
}

export async function getProjectMembersForTasks(
  supabase: SupabaseClient,
  projectId: string,
): Promise<HubProfile[]> {
  const { data, error } = await supabase
    .from("hub_project_members")
    .select(
      `
      profile:hub_profiles (
        id,
        email,
        display_name,
        avatar_url,
        is_hub_admin,
        created_at
      )
    `,
    )
    .eq("project_id", projectId);

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
      return profile as HubProfile | undefined;
    })
    .filter((p): p is HubProfile => p != null);
}

export async function ensureDefaultSections(
  supabase: SupabaseClient,
  projectId: string,
): Promise<HubSection[]> {
  const existing = await getSectionsForProject(supabase, projectId);
  if (existing.length > 0) return existing;

  const rows = DEFAULT_SECTION_NAMES.map((name, index) => ({
    project_id: projectId,
    name,
    sort_order: index,
  }));

  const { data, error } = await supabase
    .from("hub_sections")
    .insert(rows)
    .select("*");

  if (error) throw error;
  return data ?? [];
}

export async function getUserProjectsForTasks(
  supabase: SupabaseClient,
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("hub_projects")
    .select("id, name")
    .is("trashed_at", null)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function resolveSectionByName(
  supabase: SupabaseClient,
  projectId: string,
  sectionName: string,
): Promise<string | null> {
  const sections = await ensureDefaultSections(supabase, projectId);
  const match = sections.find(
    (s) => s.name.toLowerCase() === sectionName.toLowerCase(),
  );
  return match?.id ?? null;
}

export { nestTasks };
