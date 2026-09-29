import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import ConfirmationDialog from "../ConfirmationDialog";

describe("ConfirmationDialog (issue #69)", () => {
  let onConfirm: () => void;
  let onCancel: () => void;

  beforeEach(() => {
    onConfirm = vi.fn();
    onCancel = vi.fn();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <ConfirmationDialog
        open={false}
        title="Delete escrow"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the custom title and body when open", () => {
    render(
      <ConfirmationDialog
        open
        title="Delete escrow"
        description="This action cannot be undone."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Delete escrow" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("This action cannot be undone.")
    ).toBeInTheDocument();
  });

  it("supports a ReactNode body", () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        description={<span data-testid="rich-body">Rich body</span>}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(screen.getByTestId("rich-body")).toBeInTheDocument();
  });

  it("uses default Confirm/Cancel labels", () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders custom action labels", () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        confirmLabel="Yes, delete"
        cancelLabel="Keep it"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(
      screen.getByRole("button", { name: "Yes, delete" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep it" })).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", async () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onCancel when Escape is pressed", async () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the backdrop is clicked", async () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    // The backdrop is the dialog's parent overlay.
    const dialog = screen.getByRole("dialog");
    await userEvent.click(dialog.parentElement as HTMLElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel when the dialog body is clicked", async () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await userEvent.click(screen.getByRole("dialog"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("disables both buttons and shows a pending label while loading", () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        loading
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(screen.getByRole("button", { name: /please wait/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("exposes accessible dialog semantics", () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        description="Body"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      "confirmation-dialog-title"
    );
  });

  it("traps Tab focus within the modal (issue #566)", async () => {
    render(
      <ConfirmationDialog
        open
        title="Confirm"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const confirmButton = screen.getByRole("button", { name: "Confirm" });

    // Wait for FocusTrap's initial-focus animation frame to land on Confirm.
    await waitFor(() => expect(confirmButton).toHaveFocus());

    // Tab from the last focusable element wraps back to the first.
    await userEvent.tab();
    expect(cancelButton).toHaveFocus();

    // Shift+Tab from the first focusable element wraps back to the last.
    await userEvent.tab({ shift: true });
    expect(confirmButton).toHaveFocus();
  });

  it("returns focus to the triggering element when closed (issue #566)", async () => {
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Trigger</button>
          <ConfirmationDialog
            open={open}
            title="Confirm"
            onConfirm={onConfirm}
            onCancel={() => setOpen(false)}
          />
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Trigger" });
    await userEvent.click(trigger);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus()
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
