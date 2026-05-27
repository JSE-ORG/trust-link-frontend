import { render, screen, fireEvent } from "@testing-library/react";
import { DisputeDetailsClient } from "./DisputeDetailsClient";
import { Dispute } from "@/types";
import { describe, it, expect, vi } from "vitest";

// Mock the router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock useWallet
vi.mock("@/components/providers/WalletProvider", () => ({
  useWallet: () => ({
    token: "mock-token",
  }),
}));

// Mock the API
vi.mock("@/lib/api", () => ({
  resolveDispute: vi.fn(),
}));

const mockDispute: Dispute = {
  id: "dispute-1",
  escrowId: "escrow-1",
  buyerId: "buyer-123",
  reason: "Item not as described",
  evidence: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  status: "OPEN",
  createdAt: "2023-10-01T12:00:00Z",
  updatedAt: "2023-10-01T12:00:00Z",
  escrow: {
    id: "escrow-1",
    vendorId: "vendor-456",
    buyerId: "buyer-123",
    amount: 100,
    item: "High-end Headphones",
    status: "DISPUTED",
    createdAt: "2023-09-25T10:00:00Z",
    updatedAt: "2023-10-01T12:00:00Z",
    history: [
      {
        id: "h1",
        escrowId: "escrow-1",
        status: "PENDING",
        timestamp: "2023-09-25T10:00:00Z",
        description: "Escrow created",
      },
      {
        id: "h2",
        escrowId: "escrow-1",
        status: "FUNDED",
        timestamp: "2023-09-25T10:05:00Z",
        description: "Funds deposited",
      },
      {
        id: "h3",
        escrowId: "escrow-1",
        status: "DISPUTED",
        timestamp: "2023-10-01T12:00:00Z",
        description: "Dispute raised by buyer",
      },
    ],
  },
};

describe("DisputeDetailsClient", () => {
  it("renders dispute details correctly", () => {
    render(<DisputeDetailsClient dispute={mockDispute} />);

    expect(screen.getByText("High-end Headphones")).toBeInTheDocument();
    expect(screen.getByText("100 USDC")).toBeInTheDocument();
    expect(screen.getByText("Item not as described")).toBeInTheDocument();
    expect(screen.getByText("View Attachment 1")).toBeInTheDocument();
    expect(screen.getByText("View Attachment 2")).toBeInTheDocument();
  });

  it("shows confirmation dialog when 'Release to Vendor' is clicked", () => {
    render(<DisputeDetailsClient dispute={mockDispute} />);

    fireEvent.click(screen.getByText("Release to Vendor"));

    expect(screen.getByText("Confirm Release")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to release the funds to the vendor/)).toBeInTheDocument();
  });

  it("shows confirmation dialog when 'Refund Buyer' is clicked", () => {
    render(<DisputeDetailsClient dispute={mockDispute} />);

    fireEvent.click(screen.getByText("Refund Buyer"));

    expect(screen.getByText("Confirm Refund")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to refund the buyer/)).toBeInTheDocument();
  });

  it("closes confirmation dialog when 'Cancel' is clicked", () => {
    render(<DisputeDetailsClient dispute={mockDispute} />);

    fireEvent.click(screen.getByText("Release to Vendor"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByText("Confirm Release")).not.toBeInTheDocument();
  });
});
