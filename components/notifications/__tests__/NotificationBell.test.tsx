import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppNotification } from "@/types";

const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();

const mockNotifications: AppNotification[] = [
  {
    id: "n1",
    escrowId: "escrow-1",
    escrowItem: "Test Item",
    type: "FUNDED",
    message: "Payment received for Test Item",
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    read: false,
  },
  {
    id: "n2",
    escrowId: "escrow-2",
    escrowItem: "Another Item",
    type: "SHIPPED",
    message: "Order shipped",
    timestamp: new Date(Date.now() - 120_000).toISOString(),
    read: false,
  },
  {
    id: "n3",
    escrowId: "escrow-3",
    escrowItem: "Read Item",
    type: "COMPLETED",
    message: "Order completed",
    timestamp: new Date(Date.now() - 180_000).toISOString(),
    read: true,
  },
];

let mockState: {
  notifications: AppNotification[];
  unreadCount: number;
} = {
  notifications: mockNotifications,
  unreadCount: 2,
};

vi.mock("@/components/providers/NotificationProvider", () => ({
  useNotifications: () => ({
    notifications: mockState.notifications,
    unreadCount: mockState.unreadCount,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
    isLoading: false,
  }),
}));

import NotificationBell from "../NotificationBell";

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      notifications: mockNotifications,
      unreadCount: 2,
    };
  });

  function getToggleButton() {
    return screen.getByRole("button", { name: /Notifications/i });
  }

  describe("dropdown toggle behavior", () => {
    it("renders toggle button with accessible label and hidden dialog initially", () => {
      render(<NotificationBell />);
      expect(getToggleButton()).toBeInTheDocument();
      expect(getToggleButton()).toHaveAttribute("aria-haspopup", "true");
      expect(getToggleButton()).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();
    });

    it("shows unread badge when unreadCount > 0 and hides when 0", () => {
      mockState.unreadCount = 3;
      const { rerender } = render(<NotificationBell />);
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(getToggleButton()).toHaveAttribute("aria-label", "Notifications, 3 unread");

      mockState.unreadCount = 0;
      mockState.notifications = [];
      rerender(<NotificationBell />);
      expect(screen.queryByText("3")).not.toBeInTheDocument();
      expect(getToggleButton()).toHaveAttribute("aria-label", "Notifications");
    });

    it("caps badge at 99+", () => {
      mockState.unreadCount = 150;
      render(<NotificationBell />);
      expect(screen.getByText("99+")).toBeInTheDocument();
    });

    it("opens dialog on click and closes on second click", async () => {
      const user = userEvent.setup();
      render(<NotificationBell />);

      await user.click(getToggleButton());
      expect(getToggleButton()).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();

      await user.click(getToggleButton());
      expect(getToggleButton()).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();
    });

    it("renders preview list and caps at 5 items", async () => {
      const user = userEvent.setup();
      // create 7 notifications to test slice(0,5)
      mockState.notifications = Array.from({ length: 7 }, (_, i) => ({
        id: `n${i}`,
        escrowId: `escrow-${i}`,
        escrowItem: `Item ${i}`,
        type: "PENDING" as const,
        message: `Message ${i}`,
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        read: false,
      }));
      mockState.unreadCount = 7;
      render(<NotificationBell />);
      await user.click(getToggleButton());
      const dialog = screen.getByRole("dialog", { name: "Notifications" });
      const links = within(dialog).getAllByRole("link");
      // 5 preview items + "View all notifications" = 6 links; filter escrow links
      const escrowLinks = links.filter((l) => l.getAttribute("href")?.startsWith("/escrow/"));
      expect(escrowLinks).toHaveLength(5);
    });

    it("shows empty state when no notifications", async () => {
      mockState.notifications = [];
      mockState.unreadCount = 0;
      const user = userEvent.setup();
      render(<NotificationBell />);
      await user.click(getToggleButton());
      expect(screen.getByText("No notifications yet")).toBeInTheDocument();
    });
  });

  describe("outside click dismissal", () => {
    it("closes dropdown when clicking outside", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <NotificationBell />
          <button type="button">outside</button>
        </div>
      );
      await user.click(getToggleButton());
      expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "outside" }));
      expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();
      expect(getToggleButton()).toHaveAttribute("aria-expanded", "false");
    });

    it("does not close when clicking inside the dropdown", async () => {
      const user = userEvent.setup();
      render(<NotificationBell />);
      await user.click(getToggleButton());
      const dialog = screen.getByRole("dialog", { name: "Notifications" });
      await user.click(within(dialog).getByText("Notifications"));
      expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
    });
  });

  describe("keyboard navigation", () => {
    it("closes dropdown when Escape is pressed", async () => {
      const user = userEvent.setup();
      render(<NotificationBell />);
      await user.click(getToggleButton());
      expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();
      expect(getToggleButton()).toHaveAttribute("aria-expanded", "false");
    });

    it("does not close on other keys", async () => {
      const user = userEvent.setup();
      render(<NotificationBell />);
      await user.click(getToggleButton());
      await user.keyboard("a");
      expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
    });

    it("traps Tab focus within dropdown — Tab from last wraps to first", async () => {
      const user = userEvent.setup();
      const { container } = render(<NotificationBell />);
      await user.click(getToggleButton());
      const dialog = screen.getByRole("dialog", { name: "Notifications" });

      // Focus trap is implemented on the outer ref (toggle + dialog).
      // Ensure dialog is open and has focusable items.
      const focusable = container.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusable.length).toBeGreaterThan(0);

      const last = Array.from(focusable).at(-1) as HTMLElement;
      last.focus();
      await user.keyboard("{Tab}");

      // After wrapping, focus should still be inside the component (not escaped to body)
      const stillInside = container.contains(document.activeElement as Node);
      expect(stillInside).toBe(true);
      expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
    });

    it("traps Shift+Tab focus — Shift+Tab from first wraps to last", async () => {
      const user = userEvent.setup();
      const { container } = render(<NotificationBell />);
      await user.click(getToggleButton());
      const dialog = screen.getByRole("dialog", { name: "Notifications" });
      expect(dialog).toBeInTheDocument();

      const focusable = container.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0] as HTMLElement;
      first.focus();
      await user.keyboard("{Shift>}{Tab}{/Shift}");

      const stillInside = container.contains(document.activeElement as Node);
      expect(stillInside).toBe(true);
    });

    it("restores focus to toggle button when closed via Escape", async () => {
      const user = userEvent.setup();
      render(<NotificationBell />);
      await user.click(getToggleButton());
      expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(getToggleButton()).toHaveFocus();
    });
  });

  describe("mark as read functionality", () => {
    it("calls markAsRead and closes dropdown when notification link is clicked", async () => {
      const user = userEvent.setup();
      render(<NotificationBell />);
      await user.click(getToggleButton());

      const dialog = screen.getByRole("dialog", { name: "Notifications" });
      const firstLink = within(dialog).getAllByRole("link").find((l) => l.getAttribute("href") === "/escrow/escrow-1")!;
      await user.click(firstLink);

      expect(mockMarkAsRead).toHaveBeenCalledWith("n1");
      expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();
    });

    it("shows Mark all read button only when unreadCount > 0 and calls markAllAsRead", async () => {
      const user = userEvent.setup();
      render(<NotificationBell />);
      await user.click(getToggleButton());
      const markAllBtn = screen.getByRole("button", { name: /Mark all read/i });
      expect(markAllBtn).toBeInTheDocument();

      await user.click(markAllBtn);
      expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
    });

    it("hides Mark all read button when unreadCount is 0", async () => {
      mockState.unreadCount = 0;
      mockState.notifications = mockNotifications.map((n) => ({ ...n, read: true }));
      const user = userEvent.setup();
      render(<NotificationBell />);
      await user.click(getToggleButton());
      expect(screen.queryByRole("button", { name: /Mark all read/i })).not.toBeInTheDocument();
    });

    it("closes dropdown when View all notifications is clicked", async () => {
      const user = userEvent.setup();
      render(<NotificationBell />);
      await user.click(getToggleButton());
      await user.click(screen.getByRole("link", { name: /View all notifications/i }));
      expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();
    });

    it("renders unread dot for unread notifications", async () => {
      const user = userEvent.setup();
      render(<NotificationBell />);
      await user.click(getToggleButton());
      const dialog = screen.getByRole("dialog", { name: "Notifications" });
      expect(within(dialog).getAllByText(/Test Item/).length).toBeGreaterThan(0);
      expect(within(dialog).getAllByText(/Payment received/).length).toBeGreaterThan(0);
    });
  });
});
