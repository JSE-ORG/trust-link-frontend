import { fireEvent,render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { shipEscrow } from "@/lib/api";

import ShipTrackingModal from "../ShipTrackingModal";

vi.mock("@/lib/api", () => ({
  shipEscrow: vi.fn(),
}));

const defaultProps = {
  escrowId: "escrow-123",
  vendorName: "Test Vendor",
  open: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

describe("ShipTrackingModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when open is false", () => {
    const { container } = render(
      <ShipTrackingModal {...defaultProps} open={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the modal when open is true", () => {
    render(<ShipTrackingModal {...defaultProps} />);
    expect(screen.getByText(/mark shipment as shipped/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tracking id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/logistics carrier/i)).toBeInTheDocument();
  });

  it("displays the vendor name in the description", () => {
    render(<ShipTrackingModal {...defaultProps} />);
    expect(screen.getByText(/test vendor/i)).toBeInTheDocument();
  });

  it("shows error when tracking ID is empty", async () => {
    const user = userEvent.setup();
    render(<ShipTrackingModal {...defaultProps} />);

    // Remove required attribute so the form can submit for JS validation to run
    const input = screen.getByLabelText(/tracking id/i);
    input.removeAttribute("required");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(screen.getByText(/tracking id is required/i)).toBeInTheDocument();
  });

  it("shows error when tracking ID exceeds 64 characters", async () => {
    render(<ShipTrackingModal {...defaultProps} />);

    // Remove maxLength so we can set a value longer than 64 characters
    const input = screen.getByLabelText(/tracking id/i);
    input.removeAttribute("maxlength");

    // Use fireEvent to bypass maxLength constraint
    fireEvent.change(input, {
      target: { value: "A".repeat(65) },
    });

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(
      screen.getByText(/tracking id must be 64 characters or less/i)
    ).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ShipTrackingModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close (✕) button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ShipTrackingModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByLabelText(/close modal/i));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("submits successfully and calls onSuccess and onClose", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    vi.mocked(shipEscrow).mockResolvedValueOnce({} as never);

    render(
      <ShipTrackingModal
        {...defaultProps}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    );

    await user.type(screen.getByLabelText(/tracking id/i), "TRACK-001");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith("escrow-123");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("sends correct payload to the ship endpoint", async () => {
    const user = userEvent.setup();
    vi.mocked(shipEscrow).mockResolvedValueOnce({} as never);

    render(<ShipTrackingModal {...defaultProps} />);

    await user.type(screen.getByLabelText(/tracking id/i), "TRACK-999");
    await user.selectOptions(
      screen.getByLabelText(/logistics carrier/i),
      "GIGL"
    );
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(shipEscrow).toHaveBeenCalledWith("escrow-123", {
        trackingId: "TRACK-999",
        carrier: "GIGL",
      });
    });
  });

  it("displays error message when the API call fails", async () => {
    const user = userEvent.setup();

    vi.mocked(shipEscrow).mockRejectedValueOnce(new Error("Escrow not found"));

    render(<ShipTrackingModal {...defaultProps} />);

    await user.type(screen.getByLabelText(/tracking id/i), "TRACK-001");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/escrow not found/i)).toBeInTheDocument();
    });
  });

  it("displays generic error when API returns non-JSON response", async () => {
    const user = userEvent.setup();

    vi.mocked(shipEscrow).mockRejectedValueOnce(new Error("invalid json"));

    render(<ShipTrackingModal {...defaultProps} />);

    await user.type(screen.getByLabelText(/tracking id/i), "TRACK-001");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/invalid json/i)
      ).toBeInTheDocument();
    });
  });

  it("disables submit button while submitting", async () => {
    const user = userEvent.setup();

    // Slow response to keep submitting state visible
    vi.mocked(shipEscrow).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({} as never), 500)
        )
    );

    render(<ShipTrackingModal {...defaultProps} />);

    await user.type(screen.getByLabelText(/tracking id/i), "TRACK-001");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    const submitBtn = screen.getByRole("button", { name: /submitting/i });
    expect(submitBtn).toBeDisabled();
  });

  it("clears error when a subsequent submission succeeds", async () => {
    const user = userEvent.setup();

    // First call fails
    vi.mocked(shipEscrow).mockRejectedValueOnce(new Error("Server error"));

    render(<ShipTrackingModal {...defaultProps} />);

    await user.type(screen.getByLabelText(/tracking id/i), "TRACK-001");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });

    // Second call succeeds
    vi.mocked(shipEscrow).mockResolvedValueOnce({} as never);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.queryByText(/server error/i)).not.toBeInTheDocument();
    });
  });

  it("defaults carrier to Terminal Africa", () => {
    render(<ShipTrackingModal {...defaultProps} />);
    expect(screen.getByLabelText(/logistics carrier/i)).toHaveValue(
      "Terminal Africa"
    );
  });

  it("trims whitespace from tracking ID before validation", async () => {
    const user = userEvent.setup();
    render(<ShipTrackingModal {...defaultProps} />);

    // Type only spaces
    await user.type(screen.getByLabelText(/tracking id/i), "   ");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(screen.getByText(/tracking id is required/i)).toBeInTheDocument();
  });
});
