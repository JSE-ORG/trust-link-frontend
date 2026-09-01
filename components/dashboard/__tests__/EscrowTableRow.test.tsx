import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { Escrow } from "@/types";

import EscrowTableRow from "../EscrowTableRow";

const mockEscrow: Escrow = {
  id: "escrow-1",
  vendorId: "GVENDOR...",
  buyerId: "GBUYER...",
  item: "Test Product",
  amount: 100,
  status: "PENDING",
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
            onCancelEscrow={handleCancel}
            onMarkShipped={vi.fn()}
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

    const activeEscrow: Escrow = { ...mockEscrow, status: "FUNDED" };

    render(
      <table>
        <tbody>
          <EscrowTableRow
            escrow={activeEscrow}
            onCancelEscrow={handleCancel}
            onMarkShipped={vi.fn()}
          />
        </tbody>
      </table>
    );

    expect(screen.queryByRole("button", { name: /Cancel/i })).not.toBeInTheDocument();
  });
});
