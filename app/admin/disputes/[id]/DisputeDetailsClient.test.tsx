import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, getDispute, resolveDispute } from "@/lib/api";
import { type Dispute,DisputeStatusConst, EscrowStatusConst } from "@/types";

import { DisputeDetailsClient } from "./DisputeDetailsClient";

// Mock the router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const wallet = vi.hoisted(() => ({
  token: "mock-token" as string | null,
  connect: vi.fn(),
}));

// Mock useWallet
vi.mock("@/hooks/useWallet", () => ({
  default: () => wallet,
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getDispute: vi.fn(),
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
    wallet.token = "mock-token";
    vi.mocked(getDispute).mockResolvedValue(mockDispute);
  });

  async function renderDetails() {
    render(<DisputeDetailsClient disputeId="dispute-1" />);
    await screen.findByText("Item not as described");
  }

  it("loads dispute details using the active wallet token", async () => {
    await renderDetails();

    expect(getDispute).toHaveBeenCalledWith("dispute-1", "mock-token");
    expect(screen.getByText("High-end Headphones")).toBeInTheDocument();
    expect(screen.getByText("100.00 USDC")).toBeInTheDocument();
    expect(screen.getByText("Item not as described")).toBeInTheDocument();
    expect(screen.getByText("View Attachment 1")).toBeInTheDocument();
    expect(screen.getByText("View Attachment 2")).toBeInTheDocument();
  });

  it("shows wallet guidance without exposing dispute details when disconnected", () => {
    wallet.token = null;
    render(<DisputeDetailsClient disputeId="dispute-1" />);

    expect(screen.getByText("Connect your wallet to view this dispute.")).toBeInTheDocument();
    expect(screen.queryByText("Item not as described")).not.toBeInTheDocument();
    expect(getDispute).not.toHaveBeenCalled();
  });

  it.each([
    [401, "Session expired"],
    [403, "Access denied"],
    [404, "Dispute not found"],
  ])("shows a distinct state for HTTP %i", async (status, heading) => {
    vi.mocked(getDispute).mockRejectedValueOnce(new ApiError(status, "private response"));
    render(<DisputeDetailsClient disputeId="dispute-1" />);

    expect(await screen.findByText(heading)).toBeInTheDocument();
    expect(screen.queryByText("private response")).not.toBeInTheDocument();
    expect(screen.queryByText("Item not as described")).not.toBeInTheDocument();
  });

  it("offers retry for service failures without showing case text", async () => {
    vi.mocked(getDispute).mockRejectedValueOnce(new ApiError(503, "private response"));
    render(<DisputeDetailsClient disputeId="dispute-1" />);

    expect(await screen.findByText("We couldn't load dispute details")).toBeInTheDocument();
    expect(screen.queryByText("private response")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Item not as described");
    expect(getDispute).toHaveBeenCalledTimes(2);
  });

  it("shows confirmation dialog when 'Release to Vendor' is clicked", async () => {
    await renderDetails();

    fireEvent.click(screen.getByText("Release to Vendor"));

    expect(screen.getByText("Confirm Release")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to release the funds to the vendor/)).toBeInTheDocument();
  });

  it("shows confirmation dialog when 'Refund Buyer' is clicked", async () => {
    await renderDetails();

    fireEvent.click(screen.getByText("Refund Buyer"));

    expect(screen.getByText("Confirm Refund")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to refund the buyer/)).toBeInTheDocument();
  });

  it("closes confirmation dialog when 'Cancel' is clicked", async () => {
    await renderDetails();

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

    await renderDetails();

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

    await renderDetails();

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

  it("announces named confirmation dialog and action description with safe initial focus on Cancel", async () => {
    await renderDetails();

    const releaseButton = screen.getByRole("button", { name: "Release to Vendor" });
    releaseButton.focus();
    fireEvent.click(releaseButton);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const heading = screen.getByRole("heading", { name: "Confirm Release" });
    expect(dialog).toHaveAttribute("aria-labelledby", heading.id);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    expect(cancelButton).toBeInTheDocument();
  });

  it("Escape key closes confirmation dialog and restores focus to the triggering action button", async () => {
    await renderDetails();

    const refundButton = screen.getByRole("button", { name: "Refund Buyer" });
    refundButton.focus();
    expect(document.activeElement).toBe(refundButton);

    fireEvent.click(refundButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(document.activeElement).toBe(refundButton);
    });
  });

  it("prevents repeated submission while pending", async () => {
    let settleRequest!: () => void;
    vi.mocked(resolveDispute).mockReturnValue(
      new Promise((resolve) => {
        settleRequest = () => resolve({ ...mockDispute, status: "RESOLVED" });
      })
    );

    await renderDetails();

    fireEvent.click(screen.getByText("Release to Vendor"));
    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    fireEvent.click(confirmButton);

    // Dialog closes and submission is in-flight
    expect(resolveDispute).toHaveBeenCalledTimes(1);

    // Attempting resolution while already resolving must be ignored
    expect(screen.getByRole("button", { name: /release to vendor/i })).toBeDisabled();

    await act(async () => {
      settleRequest();
    });
  });
});
