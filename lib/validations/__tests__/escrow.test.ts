import { describe, expect, it } from "vitest";
import { EscrowCreateSchema } from "../escrow";

describe("EscrowCreateSchema", () => {
  describe("itemName", () => {
    it("should reject empty strings", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "",
        priceUSDC: "10.50",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should reject whitespace-only strings", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "   ",
        priceUSDC: "10.50",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should trim and accept valid item names", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "  Valid Item  ",
        priceUSDC: "10.50",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.itemName).toBe("Valid Item");
      }
    });

    it("should reject item names exceeding max length", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "a".repeat(201),
        priceUSDC: "10.50",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("description", () => {
    it("should reject empty strings", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "10.50",
        description: "",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should reject whitespace-only strings", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "10.50",
        description: "   ",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should trim and accept valid descriptions", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "10.50",
        description: "  Valid Description  ",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Valid Description");
      }
    });

    it("should reject descriptions exceeding max length", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "10.50",
        description: "a".repeat(2001),
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("priceUSDC", () => {
    it("should accept valid decimal prices", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "10.50",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(true);
    });

    it("should accept prices with up to 6 decimal places", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "10.123456",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(true);
    });

    it("should reject prices with more than 6 decimal places", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "10.1234567",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should reject scientific notation", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "1e10",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should reject very small numbers", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "0.000000001",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should reject prices with whitespace", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: " 10 ",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative prices", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "-10",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should reject zero price", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "0",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should reject prices exceeding maximum", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "1000001",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("should trim whitespace from price", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "  10.50  ",
        description: "Test",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priceUSDC).toBe("10.50");
      }
    });
  });

  describe("shippingWindow", () => {
    it("should accept valid shipping windows", () => {
      const validWindows = ["Same day", "1-3 days", "1 week", "Custom"];
      validWindows.forEach((window) => {
        const result = EscrowCreateSchema.safeParse({
          itemName: "Test Item",
          priceUSDC: "10.50",
          description: "Test",
          shippingWindow: window,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid shipping windows with localized error", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Item",
        priceUSDC: "10.50",
        description: "Test",
        shippingWindow: "Invalid Window",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please select a valid shipping window.");
      }
    });
  });
});
