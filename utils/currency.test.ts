import { describe, expect, it } from "vitest";

import { convertFromUSDC, formatCurrency, formatUSDC } from "./currency";

describe("formatUSDC", () => {
  it("formats a whole number with two decimal places", () => {
    expect(formatUSDC(1000)).toBe("1,000.00 USDC");
  });

  it("formats a decimal number rounded to two places", () => {
    expect(formatUSDC(1234.567)).toBe("1,234.57 USDC");
  });

  it("pads a single decimal place to two", () => {
    expect(formatUSDC(5678.9)).toBe("5,678.90 USDC");
  });

  it("formats a string representation of a number", () => {
    expect(formatUSDC("42.5")).toBe("42.50 USDC");
  });

  it("returns '0.00 USDC' for null", () => {
    expect(formatUSDC(null)).toBe("0.00 USDC");
  });

  it("returns '0.00 USDC' for undefined", () => {
    expect(formatUSDC(undefined)).toBe("0.00 USDC");
  });

  it("returns '0.00 USDC' for a non-numeric string", () => {
    expect(formatUSDC("invalid")).toBe("0.00 USDC");
  });

  it("returns '0.00 USDC' for an empty string", () => {
    expect(formatUSDC("")).toBe("0.00 USDC");
  });

  it("formats zero correctly", () => {
    expect(formatUSDC(0)).toBe("0.00 USDC");
  });

  it("formats negative values", () => {
    expect(formatUSDC(-100)).toBe("-100.00 USDC");
  });

  it("formats very large numbers with thousand separators", () => {
    expect(formatUSDC(1_000_000_000_000)).toBe("1,000,000,000,000.00 USDC");
  });

  it.each([NaN, Infinity, -Infinity])("returns the fallback for %s", (value) => {
    expect(formatUSDC(value)).toBe("0.00 USDC");
  });
});

describe("convertFromUSDC", () => {
  it.each([
    ["USDC", 1],
    ["USD", 1],
    ["EUR", 0.92],
    ["NGN", 1500],
    ["GBP", 0.78],
  ] as const)("converts to %s using its display rate", (currency, rate) => {
    expect(convertFromUSDC(10, currency)).toBe(10 * rate);
  });

  it("preserves negative amounts during conversion", () => {
    expect(convertFromUSDC(-10, "EUR")).toBeCloseTo(-9.2);
  });

  it.each([NaN, Infinity, -Infinity])("returns zero for %s", (value) => {
    expect(convertFromUSDC(value, "USD")).toBe(0);
  });
});

describe("formatCurrency", () => {
  it.each([
    ["USDC", "USDC 1,234.50"],
    ["USD", "$1,234.50"],
    ["EUR", "€1,135.74"],
    ["NGN", "₦1,851,750.00"],
    ["GBP", "£962.91"],
  ] as const)("formats %s with its symbol and display rate", (currency, expected) => {
    expect(formatCurrency(1234.5, currency)).toBe(expected);
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-100, "USD")).toBe("$-100.00");
  });

  it.each([NaN, Infinity, -Infinity])("formats %s as zero", (value) => {
    expect(formatCurrency(value, "USD")).toBe("$0.00");
  });
});
