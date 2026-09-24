import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCurrency } from "@/components/providers/CurrencyProvider";

import CurrencyDropdown from "../CurrencyDropdown";

// Mock the translation hook
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "dashboard.currency.select": "Select currency",
        "dashboard.currency.info": "Currency info tooltip",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the useCurrency hook
vi.mock("@/components/providers/CurrencyProvider", () => ({
  useCurrency: vi.fn(),
}));

describe("CurrencyDropdown", () => {
  const mockSetCurrency = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    (useCurrency as ReturnType<typeof vi.fn>).mockReturnValue({
      currency: "USDC",
      setCurrency: mockSetCurrency,
    });
  });

  it("renders correctly with default currency", () => {
    render(<CurrencyDropdown />);
    
    // Check if select exists with correct value
    const select = screen.getByRole("combobox", { name: /select currency/i });
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("USDC");
    
    // Check if options are rendered
    expect(screen.getByRole("option", { name: "USDC" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "USD" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "EUR" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "NGN" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "GBP" })).toBeInTheDocument();
  });

  it("renders the correct currency from context", () => {
    (useCurrency as ReturnType<typeof vi.fn>).mockReturnValue({
      currency: "EUR",
      setCurrency: mockSetCurrency,
    });
    
    render(<CurrencyDropdown />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("EUR");
  });

  it("calls setCurrency when a valid option is selected", () => {
    render(<CurrencyDropdown />);
    const select = screen.getByRole("combobox");
    
    fireEvent.change(select, { target: { value: "GBP" } });
    
    expect(mockSetCurrency).toHaveBeenCalledTimes(1);
    expect(mockSetCurrency).toHaveBeenCalledWith("GBP");
  });

  it("does not call setCurrency when an invalid option is selected", () => {
    render(<CurrencyDropdown />);
    const select = screen.getByRole("combobox");
    
    fireEvent.change(select, { target: { value: "INVALID" } });
    
    expect(mockSetCurrency).not.toHaveBeenCalled();
  });

  it("renders tooltip info text correctly", () => {
    render(<CurrencyDropdown />);
    
    // Check for the info text that is visually hidden/shown on hover
    expect(screen.getByText("Currency info tooltip")).toBeInTheDocument();
  });
});
