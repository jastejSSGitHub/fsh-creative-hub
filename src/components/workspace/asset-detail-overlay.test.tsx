import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AssetDetailOverlay } from "./asset-detail-overlay";
import { createTestAsset } from "@/test/fixtures";

import type { CommentWithAuthor } from "@/lib/workspace/queries";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => {
    const query = {
      select: () => query,
      eq: () => query,
      order: () => query,
      maybeSingle: async () => ({ data: null, error: null }),
    };
    const channel = {
      on: () => channel,
      subscribe: () => "channel",
    };
    return {
      from: () => query,
      channel: () => channel,
      removeChannel: vi.fn(),
    };
  },
}));

vi.mock("@/lib/workspace/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/workspace/queries")>();
  return {
    ...actual,
    getCommentsForAsset: vi.fn().mockResolvedValue([]),
    getAssetDetail: vi.fn(),
    getUserReaction: vi.fn().mockReturnValue(null),
  };
});

vi.mock("@/lib/workspace/actions", () => ({
  addCommentAction: vi.fn(),
  deleteCommentAction: vi.fn(),
  resolveCommentAction: vi.fn(),
  toggleVoteAction: vi.fn(),
  updateAssetStatusAction: vi.fn(),
}));

vi.mock("@/lib/tasks/actions", () => ({
  createTaskFromCommentAction: vi.fn(),
}));

vi.mock("@/lib/share/queries", () => ({
  getShareLinksForScope: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/share/actions", () => ({
  createShareLinkAction: vi.fn(),
  revokeShareLinkAction: vi.fn(),
  rotateShareLinkAction: vi.fn(),
}));

vi.mock("@/lib/collaboration-onboarding/events", () => ({
  requestCollaborationOnboarding: vi.fn(),
}));

vi.mock("@/lib/tasks/capture-context", () => ({
  requestOpenQuickAdd: vi.fn(),
  setQuickAddCaptureContext: vi.fn(),
}));

describe("AssetDetailOverlay", () => {
  const initialComments: CommentWithAuthor[] = [];
  const baseProps = {
    projectId: "project-1",
    boardId: "board-1",
    members: [],
    role: "admin" as const,
    userId: "user-a",
    onClose: vi.fn(),
  };

  it("renders asset name and status", async () => {
    const asset = createTestAsset();

    render(
      <AssetDetailOverlay
        {...baseProps}
        asset={asset}
        initialComments={initialComments}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Hero banner v2" })).toBeInTheDocument();
    expect(screen.getByText(/v1 · pending/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^share$/i })).toBeInTheDocument();
  });

  it("calls onClose from the header close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <AssetDetailOverlay
        {...baseProps}
        asset={createTestAsset()}
        initialComments={initialComments}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <AssetDetailOverlay
        {...baseProps}
        asset={createTestAsset()}
        initialComments={initialComments}
        onClose={onClose}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens the share dialog when Share is clicked", async () => {
    const user = userEvent.setup();

    render(
      <AssetDetailOverlay
        {...baseProps}
        asset={createTestAsset()}
        initialComments={initialComments}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^share$/i }));

    expect(screen.getByRole("heading", { name: "Share with the room" })).toBeInTheDocument();
  });
});
