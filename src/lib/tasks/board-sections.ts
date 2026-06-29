import type { SectionWithTasks } from "@/lib/tasks/types";

/** Status columns shown per board page — avoids endless horizontal scroll. */
export const BOARD_COLUMNS_PER_PAGE = 3;

export function normalizeBoardSections(sections: SectionWithTasks[]): SectionWithTasks[] {
  const named = sections.filter((section) => section.name.trim().length > 0);
  const merged = new Map<string, SectionWithTasks>();

  for (const section of named) {
    const key = section.name.trim().toLowerCase();
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...section,
        tasks: [...section.tasks],
      });
      continue;
    }

    const tasksById = new Map(existing.tasks.map((task) => [task.id, task]));
    for (const task of section.tasks) {
      tasksById.set(task.id, task);
    }

    merged.set(key, {
      ...existing,
      sort_order: Math.min(existing.sort_order, section.sort_order),
      tasks: Array.from(tasksById.values()).sort((a, b) => a.sort_order - b.sort_order),
    });
  }

  return Array.from(merged.values()).sort((a, b) => a.sort_order - b.sort_order);
}

export function paginateBoardSections(
  sections: SectionWithTasks[],
  page: number,
  columnsPerPage = BOARD_COLUMNS_PER_PAGE,
): {
  page: number;
  pageCount: number;
  visibleSections: SectionWithTasks[];
} {
  const pageCount = Math.max(1, Math.ceil(sections.length / columnsPerPage));
  const safePage = Math.min(Math.max(page, 0), pageCount - 1);
  const start = safePage * columnsPerPage;

  return {
    page: safePage,
    pageCount,
    visibleSections: sections.slice(start, start + columnsPerPage),
  };
}
