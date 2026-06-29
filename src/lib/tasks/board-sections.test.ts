import { describe, expect, it } from "vitest";

import {
  BOARD_COLUMNS_PER_PAGE,
  normalizeBoardSections,
  paginateBoardSections,
} from "@/lib/tasks/board-sections";
import type { SectionWithTasks } from "@/lib/tasks/types";

function section(
  id: string,
  name: string,
  sortOrder: number,
  taskIds: string[] = [],
): SectionWithTasks {
  return {
    id,
    project_id: "project-1",
    name,
    sort_order: sortOrder,
    created_at: "2026-01-01T00:00:00.000Z",
    tasks: taskIds.map((taskId, index) => ({
      id: taskId,
      project_id: "project-1",
      section_id: id,
      parent_id: null,
      name: taskId,
      description: null,
      due_at: null,
      priority: 4,
      assignee_id: null,
      recurring_rule: null,
      completed: false,
      completed_at: null,
      created_by: "user-1",
      sort_order: index,
      created_at: "2026-01-01T00:00:00.000Z",
      labels: [],
      assignee: null,
      project: null,
    })),
  };
}

describe("normalizeBoardSections", () => {
  it("merges duplicate column names and keeps sort order", () => {
    const normalized = normalizeBoardSections([
      section("a", "Not started", 0, ["task-a"]),
      section("b", "Not started", 1, ["task-b"]),
      section("c", "In progress", 2, ["task-c"]),
    ]);

    expect(normalized).toHaveLength(2);
    expect(normalized[0]?.name).toBe("Not started");
    expect(normalized[0]?.tasks.map((task) => task.id)).toEqual(["task-a", "task-b"]);
    expect(normalized[1]?.name).toBe("In progress");
  });
});

describe("paginateBoardSections", () => {
  it("returns three columns per page", () => {
    const sections = [
      section("1", "One", 0),
      section("2", "Two", 1),
      section("3", "Three", 2),
      section("4", "Four", 3),
      section("5", "Five", 4),
    ];

    const firstPage = paginateBoardSections(sections, 0);
    expect(firstPage.pageCount).toBe(2);
    expect(firstPage.visibleSections).toHaveLength(BOARD_COLUMNS_PER_PAGE);
    expect(firstPage.visibleSections.map((entry) => entry.name)).toEqual([
      "One",
      "Two",
      "Three",
    ]);

    const secondPage = paginateBoardSections(sections, 1);
    expect(secondPage.visibleSections.map((entry) => entry.name)).toEqual(["Four", "Five"]);
  });
});
