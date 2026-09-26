import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppNotification } from "@/types";

import NotificationsPageContent from "./NotificationsPageContent";

const {
  mockNotifications,
  mockMarkAsRead,
  mockMarkAllAsRead,
  mockState,
} = vi.hoisted(() => ({
  mockNotifications: [] as AppNotification[],
  mockMarkAsRead: vi.fn(),
  mockMarkAllAsRead: vi.fn(),
  mockState: { isLoading: false },
}));

vi.mock("@/components/providers/NotificationProvider", () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockNotifications.filter((n) => !n.read).length,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    isLoading: mockState.isLoading,
  }),
}));

function makeNotification(
  id: string,
  overrides: Partial<AppNotification> = {}
): AppNotification {
  return {
    id,
    escrowId: `escrow-${id}`,
    escrowItem: `Item ${id}`,
    type: "PENDING",
    message: `Message ${id}`,
    timestamp: new Date().toISOString(),
    read: false,
    ...overrides,
  };
}

describe("NotificationsPageContent", () => {
  beforeEach(() => {
    mockNotifications.length = 0;
    mockState.isLoading = false;
    window.localStorage.clear();
  });

  it("renders skeleton while checking JWT", () => {
    window.localStorage.setItem("wallet.jwt", "valid-token");
    render(<NotificationsPageContent />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to home when no JWT is present", async () => {
    const { useRouter } = await import("next/navigation");
    const mockPush = vi.fn();
    useRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      pathname: "/",
      query: {},
    });
    render(<NotificationsPageContent />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows empty state when there are no notifications", async () => {
    window.localStorage.setItem("wallet.jwt", "valid-token");
    render(<NotificationsPageContent />);
    await waitFor(() => {
      expect(screen.getByText("No notifications yet")).toBeInTheDocument();
    });
    expect(screen.getByText("Go to Dashboard")).toHaveAttribute(
      "href",
      "/dashboard"
    );
  });

  it("renders notification rows when notifications exist", async () => {
    window.localStorage.setItem("wallet.jwt", "valid-token");
    mockNotifications.push(
      makeNotification("n1", { escrowItem: "Widget A", message: "Shipped" }),
      makeNotification("n2", { escrowItem: "Widget B", message: "Funded" })
    );
    render(<NotificationsPageContent />);
    await waitFor(() => {
      expect(screen.getByText("Widget A")).toBeInTheDocument();
    });
    expect(screen.getByText("Widget B")).toBeInTheDocument();
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("Funded")).toBeInTheDocument();
  });

  it("filters notifications by search query", async () => {
    window.localStorage.setItem("wallet.jwt", "valid-token");
    mockNotifications.push(
      makeNotification("n1", { escrowItem: "Alpha Widget" }),
      makeNotification("n2", { escrowItem: "Beta Gadget" })
    );
    render(<NotificationsPageContent />);
    await waitFor(() => {
      expect(screen.getByText("Alpha Widget")).toBeInTheDocument();
    });

    const input = screen.getByTestId("notifications-search");
    fireEvent.change(input, { target: { value: "zzz_no_match" } });

    await waitFor(() => {
      expect(screen.getByText("No notifications match your search.")).toBeInTheDocument();
    });
  });

  it("shows no-match message when search yields no results", async () => {
    window.localStorage.setItem("wallet.jwt", "valid-token");
    mockNotifications.push(makeNotification("n1", { escrowItem: "Widget" }));
    render(<NotificationsPageContent />);
    await waitFor(() => {
      expect(screen.getByText("Widget")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("notifications-search"), {
      target: { value: "nonexistent" },
    });

    expect(
      screen.getByText("No notifications match your search.")
    ).toBeInTheDocument();
  });

  it("clears search when Clear search button is clicked", async () => {
    window.localStorage.setItem("wallet.jwt", "valid-token");
    mockNotifications.push(makeNotification("n1", { escrowItem: "Widget" }));
    render(<NotificationsPageContent />);
    await waitFor(() => {
      expect(screen.getByText("Widget")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("notifications-search"), {
      target: { value: "nonexistent" },
    });
    fireEvent.click(screen.getByText("Clear search"));

    expect(screen.getByText("Widget")).toBeInTheDocument();
  });

  it("calls markAsRead when a notification row is clicked", async () => {
    window.localStorage.setItem("wallet.jwt", "valid-token");
    mockNotifications.push(
      makeNotification("notif-1", { escrowItem: "Test Item" })
    );
    render(<NotificationsPageContent />);
    await waitFor(() => {
      expect(screen.getByText("Test Item")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Test Item"));
    expect(mockMarkAsRead).toHaveBeenCalledWith("notif-1");
  });

  it("shows mark-all-as-read button when there are unread notifications", async () => {
    window.localStorage.setItem("wallet.jwt", "valid-token");
    mockNotifications.push(makeNotification("n1"));
    render(<NotificationsPageContent />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /mark all as read/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /mark all as read/i }));
    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it("shows loading skeleton while notifications are loading", async () => {
    window.localStorage.setItem("wallet.jwt", "valid-token");
    mockState.isLoading = true;
    render(<NotificationsPageContent />);
    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });
});
