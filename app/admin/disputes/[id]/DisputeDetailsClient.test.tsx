import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveDispute } from "@/lib/api";
import { type Dispute,DisputeStatusConst, EscrowStatusConst } from "@/types";

import { DisputeDetailsClient } from "./DisputeDetailsClient";

// Mock the router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock useWallet
vi.mock("@/hooks/useWallet", () => ({
  default: () => ({
    token: "mock-token",
  }),
}));

// Mock the API
vi.mock("@/lib/api", () => ({
  resolveDispute: vi.fn(),
}));

// Mock the toast library used for rollback feedback
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockDispute: Dispute = {
  id: "dispute-1",
  escrowId: "escrow-1",
  buyerId: "buyer-123",
  reason: "Item not as described",
  evidence: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  status: DisputeStatusConst.OPEN,
  createdAt: "2023-10-01T12:00:00Z",
  updatedAt: "2023-10-01T12:00:00Z",
  escrow: {
    id: "escrow-1",
    vendorId: "vendor-456",
    buyerId: "buyer-123",
    amount: 100,
    item: "High-end Headphones",
    status: EscrowStatusConst.DISPUTED,
    createdAt: "2023-09-25T10:00:00Z",
    updatedAt: "2023-10-01T12:00:00Z",
    history: [
      {
        id: "h1",
        escrowId: "escrow-1",
        status: EscrowStatusConst.PENDING,
        timestamp: "2023-09-25T10:00:00Z",
        description: "Escrow created",
      },
      {
        id: "h2",
        escrowId: "escrow-1",
        status: EscrowStatusConst.FUNDED,
        timestamp: "2023-09-25T10:05:00Z",
        description: "Funds deposited",
      },
      {
        id: "h3",
        escrowId: "escrow-1",
        status: EscrowStatusConst.DISPUTED,
        timestamp: "2023-10-01T12:00:00Z",
        description: "Dispute raised by buyer",
      },
    ],
  },
};

describe("DisputeDetailsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dispute details correctly", () => {
    render(<DisputeDetailsClient dispute={mockDispute} />);

    expect(screen.getByText("High-end Headphones")).toBeInTheDocument();
    expect(screen.getByText("100.00 USDC")).toBeInTheDocument();
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

  it("optimistically marks the dispute resolved before the API call settles", async () => {
    let settleRequest!: () => void;
    vi.mocked(resolveDispute).mockReturnValueOnce(
      new Promise((resolve) => {
        settleRequest = () => resolve({ ...mockDispute, status: "RESOLVED" });
      })
    );

    render(<DisputeDetailsClient dispute={mockDispute} />);

    expect(screen.getByTestId("dispute-status-badge")).toHaveTextContent("OPEN");
    expect(screen.getByTestId("escrow-status-badge")).toHaveTextContent("DISPUTED");

    fireEvent.click(screen.getByText("Release to Vendor"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    // Badges flip and the dialog closes immediately — the request is still in flight.
    expect(screen.getByTestId("dispute-status-badge")).toHaveTextContent("RESOLVED");
    expect(screen.getByTestId("escrow-status-badge")).toHaveTextContent("RELEASED");
    expect(screen.queryByText("Confirm Release")).not.toBeInTheDocument();
    expect(screen.getByText(/confirming resolution/i)).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();

    await act(async () => {
      settleRequest();
    });

    expect(screen.getByTestId("dispute-status-badge")).toHaveTextContent("RESOLVED");
  });

  it("rolls back the optimistic update and shows a toast when the API fails", async () => {
    vi.mocked(resolveDispute).mockRejectedValueOnce(new Error("Network unreachable"));

    render(<DisputeDetailsClient dispute={mockDispute} />);

    fireEvent.click(screen.getByText("Refund Buyer"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByTestId("dispute-status-badge")).toHaveTextContent("RESOLVED");
    expect(screen.getByTestId("escrow-status-badge")).toHaveTextContent("REFUNDED");

    await waitFor(() => {
      expect(screen.getByTestId("dispute-status-badge")).toHaveTextContent("OPEN");
    });
    expect(screen.getByTestId("escrow-status-badge")).toHaveTextContent("DISPUTED");
    expect(toast.error).toHaveBeenCalledWith("Network unreachable");

    // Rolled back state re-enables the resolution actions.
    expect(screen.getByRole("button", { name: /release to vendor/i })).toBeEnabled();
  });
});
