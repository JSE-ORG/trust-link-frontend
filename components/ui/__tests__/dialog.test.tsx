import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";

expect.extend(toHaveNoViolations);

function TestDialogHarness({
  initialOpen = false,
  onOpenChange,
}: {
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(initialOpen);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Heading</DialogTitle>
            <DialogDescription>Dialog descriptive text</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <input type="text" placeholder="First input" aria-label="First input" />
            <button type="button">Action button</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

describe("Dialog accessibility and keyboard behavior", () => {
  it("renders dialog with role='dialog', aria-modal='true', and connected title/description", async () => {
    render(<TestDialogHarness initialOpen />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const title = screen.getByRole("heading", { name: "Dialog Heading" });
    const description = screen.getByText("Dialog descriptive text");

    expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    expect(dialog).toHaveAttribute("aria-describedby", description.id);
  });

  it("handles Escape key to close the dialog and trigger callback", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(<TestDialogHarness initialOpen onOpenChange={onOpenChange} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("restores focus to trigger button upon closing", async () => {
    const user = userEvent.setup();
    render(<TestDialogHarness initialOpen={false} />);

    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close using the Escape key
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("traps keyboard Tab navigation inside the dialog", async () => {
    const user = userEvent.setup();
    render(<TestDialogHarness initialOpen />);

    const closeBtn = screen.getByRole("button", { name: "Close" });
    const input = screen.getByRole("textbox", { name: "First input" });
    const actionBtn = screen.getByRole("button", { name: "Action button" });

    // Focus last element
    actionBtn.focus();
    expect(document.activeElement).toBe(actionBtn);

    // Tab wraps to the first focusable element (close button)
    fireEvent.keyDown(actionBtn, { key: "Tab" });
    expect(document.activeElement).toBe(closeBtn);

    // Tab moves to input
    await user.tab();
    expect(document.activeElement).toBe(input);

    // Shift+Tab from close button wraps to last element (action button)
    closeBtn.focus();
    fireEvent.keyDown(closeBtn, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(actionBtn);
  });

  it("passes axe accessibility checks without violations", async () => {
    const { container } = render(<TestDialogHarness initialOpen />);
    const results = await axe(container, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
