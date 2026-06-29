import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { InviteMembersDialog } from "./invite-members-dialog";
import { createTestProject } from "@/test/fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/projects/actions", () => ({
  inviteProjectMemberAction: vi.fn(),
  removeProjectMemberAction: vi.fn(),
  updateProjectMemberRoleAction: vi.fn(),
}));

vi.mock("@/components/projects/project-card", () => ({
  copyProjectLink: vi.fn().mockResolvedValue(undefined),
}));

describe("InviteMembersDialog", () => {
  it("renders member list when a project is provided", () => {
    const project = createTestProject();

    render(
      <InviteMembersDialog
        project={project}
        currentUserId="user-a"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: /members · spring campaign/i })).toBeInTheDocument();
    expect(screen.getByText("User A (you)")).toBeInTheDocument();
    expect(screen.getByText("User B")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });

  it("closes when the header close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <InviteMembersDialog
        project={createTestProject()}
        currentUserId="user-a"
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a validation error for non-work emails", async () => {
    const user = userEvent.setup();

    render(
      <InviteMembersDialog
        project={createTestProject()}
        currentUserId="user-a"
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByRole("textbox"), "guest@example.com");
    await user.click(screen.getByRole("button", { name: "Invite" }));

    await waitFor(() => {
      expect(screen.getByText(/invites must use an @fshdesign.org work email/i)).toBeInTheDocument();
    });
  });
});
