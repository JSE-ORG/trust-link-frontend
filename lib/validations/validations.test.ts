import { describe, expect, it } from "vitest";

import { DisputeFormSchema, EscrowCreateSchema } from "@/lib/validations";

describe("validation schemas", () => {
  it("accepts valid escrow data and rejects unknown keys", () => {
    const validData = {
      itemName: "Handmade desk",
      priceUSDC: "125",
      description: "A solid wood desk.",
      shippingWindow: "1-3 days" as const,
    };

    expect(EscrowCreateSchema.safeParse(validData).success).toBe(true);
    expect(
      EscrowCreateSchema.safeParse({ ...validData, unexpected: "value" }).success
    ).toBe(false);
  });

  it("accepts valid dispute data and rejects unknown keys", () => {
    const validData = {
      name: "Alex Smith",
      email: "alex@example.com",
      orderNumber: "order-123",
      reason: "The item arrived damaged.",
      description: "The item arrived damaged and cannot be used as intended.",
      files: [new File(["evidence"], "evidence.txt")],
      agreeToTerms: true,
    };

    expect(DisputeFormSchema.safeParse(validData).success).toBe(true);
    expect(
      DisputeFormSchema.safeParse({ ...validData, unexpected: "value" }).success
    ).toBe(false);
  });
});
