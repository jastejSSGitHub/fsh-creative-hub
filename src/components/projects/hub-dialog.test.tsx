import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HubDialog } from "./hub-dialog";

describe("HubDialog", () => {
  it("renders title and children when open", () => {
    render(
      <HubDialog open onClose={vi.fn()} title="Share with the room">
        <p>Dialog body</p>
      </HubDialog>,
    );

    expect(screen.getByRole("heading", { name: "Share with the room" })).toBeInTheDocument();
    expect(screen.getByText("Dialog body")).toBeInTheDocument();
  });

  it("calls onClose from the header close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <HubDialog open onClose={onClose} title="Members">
        <p>Member list</p>
      </HubDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render content when closed", () => {
    render(
      <HubDialog open={false} onClose={vi.fn()} title="Hidden dialog">
        <p>Hidden body</p>
      </HubDialog>,
    );

    expect(screen.queryByRole("heading", { name: "Hidden dialog" })).not.toBeInTheDocument();
  });
});
