import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Escrow } from "@/types";

// Mock the API so the list renders deterministic escrows with known dates.
const getVendorEscrows = vi.fn();
vi.mock("@/lib/api", () => ({
  getVendorEscrows: (token?: string) => getVendorEscrows(token),
}));

// Stub the heavy PDF/CSV-export child so the test stays focused on filtering.
vi.mock("@/components/dashboard/TransactionHistoryExport", () => ({
  default: () => null,
}));

vi.mock("@/utils/exportCsv", () => ({ downloadCsv: vi.fn() }));

import VendorDashboardList from "../VendorDashboardList";

function escrow(id: string, item: string, createdAt: string): Escrow {
  return {
    id,
    vendorId: "vendor-1",
    buyerId: "buyer-1",
    amount: 100,
    item,
    status: "FUNDED",
    createdAt,
    updatedAt: createdAt,
    history: [],
  };
}

const ESCROWS: Escrow[] = [
  escrow("e1", "January Item", "2026-01-15T10:00:00Z"),
  escrow("e2", "March Item", "2026-03-20T10:00:00Z"),
  escrow("e3", "June Item", "2026-06-10T10:00:00Z"),
];

describe("VendorDashboardList — date range filter (issue #72)", () => {
  beforeEach(() => {
    getVendorEscrows.mockReset();
    getVendorEscrows.mockResolvedValue(ESCROWS);
    window.localStorage.clear();
  });

  it("shows all escrows when no date range is selected", async () => {
    render(<VendorDashboardList />);
    await waitFor(() => expect(screen.getByText("January Item")).toBeInTheDocument());
    expect(screen.getByText("March Item")).toBeInTheDocument();
    expect(screen.getByText("June Item")).toBeInTheDocument();
  });

  it("filters out escrows created before the From date", async () => {
    render(<VendorDashboardList />);
    await waitFor(() => expect(screen.getByText("January Item")).toBeInTheDocument());

    const fromInput = screen.getByLabelText("From");
    await userEvent.clear(fromInput);
    await userEvent.type(fromInput, "2026-03-01");

    await waitFor(() =>
      expect(screen.queryByText("January Item")).not.toBeInTheDocument()
    );
    expect(screen.getByText("March Item")).toBeInTheDocument();
    expect(screen.getByText("June Item")).toBeInTheDocument();
  });

  it("filters out escrows created after the To date", async () => {
    render(<VendorDashboardList />);
    await waitFor(() => expect(screen.getByText("June Item")).toBeInTheDocument());

    const toInput = screen.getByLabelText("To");
    await userEvent.type(toInput, "2026-04-01");

    await waitFor(() =>
      expect(screen.queryByText("June Item")).not.toBeInTheDocument()
    );
    expect(screen.getByText("January Item")).toBeInTheDocument();
    expect(screen.getByText("March Item")).toBeInTheDocument();
  });

  it("applies both bounds to produce an inclusive window", async () => {
    render(<VendorDashboardList />);
    await waitFor(() => expect(screen.getByText("March Item")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("From"), "2026-02-01");
    await userEvent.type(screen.getByLabelText("To"), "2026-04-01");

    await waitFor(() =>
      expect(screen.queryByText("January Item")).not.toBeInTheDocument()
    );
    expect(screen.queryByText("June Item")).not.toBeInTheDocument();
    expect(screen.getByText("March Item")).toBeInTheDocument();
  });

  it("shows an empty-range message when no escrows match", async () => {
    render(<VendorDashboardList />);
    await waitFor(() => expect(screen.getByText("March Item")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("From"), "2030-01-01");

    await waitFor(() =>
      expect(
        screen.getByText(/no escrows match the selected date range/i)
      ).toBeInTheDocument()
    );
  });

  it("restores the full list when the filter is cleared", async () => {
    render(<VendorDashboardList />);
    await waitFor(() => expect(screen.getByText("January Item")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("From"), "2026-06-01");
    await waitFor(() =>
      expect(screen.queryByText("January Item")).not.toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(screen.getByText("January Item")).toBeInTheDocument());
    expect(screen.getByText("March Item")).toBeInTheDocument();
    expect(screen.getByText("June Item")).toBeInTheDocument();
  });
});
