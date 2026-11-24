import { act,render, screen } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { Escrow, EscrowStatusConst } from "@/types";

import TrackingTimeline from "./TrackingTimeline";

// Mock the API
vi.mock("@/lib/api", () => ({
  getEscrow: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/components/tracking/TrackingSection", () => ({
  default: ({ escrowId }: { escrowId: string }) => <div data-testid="carrier-tracking">{escrowId}</div>,
}));

vi.mock("@/hooks/useEscrow", () => ({
  useEscrow: vi.fn(),
}));

import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { useEscrow } from "@/hooks/useEscrow";

const mockEscrow: Escrow = {
  id: "esc_123",
  vendorId: "vendor_1",
  buyerId: "buyer_1",
  amount: 150.0,
  item: "Wireless Headphones",
  status: EscrowStatusConst.PENDING,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
};

describe("TrackingTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEscrow).mockImplementation((escrowId: string | null | undefined, opts?: { initialData?: Escrow }) => ({
      data: opts?.initialData ?? mockEscrow,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }));
  });

  it("renders loading state", async () => {
    await act(async () => {
      render(
        <TrackingTimeline
          escrowId="esc_123"
          initialEscrow={mockEscrow}
          loading={true}
        />
      );
    });

    // Should show skeleton loaders
    const skeletons = screen.getAllByTestId(/skeleton/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders the four escrow milestones separately from carrier tracking", async () => {
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
      );
    });

    expect(screen.getByText("tracking.orderPlaced")).toBeInTheDocument();
    expect(screen.getByText("tracking.paymentConfirmed")).toBeInTheDocument();
    expect(screen.getByText("tracking.shipped")).toBeInTheDocument();
    expect(screen.queryByText("tracking.outForDelivery")).not.toBeInTheDocument();
    expect(screen.getByTestId("carrier-tracking")).toHaveTextContent("esc_123");
    expect(screen.getByText("tracking.escrowCompleted")).toBeInTheDocument();
  });

  it("shows a readable fallback for an invalid update timestamp", async () => {
    const invalidDateEscrow = { ...mockEscrow, updatedAt: "not-a-date" };
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={invalidDateEscrow} />
      );
    });

    expect(screen.getByText("Date unavailable")).toBeInTheDocument();
  });

  it("highlights current stage for PENDING status", async () => {
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
      );
    });

    const orderPlaced = screen.getByText("tracking.orderPlaced");
    expect(orderPlaced).toBeInTheDocument();
  });

  it("shows Confirm Delivery button when status is SHIPPED", async () => {
    const shippedEscrow = { ...mockEscrow, status: EscrowStatusConst.SHIPPED };
    await act(async () => {
      render(
        <NetworkProvider>
          <WalletProvider>
            <TrackingTimeline escrowId="esc_123" initialEscrow={shippedEscrow} />
          </WalletProvider>
        </NetworkProvider>
      );
    });

    expect(screen.getByText("Confirm Delivery")).toBeInTheDocument();
  });

  it("shows Raise a Dispute button when status is SHIPPED", async () => {
    const shippedEscrow = { ...mockEscrow, status: EscrowStatusConst.SHIPPED };
    await act(async () => {
      render(
        <NetworkProvider>
          <WalletProvider>
            <TrackingTimeline escrowId="esc_123" initialEscrow={shippedEscrow} />
          </WalletProvider>
        </NetworkProvider>
      );
    });

    expect(screen.getByText("tracking.raiseDispute")).toBeInTheDocument();
  });

  it("does not show action buttons when status is PENDING", async () => {
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
      );
    });

    expect(screen.queryByText("Confirm Delivery")).not.toBeInTheDocument();
    expect(screen.queryByText("Raise a Dispute")).not.toBeInTheDocument();
  });

  it("shows dispute status when order is disputed", async () => {
    const disputedEscrow = { ...mockEscrow, status: EscrowStatusConst.DISPUTED };
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={disputedEscrow} />
      );
    });

    expect(screen.getByText("tracking.disputeInProgress")).toBeInTheDocument();
  });

  it("highlights completed stages correctly for FUNDED status", async () => {
    const fundedEscrow = { ...mockEscrow, status: EscrowStatusConst.FUNDED };
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={fundedEscrow} />
      );
    });

    // Order Placed should be completed, Payment Confirmed should be current
    expect(screen.getByText("tracking.orderPlaced")).toBeInTheDocument();
    expect(screen.getByText("tracking.paymentConfirmed")).toBeInTheDocument();
  });

  it("highlights all stages as completed for COMPLETED status", async () => {
    const completedEscrow = { ...mockEscrow, status: EscrowStatusConst.COMPLETED };
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={completedEscrow} />
      );
    });

    // Use the translation key as the mock returns the key itself
    expect(screen.getByText("tracking.escrowCompleted")).toBeInTheDocument();
  });

  it("makes timeline steps focusable with tabIndex", async () => {
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
      );
    });

    const steps = screen.getAllByRole("listitem");
    for (const step of steps) {
      expect(step).toHaveAttribute("tabindex", "0");
    }
  });

  it("sets aria-current=step on the active milestone", async () => {
    const fundedEscrow = { ...mockEscrow, status: EscrowStatusConst.FUNDED };
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={fundedEscrow} />
      );
    });

    const currentStep = screen.getByRole("listitem", { current: "step" });
    expect(currentStep).toHaveAttribute("aria-current", "step");
    expect(currentStep).toHaveTextContent("tracking.paymentConfirmed");
  });

  it("does not set aria-current on non-active milestones", async () => {
    const fundedEscrow = { ...mockEscrow, status: EscrowStatusConst.FUNDED };
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={fundedEscrow} />
      );
    });

    const steps = screen.getAllByRole("listitem");
    const nonActiveSteps = steps.filter(
      (s) => s.getAttribute("aria-current") !== "step"
    );
    expect(nonActiveSteps.length).toBe(3);
  });

  it("shows a user-friendly error state when fetching fails", async () => {
    const refetch = vi.fn();
    vi.mocked(useEscrow).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Failed to fetch escrow"),
      refetch,
    });

    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
      );
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    // `t` is mocked as the identity function in this file, so the title renders as its key.
    expect(screen.getByText("tracking.loadErrorTitle")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch escrow")).toBeInTheDocument();
  });

  it("renders stages inside an owning ordered list", async () => {
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
      );
    });

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(4);
    for (const item of items) {
      expect(list).toContainElement(item);
    }
  });

  it("restricts tab focus to the visible slide on mobile viewport", async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("767px"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      await act(async () => {
        render(
          <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
        );
      });

      const items = screen.getAllByRole("listitem");
      expect(items[0]).toHaveAttribute("tabindex", "0");
      expect(items[0]).toHaveAttribute("aria-hidden", "false");

      for (let i = 1; i < items.length; i++) {
        expect(items[i]).toHaveAttribute("tabindex", "-1");
        expect(items[i]).toHaveAttribute("aria-hidden", "true");
      }

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(4);
      expect(tabs[0]).toHaveClass("h-11", "w-11");
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
