import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Escrow } from "@/types";
import { EscrowStatusConst } from "@/types";

const getVendorEscrows = vi.fn();
vi.mock("@/lib/api", () => ({
  getVendorEscrows: (token?: string) => getVendorEscrows(token),
}));

// Stub the heavy PDF/CSV-export child so the test stays focused on bulk selection.
vi.mock("@/components/dashboard/TransactionHistoryExport", () => ({
  default: () => null,
}));

const downloadCsv = vi.fn();
vi.mock("@/utils/exportCsv", () => ({ downloadCsv }));

import VendorDashboardList from "../VendorDashboardList";

function escrow(
  id: string,
  item: string,
  status = EscrowStatusConst.FUNDED
): Escrow {
  return {
    id,
    vendorId: "vendor-1",
    buyerId: "buyer-1",
    amount: 100,
    item,
    status,
    createdAt: "2026-06-10T10:00:00Z",
    updatedAt: "2026-06-10T10:00:00Z",
    history: [],
  };
}

const ESCROWS: Escrow[] = [
  escrow("e1", "Item One"),
  escrow("e2", "Item Two"),
  escrow("e3", "Item Three"),
];

async function renderList() {
  render(<VendorDashboardList />);
  await waitFor(() => expect(screen.getByText("Item One")).toBeInTheDocument());
}

describe("VendorDashboardList — bulk selection & export", () => {
  beforeEach(() => {
    getVendorEscrows.mockReset();
    getVendorEscrows.mockResolvedValue(ESCROWS);
    downloadCsv.mockClear();
    window.localStorage.clear();
  });

  it("selects individual rows and shows the selected count", async () => {
    await renderList();

    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]); // first row ("Item One")

    expect(await screen.findByText(/1 selected/i)).toBeInTheDocument();
    expect(downloadCsv).not.toHaveBeenCalled();
  });

  it("selects all filtered rows with Select All", async () => {
    await renderList();

    const selectAll = screen.getByLabelText(/select all/i);
    await userEvent.click(selectAll);

    expect(await screen.findByText(/3 selected/i)).toBeInTheDocument();
  });

  it("exports only the selected rows as CSV", async () => {
    await renderList();

    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]); // Item One
    await userEvent.click(checkboxes[2]); // Item Three

    const exportButton = await screen.findByRole("button", {
      name: /export selected/i,
    });
    await userEvent.click(exportButton);

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [rows] = downloadCsv.mock.calls[0] as [[Record<string, unknown>[]]];
    const items = rows.map((r) => r.item);
    expect(items).toContain("Item One");
    expect(items).toContain("Item Three");
    expect(items).not.toContain("Item Two");
  });

  it("clears selection from the action bar", async () => {
    await renderList();

    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(await screen.findByText(/1 selected/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /clear selection/i })
    );

    await waitFor(() =>
      expect(screen.queryByText(/1 selected/i)).not.toBeInTheDocument()
    );
  });
});