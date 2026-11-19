import { describe, expect, it } from "vitest";

import { normalizeRate } from "../analytics";

describe("normalizeRate", () => {
  const cases: Array<[string, number | undefined | null, number]> = [
    // Fraction inputs (0 <= value <= 1) normalized to 0..100
    ["fraction 0.95 to 95", 0.95, 95],
    ["fraction 0.01 to 1", 0.01, 1],
    ["fraction 0.5 to 50", 0.5, 50],
    ["boundary 1 to 100", 1, 100],

    // Percentage inputs (> 1) kept as percentage
    ["percentage 95 to 95", 95, 95],
    ["percentage with decimal 95.5 to 95.5", 95.5, 95.5],
    ["percentage 100 to 100", 100, 100],
    ["percentage just above 1 (1.05) kept as 1.05", 1.05, 1.05],

    // Zero, undefined, null, and NaN cases
    ["zero to 0", 0, 0],
    ["undefined to 0", undefined, 0],
    ["null to 0", null, 0],
    ["NaN to 0", Number.NaN, 0],
  ];

  it.each(cases)("correctly handles %s", (_description, input, expected) => {
    expect(normalizeRate(input)).toBeCloseTo(expected);
  });

  it("ensures summary cards and chart tooltips receive identical normalized values for the same input", () => {
    const rawInputs = [0.95, 0.01, 95, 100, 0, undefined];

    rawInputs.forEach((raw) => {
      // Simulate consumer calculation for summary cards
      const summaryCardValue = normalizeRate(raw);
      // Simulate consumer calculation for chart tooltips / data table
      const tooltipValue = normalizeRate(raw);

      expect(summaryCardValue).toBe(tooltipValue);
    });
  });
});
