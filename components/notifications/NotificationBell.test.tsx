import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppNotification } from "@/types";

import NotificationBell from "./NotificationBell";

const { mockNotifications, mockMarkAsRead, mockMarkAllAsRead, mockState } = vi.hoisted(() => ({
  mockState: { isLoading: false, error: null as Error | null, hasLoaded: false, refetch: vi.fn().mockResolvedValue(undefined) },
  mockNotifications: [] as AppNotification[],
  mockMarkAsRead: vi.fn(),
  mockMarkAllAsRead: vi.fn(),
}));

vi.mock("@/components/providers/NotificationProvider", () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockNotifications.filter((n) => !n.read).length,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    ...mockState,
  }),
}));

function makeNotification(id: string, index: number): AppNotification {
  return {
    id,
    escrowId: `escrow-${index}`,
    escrowItem: `Item ${index}`,
    type: "PENDING",
    message: `Message ${index}`,
    timestamp: new Date(Date.now() - index * 60_000).toISOString(),
    read: false,
  };
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications.length = 0;
    mockState.error = null;
    mockState.isLoading = false;
    mockState.hasLoaded = false;
  });

  it("distinguishes an initial failure from an empty preview and offers retry", () => {
    mockState.error = new Error("Offline");
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByText(/Couldn't load notifications/)).toBeInTheDocument();
    expect(screen.queryByText("No notifications yet")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mockState.refetch).toHaveBeenCalledOnce();
  });

  it("keeps stale preview entries visible during a failed refresh", () => {
    mockNotifications.push(makeNotification("saved", 0));
    mockState.error = new Error("Offline");
    mockState.hasLoaded = true;
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByText(/Showing the last successfully loaded feed/)).toBeInTheDocument();
    expect(screen.getByText("Message 0")).toBeInTheDocument();
  });

  it("renders the preview list without React duplicate-key warnings when ids repeat", () => {
    // Two notifications share the same `id`. The preview list must stay
    // warning-free thanks to the composite `${id}-${index}` key fallback.
    mockNotifications.push(
      makeNotification("duplicate-id", 0),
      makeNotification("duplicate-id", 1),
      makeNotification("unique-id", 2)
    );

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText(/Item /)).toHaveLength(3);
    expect(screen.getByText("Message 0")).toBeInTheDocument();
    expect(screen.getByText("Message 1")).toBeInTheDocument();

    const keyWarnings = consoleError.mock.calls.filter((call) =>
      String(call[0]).toLowerCase().includes("key")
    );
    expect(keyWarnings).toHaveLength(0);

    consoleError.mockRestore();
  });

  it("links to order tracking, marks read once, and closes the preview", () => {
    mockNotifications.push(makeNotification("notif-1", 0));

    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    const link = screen.getByRole("link", { name: /Item 0/i });
    expect(link).toHaveAttribute("href", "/track/escrow-0");
    fireEvent.click(link);
    expect(mockMarkAsRead).toHaveBeenCalledTimes(1);
    expect(mockMarkAsRead).toHaveBeenCalledWith("notif-1");
    expect(mockMarkAllAsRead).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("focus management and trigger ref", () => {
    it("moves focus to a meaningful dropdown control on open", () => {
      mockNotifications.push(makeNotification("notif-1", 0));
      render(<NotificationBell />);
      const toggle = screen.getByRole("button", { name: /notifications/i });
      fireEvent.click(toggle);

      const markAllBtn = screen.getByRole("button", { name: /mark all read/i });
      expect(markAllBtn).toHaveFocus();
    });

    it("restores focus to actual bell trigger button on Escape", () => {
      mockNotifications.push(makeNotification("notif-1", 0));
      render(<NotificationBell />);
      const toggle = screen.getByRole("button", { name: /notifications/i });
      fireEvent.click(toggle);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(toggle).toHaveFocus();
    });

    it("restores focus to trigger button when dismissed by outside click with focus inside dropdown", () => {
      mockNotifications.push(makeNotification("notif-1", 0));
      render(
        <div>
          <button data-testid="outside-button">Outside</button>
          <NotificationBell />
        </div>
      );
      const toggle = screen.getByRole("button", { name: /notifications/i });
      fireEvent.click(toggle);

      const markAllBtn = screen.getByRole("button", { name: /mark all read/i });
      markAllBtn.focus();
      expect(markAllBtn).toHaveFocus();

      fireEvent.mouseDown(screen.getByTestId("outside-button"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(toggle).toHaveFocus();
    });
  });
});
