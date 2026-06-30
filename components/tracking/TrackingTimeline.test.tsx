import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TrackingTimeline from "./TrackingTimeline";
import { Escrow } from "@/types";

// Mock the API
vi.mock("@/lib/api", () => ({
  getEscrow: vi.fn(),
}));

vi.mock("@/hooks/useEscrow", () => ({
  useEscrow: vi.fn(),
}));

import { useEscrow } from "@/hooks/useEscrow";

const mockEscrow: Escrow = {
  id: "esc_123",
  vendorId: "vendor_1",
  buyerId: "buyer_1",
  amount: 150.0,
  item: "Wireless Headphones",
  status: "PENDING",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
};

describe("TrackingTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEscrow).mockReturnValue({
      escrow: mockEscrow,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it("renders loading state", () => {
    render(
      <TrackingTimeline
        escrowId="esc_123"
        initialEscrow={mockEscrow}
        loading={true}
      />
    );

    // Should show skeleton loaders
    const skeletons = screen.getAllByTestId(/skeleton/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders all 5 tracking stages", () => {
    render(
      <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
    );

    expect(screen.getByText("Order Placed")).toBeInTheDocument();
    expect(screen.getByText("Payment Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("Out for Delivery")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("highlights current stage for PENDING status", () => {
    render(
      <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
    );

    const orderPlaced = screen.getByText("Order Placed");
    expect(orderPlaced).toBeInTheDocument();
  });

  it("shows Confirm Delivery button when status is SHIPPED", () => {
    const shippedEscrow = { ...mockEscrow, status: "SHIPPED" as const };
    render(
      <TrackingTimeline escrowId="esc_123" initialEscrow={shippedEscrow} />
    );

    expect(screen.getByText("Confirm Delivery")).toBeInTheDocument();
  });

  it("shows Raise a Dispute button when status is SHIPPED", () => {
    const shippedEscrow = { ...mockEscrow, status: "SHIPPED" as const };
    render(
      <TrackingTimeline escrowId="esc_123" initialEscrow={shippedEscrow} />
    );

    expect(screen.getByText("Raise a Dispute")).toBeInTheDocument();
  });

  it("does not show action buttons when status is PENDING", () => {
    render(
      <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
    );

    expect(screen.queryByText("Confirm Delivery")).not.toBeInTheDocument();
    expect(screen.queryByText("Raise a Dispute")).not.toBeInTheDocument();
  });

  it("shows dispute status when order is disputed", () => {
    const disputedEscrow = { ...mockEscrow, status: "DISPUTED" as const };
    render(
      <TrackingTimeline escrowId="esc_123" initialEscrow={disputedEscrow} />
    );

    expect(screen.getByText("Dispute in Progress")).toBeInTheDocument();
  });

  it("highlights completed stages correctly for FUNDED status", () => {
    const fundedEscrow = { ...mockEscrow, status: "FUNDED" as const };
    render(
      <TrackingTimeline escrowId="esc_123" initialEscrow={fundedEscrow} />
    );

    // Order Placed should be completed, Payment Confirmed should be current
    expect(screen.getByText("Order Placed")).toBeInTheDocument();
    expect(screen.getByText("Payment Confirmed")).toBeInTheDocument();
  });

  it("highlights all stages as completed for COMPLETED status", () => {
    const completedEscrow = { ...mockEscrow, status: "COMPLETED" as const };
    render(
      <TrackingTimeline escrowId="esc_123" initialEscrow={completedEscrow} />
    );

    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("shows a user-friendly error state when fetching fails", () => {
    const refetch = vi.fn();
    vi.mocked(useEscrow).mockReturnValue({
      escrow: undefined,
      isLoading: false,
      error: new Error("Failed to fetch escrow"),
      refetch,
    });

    render(
      <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("We couldn't load tracking status")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch escrow")).toBeInTheDocument();
  });
});
