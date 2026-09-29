import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Escrow, EscrowStatusConst } from "@/types";

import TrackPage from "./page";

// Mock the API
vi.mock("@/lib/api", () => ({
  getEscrow: vi.fn(),
}));

// Mock the TrackingTimeline component
vi.mock("@/components/tracking/TrackingTimeline", () => ({
  default: ({ escrowId }: { escrowId: string }) => (
    <div data-testid="tracking-timeline">
      Tracking Timeline for {escrowId}
    </div>
  ),
}));

// Mock ErrorBoundary
vi.mock("@/components/layout/ErrorBoundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

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

describe("TrackPage", () => {
  it("renders the track page with order details", async () => {
    const { getEscrow } = await import("@/lib/api");
    vi.mocked(getEscrow).mockResolvedValue(mockEscrow);

    const params = Promise.resolve({ escrowId: "esc_123" });
    const page = await TrackPage({ params });
    
    render(page);

    expect(screen.getByText("Track Your Order")).toBeInTheDocument();
    expect(screen.getByText(/Order ID:/)).toBeInTheDocument();
    expect(screen.getByText("esc_123")).toBeInTheDocument();
  });

  it("displays order details correctly", async () => {
    const { getEscrow } = await import("@/lib/api");
    vi.mocked(getEscrow).mockResolvedValue(mockEscrow);

    const params = Promise.resolve({ escrowId: "esc_123" });
    const page = await TrackPage({ params });
    
    render(page);

    expect(screen.getByText("Order Details")).toBeInTheDocument();
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText("150.00 USDC")).toBeInTheDocument();
    expect(screen.getByText(EscrowStatusConst.PENDING)).toBeInTheDocument();
  });

  it("renders tracking timeline component", async () => {
    const { getEscrow } = await import("@/lib/api");
    vi.mocked(getEscrow).mockResolvedValue(mockEscrow);

    const params = Promise.resolve({ escrowId: "esc_123" });
    const page = await TrackPage({ params });
    
    render(page);

    expect(screen.getByTestId("tracking-timeline")).toBeInTheDocument();
  });

  it("shows error message when escrow is not found", async () => {
    const { getEscrow } = await import("@/lib/api");
    vi.mocked(getEscrow).mockRejectedValue(new Error("Not found"));

    const params = Promise.resolve({ escrowId: "invalid_id" });
    const page = await TrackPage({ params });
    
    render(page);

    expect(screen.getByText("Order Not Found")).toBeInTheDocument();
    expect(screen.getByText(/We couldn't find an order with ID:/)).toBeInTheDocument();
  });
});
