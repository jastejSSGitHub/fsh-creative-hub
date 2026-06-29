import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AssetDeleteConfirmDialog } from "./asset-delete-confirm-dialog";

describe("AssetDeleteConfirmDialog", () => {
  it("shows the asset name in the confirmation copy", () => {
    render(
      <AssetDeleteConfirmDialog
        open
        assetName="Menu Poster v3"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Delete asset" })).toBeInTheDocument();
    expect(screen.getByText("Menu Poster v3")).toBeInTheDocument();
  });

  it("cancel does not call onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <AssetDeleteConfirmDialog
        open
        assetName="Menu Poster v3"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirm calls onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <AssetDeleteConfirmDialog
        open
        assetName="Menu Poster v3"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
