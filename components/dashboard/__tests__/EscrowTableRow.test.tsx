import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import EscrowTableRow from "../EscrowTableRow";

const mockEscrow = {
  id: "escrow-1",
  vendorId: "v1",
  item: "Test Product",
  buyerId: "GBUYER...",
  amount: 100,
  item: "Test Product",
  status: "PENDING" as const,
  createdAt: "2026-05-01",
  updatedAt: "2026-05-01",
  history: [],
};

describe("EscrowTableRow", () => {
  it("renders cancel button for PENDING escrows and handles click", () => {
    const handleCancel = vi.fn();

    render(
      <table>
        <tbody>
          <EscrowTableRow
            escrow={mockEscrow}
            onMarkShipped={vi.fn()}
            onCancelEscrow={handleCancel}
            onMarkShipped={handleCopy}
          />
        </tbody>
      </table>
    );

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(handleCancel).toHaveBeenCalledWith(mockEscrow);
  });

  it("does not render cancel button for non-PENDING escrows", () => {
    const handleCancel = vi.fn();

    const activeEscrow = { ...mockEscrow, status: "FUNDED" as const };

    render(
      <table>
        <tbody>
          <EscrowTableRow
            escrow={activeEscrow}
            onMarkShipped={vi.fn()}
            onCancelEscrow={handleCancel}
            onMarkShipped={handleCopy}
          />
        </tbody>
      </table>
    );

    expect(screen.queryByRole("button", { name: /Cancel/i })).not.toBeInTheDocument();
  });
});
