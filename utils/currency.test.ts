import { describe, it, expect } from "vitest";
import { formatUSDC } from "./currency";

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
    expect(formatUSDC(1000000)).toBe("1,000,000.00 USDC");
  });
});
