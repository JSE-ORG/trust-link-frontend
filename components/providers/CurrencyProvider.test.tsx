import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CurrencyProvider, useCurrency } from "@/components/providers/CurrencyProvider";
import { type CurrencyCode, formatCurrency } from "@/utils/currency";

// The shared setup mocks this module for dashboard tests. Exercise real context here.
vi.unmock("@/components/providers/CurrencyProvider");

const currencies: CurrencyCode[] = ["USDC", "USD", "EUR", "NGN", "GBP"];

function CurrencyConsumer() {
  const { currency, setCurrency, formatAmount } = useCurrency();
  return (
    <>
      <output data-testid="currency">{currency}</output>
      <output data-testid="numeric-amount">{formatAmount(1234.5)}</output>
      <output data-testid="string-amount">{formatAmount("12.50")}</output>
      <output data-testid="invalid-amount">{formatAmount("invalid")}</output>
      {currencies.map((code) => (
        <button key={code} onClick={() => setCurrency(code)}>{code}</button>
      ))}
    </>
  );
}

function renderConsumer() {
  return render(<CurrencyProvider><CurrencyConsumer /></CurrencyProvider>);
}

function expectCurrency(currency: CurrencyCode) {
  expect(screen.getByTestId("currency")).toHaveTextContent(currency);
  expect(screen.getByTestId("numeric-amount").textContent).toBe(formatCurrency(1234.5, currency));
  expect(screen.getByTestId("string-amount").textContent).toBe(formatCurrency("12.50", currency));
  expect(screen.getByTestId("invalid-amount").textContent).toBe(formatCurrency("invalid", currency));
}

describe("CurrencyProvider", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("defaults to USDC without writing a preference", () => {
    renderConsumer();
    expectCurrency("USDC");
    expect(screen.getByTestId("numeric-amount")).toHaveTextContent("USDC 1,234.50");
    expect(localStorage.getItem("preferredCurrency")).toBeNull();
  });

  it.each(currencies)("restores the supported saved currency %s", (currency) => {
    localStorage.setItem("preferredCurrency", currency);
    renderConsumer();
    expectCurrency(currency);
    expect(localStorage.getItem("preferredCurrency")).toBe(currency);
  });

  it.each(["", "INVALID", "eur", " EUR "])("ignores unsupported saved preference %j", (saved) => {
    localStorage.setItem("preferredCurrency", saved);
    renderConsumer();
    expectCurrency("USDC");
    expect(localStorage.getItem("preferredCurrency")).toBe(saved);
  });

  it("updates formatting, persists each choice, and restores it after remount", () => {
    const { unmount } = renderConsumer();
    for (const currency of ["EUR", "NGN", "GBP", "USD", "USDC", "EUR"] as const) {
      fireEvent.click(screen.getByRole("button", { name: currency }));
      expectCurrency(currency);
      expect(localStorage.getItem("preferredCurrency")).toBe(currency);
    }
    unmount();
    renderConsumer();
    expectCurrency("EUR");
  });

  it("fails clearly outside its provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<CurrencyConsumer />)).toThrow("useCurrency must be used within a CurrencyProvider");
  });
});
