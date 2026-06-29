import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HubConfirmDialog } from "./hub-confirm-dialog";

describe("HubConfirmDialog", () => {
  it("renders title and description when open", () => {
    render(
      <HubConfirmDialog
        open
        title="Delete asset"
        description="Are you sure you want to delete this asset?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Delete asset" })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete this asset/i)).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <HubConfirmDialog
        open
        title="Confirm"
        description="Proceed?"
        cancelLabel="Cancel"
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when confirm is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <HubConfirmDialog
        open
        title="Confirm"
        description="Proceed?"
        confirmLabel="Delete"
        tone="danger"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not render when closed", () => {
    render(
      <HubConfirmDialog
        open={false}
        title="Hidden"
        description="Should not appear"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByRole("heading", { name: "Hidden" })).not.toBeInTheDocument();
  });
});
