import { describe, expect, it } from "vitest";

import { PAYMENT_FAQ_ITEMS } from "./paymentFaq";

describe("PAYMENT_FAQ_ITEMS", () => {
  it("contains exactly four distinct payment FAQ questions in order", () => {
    expect(PAYMENT_FAQ_ITEMS).toHaveLength(4);
    expect(PAYMENT_FAQ_ITEMS.map((item) => item.question)).toEqual([
      "How does escrow protect my payment?",
      "What happens if there's a dispute?",
      "Are there any platform fees?",
      "How long does the escrow process take?",
    ]);
  });

  it("ensures each item has non-empty question and answer strings", () => {
    for (const item of PAYMENT_FAQ_ITEMS) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
  });
});
