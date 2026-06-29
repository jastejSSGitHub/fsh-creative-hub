import type { TaskPriority } from "@/lib/tasks/types";

export const TASK_PRIORITY_COLORS: Record<
  TaskPriority,
  {
    label: string;
    fullLabel: string;
    dot: string;
    text: string;
    bg: string;
    border: string;
  }
> = {
  1: {
    label: "P1",
    fullLabel: "P1 — Urgent",
    dot: "bg-hub-rejected",
    text: "text-hub-rejected",
    bg: "bg-hub-rejected/10",
    border: "border-hub-rejected/30",
  },
  2: {
    label: "P2",
    fullLabel: "P2 — High",
    dot: "bg-hub-pending",
    text: "text-hub-pending",
    bg: "bg-hub-pending/15",
    border: "border-hub-pending/40",
  },
  3: {
    label: "P3",
    fullLabel: "P3 — Medium",
    dot: "bg-hub-primary",
    text: "text-hub-primary",
    bg: "bg-hub-primary/10",
    border: "border-hub-primary/30",
  },
  4: {
    label: "P4",
    fullLabel: "P4 — Normal",
    dot: "bg-hub-foreground/25",
    text: "text-hub-foreground/55",
    bg: "bg-hub-foreground/[0.04]",
    border: "border-hub-foreground/12",
  },
};

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 1, label: TASK_PRIORITY_COLORS[1].fullLabel },
  { value: 2, label: TASK_PRIORITY_COLORS[2].fullLabel },
  { value: 3, label: TASK_PRIORITY_COLORS[3].fullLabel },
  { value: 4, label: TASK_PRIORITY_COLORS[4].fullLabel },
];

/** Creative workflow columns for new project boards. */
export const CREATIVE_WORKFLOW_SECTION_NAMES = [
  "Not started",
  "In progress",
  "In review",
  "Waiting on client",
  "Done",
] as const;

export const DEFAULT_SECTION_NAMES = CREATIVE_WORKFLOW_SECTION_NAMES;

export const TEAM_LABEL_SLUGS = [
  "design",
  "marketing",
  "tech",
  "print",
  "backend",
  "urgent",
  "quick",
  "waiting",
  "client",
  "internal",
] as const;
