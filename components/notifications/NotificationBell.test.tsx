import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppNotification } from "@/types";

import NotificationBell from "./NotificationBell";

const { mockNotifications, mockMarkAsRead, mockMarkAllAsRead } = vi.hoisted(() => ({
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
    isLoading: false,
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

  it("marks a notification as read when its link is clicked", () => {
    mockNotifications.push(makeNotification("notif-1", 0));

    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    fireEvent.click(screen.getByRole("link", { name: /Item 0/i }));
    expect(mockMarkAsRead).toHaveBeenCalledWith("notif-1");
    expect(mockMarkAllAsRead).not.toHaveBeenCalled();
  });
});
