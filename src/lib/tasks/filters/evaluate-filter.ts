import type { TaskWithMeta } from "@/lib/tasks/types";

export type FilterContext = {
  userId: string;
  userDisplayName: string;
  now?: Date;
};

type FilterNode =
  | { type: "and"; left: FilterNode; right: FilterNode }
  | { type: "or"; left: FilterNode; right: FilterNode }
  | { type: "not"; child: FilterNode }
  | { type: "atom"; token: string };

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isToday(dueAt: string | null, now: Date): boolean {
  if (!dueAt) return false;
  const due = new Date(dueAt);
  return due >= startOfDay(now) && due <= endOfDay(now);
}

function isOverdue(dueAt: string | null, now: Date): boolean {
  if (!dueAt) return false;
  return new Date(dueAt) < startOfDay(now);
}

function isWithinDays(dueAt: string | null, days: number, now: Date): boolean {
  if (!dueAt) return false;
  const due = new Date(dueAt);
  const end = endOfDay(addDays(now, days));
  return due >= startOfDay(now) && due <= end;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function tokenMatchesTask(token: string, task: TaskWithMeta, ctx: FilterContext): boolean {
  const now = ctx.now ?? new Date();
  const lower = token.toLowerCase().trim();

  if (lower === "today") return isToday(task.due_at, now);
  if (lower === "overdue") return isOverdue(task.due_at, now);
  if (lower === "no date") return task.due_at == null;
  if (lower === "7 days") return isWithinDays(task.due_at, 7, now);
  if (lower === "30 days") return isWithinDays(task.due_at, 30, now);

  const priorityMatch = lower.match(/^p([1-4])$/);
  if (priorityMatch) {
    return task.priority === Number(priorityMatch[1]);
  }

  if (lower.startsWith("#")) {
    const projectName = lower.slice(1);
    return task.project?.name.toLowerCase() === projectName;
  }

  if (lower.startsWith("@")) {
    const labelName = lower.slice(1).replace(/\*$/, "");
    return task.labels.some((l) =>
      l.name.toLowerCase().startsWith(labelName),
    );
  }

  const assigneeMatch = lower.match(/^assigned to:\s*(.+)$/);
  if (assigneeMatch) {
    const name = assigneeMatch[1].trim();
    if (name === "me") return task.assignee_id === ctx.userId;
    return (
      task.assignee?.display_name.toLowerCase().includes(name) ?? false
    );
  }

  return false;
}

function evaluateNode(node: FilterNode, task: TaskWithMeta, ctx: FilterContext): boolean {
  switch (node.type) {
    case "and":
      return (
        evaluateNode(node.left, task, ctx) && evaluateNode(node.right, task, ctx)
      );
    case "or":
      return (
        evaluateNode(node.left, task, ctx) || evaluateNode(node.right, task, ctx)
      );
    case "not":
      return !evaluateNode(node.child, task, ctx);
    case "atom":
      return tokenMatchesTask(node.token, task, ctx);
  }
}

function parseExpression(tokens: string[]): FilterNode {
  return parseOr(tokens, { index: 0 }).node;
}

function parseOr(
  tokens: string[],
  state: { index: number },
): { node: FilterNode; index: number } {
  let { node: left, index } = parseAnd(tokens, state);
  state.index = index;

  while (state.index < tokens.length && tokens[state.index] === "|") {
    state.index += 1;
    const right = parseAnd(tokens, state);
    left = { type: "or", left, right: right.node };
    state.index = right.index;
  }

  return { node: left, index: state.index };
}

function parseAnd(
  tokens: string[],
  state: { index: number },
): { node: FilterNode; index: number } {
  let { node: left, index } = parseUnary(tokens, state);
  state.index = index;

  while (
    state.index < tokens.length &&
    tokens[state.index] !== "|" &&
    tokens[state.index] !== ","
  ) {
    const right = parseUnary(tokens, state);
    left = { type: "and", left, right: right.node };
    state.index = right.index;
  }

  return { node: left, index: state.index };
}

function parseUnary(
  tokens: string[],
  state: { index: number },
): { node: FilterNode; index: number } {
  if (tokens[state.index] === "!") {
    state.index += 1;
    const child = parseUnary(tokens, state);
    return { node: { type: "not", child: child.node }, index: child.index };
  }

  if (tokens[state.index] === "(") {
    state.index += 1;
    const inner = parseOr(tokens, state);
    if (tokens[state.index] === ")") state.index += 1;
    return { node: inner.node, index: state.index };
  }

  const token = tokens[state.index];
  state.index += 1;
  return { node: { type: "atom", token }, index: state.index };
}

function tokenize(query: string): string[] {
  const parts = query.split(",").map((p) => p.trim()).filter(Boolean);
  const lists: FilterNode[] = [];

  for (const part of parts) {
    const tokens = part.match(/(\(|\)|!|\||&|[^\s()!|&]+(?:\s+[^\s()!|&]+)*)/g) ?? [];
    const normalized: string[] = [];
    for (const token of tokens) {
      if (token === "&") continue;
      normalized.push(token.trim());
    }
    if (normalized.length) {
      lists.push(parseExpression(normalized));
    }
  }

  return lists as unknown as string[];
}

export function parseFilterQuery(query: string): FilterNode[] {
  const parts = query.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.map((part) => {
    const tokens =
      part.match(/(\(|\)|!|\||&|[^\s()!|&]+(?:\s+[^\s()!|&]+)*)/g) ?? [];
    const normalized: string[] = [];
    for (const token of tokens) {
      const t = token.trim();
      if (t === "&") continue;
      if (t) normalized.push(t);
    }
    return parseExpression(normalized);
  });
}

export function taskMatchesFilter(
  task: TaskWithMeta,
  query: string,
  ctx: FilterContext,
): boolean {
  if (!query.trim()) return true;
  const nodes = parseFilterQuery(query);
  return nodes.some((node) => evaluateNode(node, task, ctx));
}

export function filterTasks(
  tasks: TaskWithMeta[],
  query: string,
  ctx: FilterContext,
): TaskWithMeta[] {
  return tasks.filter((task) => !task.completed && taskMatchesFilter(task, query, ctx));
}

export function filterTasksForView(
  tasks: TaskWithMeta[],
  view: "today" | "upcoming" | "inbox",
  ctx: FilterContext,
): TaskWithMeta[] {
  const now = ctx.now ?? new Date();
  const active = tasks.filter((t) => !t.completed && !t.parent_id);

  switch (view) {
    case "inbox":
      return active.filter((t) => t.project_id == null);
    case "today":
      return active.filter((t) => isToday(t.due_at, now) || isOverdue(t.due_at, now));
    case "upcoming": {
      const end = addDays(now, 14);
      return active
        .filter((t) => {
          if (!t.due_at) return false;
          const due = new Date(t.due_at);
          return due >= startOfDay(now) && due <= endOfDay(end);
        })
        .sort(
          (a, b) =>
            new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime(),
        );
    }
  }
}
