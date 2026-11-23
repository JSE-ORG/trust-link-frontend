import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import React from "react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import CommandPalette, { COMMANDS } from "../CommandPalette";

expect.extend(toHaveNoViolations);

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// jsdom ships no scrollIntoView, and the palette scrolls the active option into
// view on every arrow-key move, so the browser method has to exist locally.
const originalScrollIntoView = Element.prototype.scrollIntoView;

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterAll(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

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

describe("CommandPalette shortcuts, filtering and dismissal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function openWithMeta(user: ReturnType<typeof userEvent.setup>) {
    await user.keyboard("{Meta>}k{/Meta}");
  }

  it("opens on Cmd+K", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openWithMeta(user);

    expect(
      screen.getByRole("dialog", { name: "Command palette" })
    ).toBeInTheDocument();
  });

  it("closes on a second Cmd+K because the shortcut toggles", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await openWithMeta(user);
    await openWithMeta(user);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("filters commands by label without regard to case", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard("{Control>}k{/Control}");
    // "guide" only ever appears in the Dispute Guide label, so this exercises
    // the label arm of the filter rather than the description arm.
    await user.type(
      screen.getByRole("combobox", { name: "Search commands" }),
      "GUIDE"
    );

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Dispute Guide");
  });

  it("also matches the command description, not just the label", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard("{Control>}k{/Control}");
    // "shipment" appears only in the Tracking description.
    await user.type(
      screen.getByRole("combobox", { name: "Search commands" }),
      "SHIPMENT"
    );

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Tracking");
  });

  it("clears the filter and the list back to every command when the search is emptied", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard("{Control>}k{/Control}");
    const searchInput = screen.getByRole("combobox", {
      name: "Search commands",
    });
    await user.type(searchInput, "profile");
    expect(screen.getAllByRole("option")).toHaveLength(1);

    await user.clear(searchInput);

    expect(screen.getAllByRole("option")).toHaveLength(COMMANDS.length);
  });

  it("pushes the selected command's route and closes when it is clicked", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard("{Control>}k{/Control}");
    await user.click(
      screen.getByRole("option", { name: /view your profile/i })
    );

    const profile = COMMANDS.find((command) => command.label === "Profile");
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith(profile?.route);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dismisses when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<CommandPalette />);

    await user.keyboard("{Control>}k{/Control}");
    const backdrop = container.firstChild as HTMLElement;
    expect(backdrop).toContainElement(screen.getByRole("dialog"));

    await user.click(backdrop);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays open when the click lands inside the dialog", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard("{Control>}k{/Control}");
    await user.click(screen.getByRole("dialog"));

    expect(
      screen.getByRole("dialog", { name: "Command palette" })
    ).toBeInTheDocument();
  });

  it("removes every keydown listener it registered once unmounted", async () => {
    const user = userEvent.setup();
    const added: unknown[] = [];
    const removed: unknown[] = [];
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = render(<CommandPalette />);
    await openWithMeta(user);

    addSpy.mock.calls
      .filter(([type]) => type === "keydown")
      .forEach(([, handler]) => added.push(handler));
    unmount();
    removeSpy.mock.calls
      .filter(([type]) => type === "keydown")
      .forEach(([, handler]) => removed.push(handler));

    addSpy.mockRestore();
    removeSpy.mockRestore();

    expect(added.length).toBeGreaterThan(0);
    expect(added.filter((handler) => !removed.includes(handler))).toEqual([]);
  });
});
