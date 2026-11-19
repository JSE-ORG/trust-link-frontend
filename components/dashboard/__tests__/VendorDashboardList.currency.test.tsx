import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CurrencyDropdown from "@/components/dashboard/CurrencyDropdown";
import VendorDashboardList from "@/components/dashboard/VendorDashboardList";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { getVendorEscrows } from "@/lib/api";
import type { Escrow } from "@/types";
import { downloadCsv } from "@/utils/exportCsv";

vi.mock("@/lib/api", () => ({
  getVendorEscrows: vi.fn(),
  cancelEscrow: vi.fn(),
}));

vi.mock("@/utils/exportCsv", () => ({
  downloadCsv: vi.fn(),
  ensureCsvExtension: vi.fn((name: string) => name),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "dashboard.amount" && options?.amount) {
        return `Amount: ${options.amount}`;
      }
      return key;
    },
    i18n: { language: "en" },
  }),
}));

const mockEscrows: Escrow[] = [
  {
    id: "escrow-usd-1",
    vendorId: "vendor-1",
    buyerId: "buyer-alpha",
    amount: 100,
    item: "Laptop Stand",
    status: "PENDING",
    createdAt: "2024-03-01T12:00:00Z",
    updatedAt: "2024-03-01T12:00:00Z",
    history: [],
  },
  {
    id: "escrow-usd-2",
    vendorId: "vendor-1",
    buyerId: "buyer-beta",
    amount: 250,
    item: "Mechanical Keyboard",
    status: "FUNDED",
    createdAt: "2024-03-02T15:30:00Z",
    updatedAt: "2024-03-02T15:30:00Z",
    history: [],
  },
];

function TestDashboardWithCurrency() {
  return (
    <CurrencyProvider>
      <div data-testid="currency-bar">
        <CurrencyDropdown />
      </div>
      <VendorDashboardList />
    </CurrencyProvider>
  );
}

describe("VendorDashboardList currency integration across Card and Table views", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getVendorEscrows).mockResolvedValue(mockEscrows);
  });

  it("updates monetary values in card view when currency changes", async () => {
    render(<TestDashboardWithCurrency />);

    await waitFor(() => {
      expect(screen.getByText("Laptop Stand")).toBeInTheDocument();
    });

    // Default currency is USDC: 100.00 USDC and 250.00 USDC
    expect(screen.getByText(/USDC 100\.00/)).toBeInTheDocument();
    expect(screen.getByText(/USDC 250\.00/)).toBeInTheDocument();

    // Switch currency to EUR (rate 0.92): 100 -> €92.00, 250 -> €230.00
    const currencySelect = screen.getByRole("combobox", {
      name: "dashboard.currency.select",
    });
    fireEvent.change(currencySelect, { target: { value: "EUR" } });

    await waitFor(() => {
      expect(screen.getByText(/€92\.00/)).toBeInTheDocument();
      expect(screen.getByText(/€230\.00/)).toBeInTheDocument();
    });

    // Switch currency to NGN (rate 1500): 100 -> ₦150,000.00, 250 -> ₦375,000.00
    fireEvent.change(currencySelect, { target: { value: "NGN" } });

    await waitFor(() => {
      expect(screen.getByText(/₦150,000\.00/)).toBeInTheDocument();
      expect(screen.getByText(/₦375,000\.00/)).toBeInTheDocument();
    });
  });

  it("retains selected currency preference when switching between card and table modes", async () => {
    render(<TestDashboardWithCurrency />);

    await waitFor(() => {
      expect(screen.getByText("Laptop Stand")).toBeInTheDocument();
    });

    const currencySelect = screen.getByRole("combobox", {
      name: "dashboard.currency.select",
    });
    // Set to GBP (rate 0.78): 100 -> £78.00, 250 -> £195.00
    fireEvent.change(currencySelect, { target: { value: "GBP" } });

    await waitFor(() => {
      expect(screen.getByText(/£78\.00/)).toBeInTheDocument();
    });

    // Switch to Table View
    const tableButton = screen.getByRole("button", { name: "Table" });
    await userEvent.click(tableButton);

    // Verify Table view is active and displays amounts in GBP
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    expect(screen.getByText("£78.00")).toBeInTheDocument();
    expect(screen.getByText("£195.00")).toBeInTheDocument();

    // Change currency in table view to USD: 100 -> $100.00, 250 -> $250.00
    fireEvent.change(currencySelect, { target: { value: "USD" } });

    await waitFor(() => {
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("$250.00")).toBeInTheDocument();
    });

    // Switch back to Card View
    const cardButton = screen.getByRole("button", { name: "Card" });
    await userEvent.click(cardButton);

    // Verify Card view preserved USD selection
    await waitFor(() => {
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
    expect(screen.getByText(/100\.00/)).toBeInTheDocument();
    expect(screen.getByText(/250\.00/)).toBeInTheDocument();

    // Verify localStorage has persisted the preference
    expect(localStorage.getItem("preferredCurrency")).toBe("USD");
  });

  it("keeps CSV export denominated according to existing contract regardless of display currency", async () => {
    render(<TestDashboardWithCurrency />);

    await waitFor(() => {
      expect(screen.getByText("Laptop Stand")).toBeInTheDocument();
    });

    // Change display currency to EUR
    const currencySelect = screen.getByRole("combobox", {
      name: "dashboard.currency.select",
    });
    fireEvent.change(currencySelect, { target: { value: "EUR" } });

    await waitFor(() => {
      expect(screen.getByText(/€92\.00/)).toBeInTheDocument();
    });

    // Click Export CSV
    const exportButton = screen.getByRole("button", { name: "dashboard.exportCsv" });
    await userEvent.click(exportButton);

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [exportedRows, exportedColumns] = vi.mocked(downloadCsv).mock.calls[0];

    // Assert that the CSV export contract retains numeric USDC amounts (100 and 250),
    // and was not transformed into display-formatted strings
    expect(exportedRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "escrow-usd-1", amount: 100 }),
        expect.objectContaining({ id: "escrow-usd-2", amount: 250 }),
      ])
    );

    // Column definitions include the amount key
    expect(exportedColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "amount" }),
      ])
    );
  });
});
