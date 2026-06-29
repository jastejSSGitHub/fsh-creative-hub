import type { HubLabel, HubProfile, HubProject, HubSection, HubTask } from "@/types/database";

export type TaskPriority = 1 | 2 | 3 | 4;

export type TasksLayout = "list" | "board";

export type TasksViewKind =
  | "today"
  | "upcoming"
  | "inbox"
  | "project"
  | "label"
  | "filter";

export type TaskWithMeta = HubTask & {
  labels: HubLabel[];
  assignee: Pick<HubProfile, "id" | "display_name" | "avatar_url"> | null;
  project: Pick<HubProject, "id" | "name"> | null;
  subtasks?: TaskWithMeta[];
};

export type SectionWithTasks = HubSection & {
  tasks: TaskWithMeta[];
};

export type TaskCommentWithAuthor = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  mentions: string[];
  created_at: string;
  author: Pick<HubProfile, "id" | "display_name" | "avatar_url">;
};

export type ParsedQuickAdd = {
  name: string;
  dueAt: Date | null;
  priority: TaskPriority;
  projectId: string | null;
  projectName: string | null;
  sectionName: string | null;
  labelNames: string[];
  assigneeName: string | null;
  recurringRule: string | null;
  isInbox: boolean;
};

export type QuickAddChip = {
  type: "name" | "date" | "project" | "label" | "priority" | "assignee" | "recurring";
  label: string;
  value: string;
};
