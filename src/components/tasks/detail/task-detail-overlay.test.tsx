import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TaskDetailOverlay } from "./task-detail-overlay";
import { createPersonalTask, createProjectTask } from "@/test/fixtures";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => {
      const chain = {
        on: () => chain,
        subscribe: () => "channel",
      };
      return chain;
    },
    removeChannel: vi.fn(),
  }),
}));

vi.mock("@/lib/tasks/queries", () => ({
  getTaskComments: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/tasks/task-assets", () => ({
  getAssetsForTask: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/tasks/actions", () => ({
  addTaskCommentAction: vi.fn(),
  completeTaskAction: vi.fn(),
  deleteTaskAction: vi.fn(),
  promoteTaskToProjectAction: vi.fn(),
  uncompleteTaskAction: vi.fn(),
  updateTaskAction: vi.fn(),
}));

vi.mock("@/lib/workspace/actions", () => ({
  resolveCommentAction: vi.fn(),
}));

vi.mock("@/lib/presence/use-hub-presence", () => ({
  useProjectPresence: () => ({
    track: vi.fn(),
    untrack: vi.fn(),
  }),
  useTaskViewers: () => [],
}));

vi.mock("@/lib/collaboration-onboarding/events", () => ({
  requestCollaborationOnboarding: vi.fn(),
}));

describe("TaskDetailOverlay", () => {
  it("renders task name and close triggers onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const task = createPersonalTask();

    render(
      <TaskDetailOverlay
        task={task}
        role="admin"
        userId="user-a"
        members={[]}
        labels={[]}
        sections={[]}
        projects={[{ id: "project-1", name: "Spring Campaign" }]}
        onClose={onClose}
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Task details" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Review homepage copy")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows move-to-project controls for personal tasks", async () => {
    render(
      <TaskDetailOverlay
        task={createPersonalTask()}
        role="admin"
        userId="user-a"
        members={[]}
        labels={[]}
        sections={[]}
        projects={[{ id: "project-1", name: "Spring Campaign" }]}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /select project/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^move$/i })).toBeDisabled();
    });
  });

  it("does not show move-to-project picker for project tasks", async () => {
    render(
      <TaskDetailOverlay
        task={createProjectTask()}
        role="admin"
        userId="user-a"
        members={[]}
        labels={[]}
        sections={[]}
        projects={[{ id: "project-1", name: "Spring Campaign" }]}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /select project/i })).not.toBeInTheDocument();
    });
  });
});
