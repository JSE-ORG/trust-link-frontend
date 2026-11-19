import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CommandPalette from "../CommandPalette";

expect.extend(toHaveNoViolations);

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("CommandPalette keyboard navigation and accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function openPalette(user: ReturnType<typeof userEvent.setup>) {
    await user.keyboard("{Control>}k{/Control}");
  }

  it("opens on Ctrl+K and exposes accessible dialog and combobox names", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openPalette(user);

    const dialog = screen.getByRole("dialog", { name: "Command palette" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const searchInput = screen.getByRole("combobox", { name: "Search commands" });
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("aria-expanded", "true");
    expect(searchInput).toHaveAttribute("aria-autocomplete", "list");
  });

  it("navigates results with ArrowDown / ArrowUp and selects with Enter", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await openPalette(user);

    const searchInput = screen.getByRole("combobox", { name: "Search commands" });
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(1);

    // Initial state: first item is active
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(searchInput).toHaveAttribute("aria-activedescendant", options[0].id);

    // Press ArrowDown to advance to second item
    await user.keyboard("{ArrowDown}");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(searchInput).toHaveAttribute("aria-activedescendant", options[1].id);

    // Press ArrowUp to move back to first item
    await user.keyboard("{ArrowUp}");
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    // Press Enter to activate selected command
    await user.keyboard("{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape and restores focus to previous element", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button" data-testid="external-btn">
          External Button
        </button>
        <CommandPalette />
      </div>
    );

    const externalBtn = screen.getByTestId("external-btn");
    externalBtn.focus();
    expect(document.activeElement).toBe(externalBtn);

    await openPalette(user);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toBe(externalBtn);
    });
  });

  it("announces empty results via status live region", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await openPalette(user);

    const searchInput = screen.getByRole("combobox", { name: "Search commands" });
    await user.type(searchInput, "nonexistent-command-query");

    const statusMessage = screen.getByRole("status");
    expect(statusMessage).toBeInTheDocument();
    expect(statusMessage).toHaveTextContent("No results found.");
  });

  it("passes axe accessibility checks without violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<CommandPalette />);

    await openPalette(user);

    const results = await axe(container, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
