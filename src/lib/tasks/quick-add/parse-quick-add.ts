import * as chrono from "chrono-node";

import type { ParsedQuickAdd, QuickAddChip, TaskPriority } from "@/lib/tasks/types";

const PRIORITY_RE = /\bp([1-4])\b/gi;
const LABEL_RE = /@([\w-]+)/g;
const PROJECT_RE = /#([^@+#]+?)(?=\/|$|\s|@|#|\+|p[1-4])/gi;
const SECTION_RE = /#([^/]+)\/([^\s@+#+]+)/gi;
const ASSIGNEE_RE = /\+([\w.]+)/g;
const RECURRING_RE =
  /\bevery(?:!)?\s+(?:\d+\s+)?(?:days?|weeks?|other\s+\w+|first\s+\w+|\w+day|\w+\s+at\s+[\d:]+\s*(?:am|pm)?)/gi;

function stripTokens(input: string): string {
  return input
    .replace(SECTION_RE, "")
    .replace(PROJECT_RE, "")
    .replace(LABEL_RE, "")
    .replace(PRIORITY_RE, "")
    .replace(ASSIGNEE_RE, "")
    .replace(RECURRING_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseQuickAdd(
  input: string,
  projects: { id: string; name: string }[],
): ParsedQuickAdd {
  let priority: TaskPriority = 4;
  const labelNames: string[] = [];
  let projectName: string | null = null;
  let sectionName: string | null = null;
  let assigneeName: string | null = null;
  let recurringRule: string | null = null;

  const priorityMatch = input.match(/\bp([1-4])\b/i);
  if (priorityMatch) {
    priority = Number(priorityMatch[1]) as TaskPriority;
  }

  for (const match of input.matchAll(LABEL_RE)) {
    labelNames.push(match[1].toLowerCase());
  }

  const sectionMatch = input.match(/#([^/\s]+)\/([^\s@+#+]+)/i);
  if (sectionMatch) {
    projectName = sectionMatch[1].trim();
    sectionName = sectionMatch[2].trim();
  } else {
    const projectMatch = input.match(/#([^\s@+#+/]+)/i);
    if (projectMatch) projectName = projectMatch[1].trim();
  }

  const assigneeMatch = input.match(/\+([\w.]+)/);
  if (assigneeMatch) assigneeName = assigneeMatch[1];

  const recurringMatch = input.match(
    /\bevery(?:!)?\s+(?:\d+\s+)?(?:days?|weeks?|other\s+\w+|first\s+\w+\w*|\w+day(?:\s+at\s+[\d:]+\s*(?:am|pm)?)?)/i,
  );
  if (recurringMatch) {
    recurringRule = recurringMatch[0].trim().toLowerCase();
  }

  const withoutTokens = stripTokens(input);
  const parsed = chrono.parse(withoutTokens, new Date(), { forwardDate: true });
  let dueAt: Date | null = null;
  let name = withoutTokens;

  if (parsed.length > 0) {
    dueAt = parsed[0].start.date();
    const index = parsed[0].index;
    const text = parsed[0].text;
    name = (
      withoutTokens.slice(0, index) + withoutTokens.slice(index + text.length)
    )
      .replace(/\s+/g, " ")
      .trim();
  }

  if (!name) name = withoutTokens || input.trim();

  const matchedProject = projectName
    ? projects.find((p) => p.name.toLowerCase() === projectName!.toLowerCase())
    : null;

  return {
    name,
    dueAt,
    priority,
    projectId: matchedProject?.id ?? null,
    projectName: matchedProject?.name ?? projectName,
    sectionName,
    labelNames: [...new Set(labelNames)],
    assigneeName,
    recurringRule,
    isInbox: !projectName && !matchedProject,
  };
}

export function quickAddToChips(parsed: ParsedQuickAdd): QuickAddChip[] {
  const chips: QuickAddChip[] = [];

  if (parsed.name) {
    chips.push({ type: "name", label: "Task", value: parsed.name });
  }
  if (parsed.dueAt) {
    chips.push({
      type: "date",
      label: "Due",
      value: parsed.dueAt.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: parsed.dueAt.getHours() ? "numeric" : undefined,
        minute: parsed.dueAt.getMinutes() ? "2-digit" : undefined,
      }),
    });
  }
  if (parsed.projectName) {
    chips.push({
      type: "project",
      label: "Project",
      value: parsed.sectionName
        ? `${parsed.projectName} / ${parsed.sectionName}`
        : parsed.projectName,
    });
  }
  for (const label of parsed.labelNames) {
    chips.push({ type: "label", label: "Label", value: `@${label}` });
  }
  if (parsed.priority < 4) {
    chips.push({
      type: "priority",
      label: "Priority",
      value: `P${parsed.priority}`,
    });
  }
  if (parsed.assigneeName) {
    chips.push({
      type: "assignee",
      label: "Assignee",
      value: parsed.assigneeName,
    });
  }
  if (parsed.recurringRule) {
    chips.push({
      type: "recurring",
      label: "Repeat",
      value: parsed.recurringRule,
    });
  }

  return chips;
}

export function highlightDateRange(input: string): { text: string; start: number; end: number } | null {
  const parsed = chrono.parse(input, new Date(), { forwardDate: true });
  if (!parsed.length) return null;
  const { index, text } = parsed[0];
  return { text, start: index, end: index + text.length };
}
