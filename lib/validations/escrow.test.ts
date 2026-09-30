import { afterEach, describe, expect, it } from "vitest";

import i18n from "@/lib/i18n";

import { ESCROW_LIMITS, EscrowCreateSchema, shippingOptions } from "./escrow";

const validPayload = {
  itemName: "Awesome Widget",
  priceUSDC: "123.45",
  description: "A sturdier build of the classic widget.",
  shippingWindow: shippingOptions[1],
};

type ParseResult = ReturnType<typeof EscrowCreateSchema.safeParse>;

/** Deliberately loose so the suite can feed the schema invalid input. */
type EscrowOverrides = {
  itemName?: string | undefined;
  priceUSDC?: string | undefined;
  description?: string | undefined;
  shippingWindow?: string | undefined;
};

function messages(result: ParseResult): string[] {
  if (result.success) {
    throw new Error("Expected the payload to be rejected.");
  }

  return result.error.issues.map((issue) => issue.message);
}

function firstMessage(result: ParseResult): string {
  return messages(result)[0];
}

function parse(overrides: EscrowOverrides = {}): ParseResult {
  return EscrowCreateSchema.safeParse({ ...validPayload, ...overrides });
}

describe("EscrowCreateSchema — text fields", () => {
  it("accepts a valid payload", () => {
    expect(parse().success).toBe(true);
  });

  it("trims surrounding whitespace from itemName and description", () => {
    const result = parse({
      itemName: "  Awesome Widget\t\n",
      description: "  A sturdier build of the classic widget.  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.itemName).toBe("Awesome Widget");
      expect(result.data.description).toBe(
        "A sturdier build of the classic widget."
      );
    }
  });

  it.each(["", " ", "   ", "\t", "\n", " \t\n "])(
    "rejects whitespace-only itemName %j",
    (itemName) => {
      expect(parse({ itemName }).success).toBe(false);
    }
  );

  it.each(["", " ", "   ", "\t", "\n", " \t\n "])(
    "rejects whitespace-only description %j",
    (description) => {
      expect(parse({ description }).success).toBe(false);
    }
  );

  it("rejects an itemName longer than the limit", () => {
    const tooLong = "w".repeat(ESCROW_LIMITS.itemNameMaxLength + 1);

    expect(parse({ itemName: tooLong }).success).toBe(false);
  });

  it("accepts an itemName exactly at the limit", () => {
    const atLimit = "w".repeat(ESCROW_LIMITS.itemNameMaxLength);

    expect(parse({ itemName: atLimit }).success).toBe(true);
  });

  it("measures length after trimming", () => {
    const paddedAtLimit = `  ${"w".repeat(ESCROW_LIMITS.itemNameMaxLength)}  `;

    expect(parse({ itemName: paddedAtLimit }).success).toBe(true);
  });

  it("rejects a description longer than the limit", () => {
    const tooLong = "d".repeat(ESCROW_LIMITS.descriptionMaxLength + 1);

    expect(parse({ description: tooLong }).success).toBe(false);
  });

  it("accepts a description exactly at the limit", () => {
    const atLimit = "d".repeat(ESCROW_LIMITS.descriptionMaxLength);

    expect(parse({ description: atLimit }).success).toBe(true);
  });

  it("rejects a missing itemName or description", () => {
    expect(
      EscrowCreateSchema.safeParse({
        ...validPayload,
        itemName: undefined,
      }).success
    ).toBe(false);
    expect(
      EscrowCreateSchema.safeParse({
        ...validPayload,
        description: undefined,
      }).success
    ).toBe(false);
  });
});

describe("EscrowCreateSchema — priceUSDC", () => {
  it.each([
    "1",
    "10",
    "10.5",
    "123.45",
    "0.01",
    "0.1",
    "12.123456",
    "1000000",
    "1000000.00",
  ])("accepts %j", (priceUSDC) => {
    expect(parse({ priceUSDC }).success).toBe(true);
  });

  it("trims surrounding whitespace before validating", () => {
    const result = parse({ priceUSDC: "  123.45\n" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priceUSDC).toBe("123.45");
    }
  });

  it.each([
    "",
    " ",
    "abc",
    "10abc",
    "10 USDC",
    "$10",
    "0x10",
    "NaN",
    "Infinity",
  ])("rejects non-numeric input %j", (priceUSDC) => {
    expect(parse({ priceUSDC }).success).toBe(false);
  });

  it.each(["-5", "+5", "-0.01"])("rejects the signed amount %j", (priceUSDC) => {
    const result = parse({ priceUSDC });

    expect(result.success).toBe(false);
    expect(firstMessage(result)).toMatch(/positive/i);
  });

  it.each(["1e1000", "1E3", "1e-3", "2.5e2", "1e1000"])(
    "rejects scientific notation %j",
    (priceUSDC) => {
      expect(parse({ priceUSDC }).success).toBe(false);
    }
  );

  it.each(["1,5", "1 000", "1_000", "1.2.3", "10.", ".5", "1..5", "１０"])(
    "rejects malformed decimal syntax %j",
    (priceUSDC) => {
      expect(parse({ priceUSDC }).success).toBe(false);
    }
  );

  it("rejects more decimals than the limit allows", () => {
    expect(parse({ priceUSDC: "1.1234567" }).success).toBe(false);
    expect(parse({ priceUSDC: "0.0000001" }).success).toBe(false);
    expect(ESCROW_LIMITS.priceMaxDecimals).toBe(6);
  });

  it.each(["0.001", "0.000001", "0.0000001", "0.000000"])(
    "rejects the dust amount %j",
    (priceUSDC) => {
      const result = parse({ priceUSDC });

      expect(result.success).toBe(false);
      expect(firstMessage(result)).toContain("USDC");
    }
  );

  it.each(["1000000.01", "9999999", "2000000", "1000000.000001"])(
    "rejects the overflowing amount %j",
    (priceUSDC) => {
      const result = parse({ priceUSDC });

      expect(result.success).toBe(false);
      expect(firstMessage(result)).toContain("USDC");
    }
  );

  it("reports a missing price", () => {
    const result = parse({ priceUSDC: "" });

    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe("Price is required.");
  });
});

describe("EscrowCreateSchema — shippingWindow", () => {
  it.each(shippingOptions)("accepts the option %j", (shippingWindow) => {
    expect(parse({ shippingWindow }).success).toBe(true);
  });

  it.each(["next day", "Same Day", "1-2 days", "", "custom"])(
    "rejects the unknown option %j",
    (shippingWindow) => {
      const result = parse({ shippingWindow });

      expect(result.success).toBe(false);
      expect(firstMessage(result)).toBe("Select a valid shipping window.");
    }
  );
});

describe("EscrowCreateSchema — localised messages", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("returns English messages by default", () => {
    expect(firstMessage(parse({ itemName: " " }))).toBe(
      "Item name is required."
    );
  });

  it("never leaks a raw translation key", () => {
    const keys = [
      { itemName: " " },
      { itemName: "w".repeat(ESCROW_LIMITS.itemNameMaxLength + 1) },
      { priceUSDC: "" },
      { priceUSDC: "abc" },
      { priceUSDC: "0.0000001" },
      { priceUSDC: "9999999" },
      { description: " " },
      { description: "d".repeat(ESCROW_LIMITS.descriptionMaxLength + 1) },
      { shippingWindow: "whenever" },
    ];

    for (const override of keys) {
      for (const message of messages(parse(override))) {
        expect(message).not.toMatch(/escrow\.errors/);
        expect(message).not.toBe("");
      }
    }
  });

  it("resolves messages at parse time, not when the schema is built", async () => {
    // The schema above was already constructed while the language was "en".
    await i18n.changeLanguage("fr");

    expect(firstMessage(parse({ itemName: " " }))).toBe(
      "Le nom de l'article est requis."
    );
    expect(firstMessage(parse({ priceUSDC: "" }))).toBe("Le prix est requis.");
    expect(firstMessage(parse({ description: " " }))).toBe(
      "La description est requise."
    );
    expect(firstMessage(parse({ shippingWindow: "whenever" }))).toBe(
      "Sélectionnez un délai de livraison valide."
    );
  });

  it("translates the length and range messages", async () => {
    await i18n.changeLanguage("fr");

    expect(
      firstMessage(
        parse({ itemName: "w".repeat(ESCROW_LIMITS.itemNameMaxLength + 1) })
      )
    ).toContain("caractères");
    expect(firstMessage(parse({ priceUSDC: "9999999" }))).toContain("USDC");
    expect(
      firstMessage(
        parse({ description: "d".repeat(ESCROW_LIMITS.descriptionMaxLength + 1) })
      )
    ).toContain("caractères");
  });

  it("interpolates the configured limits into the message", () => {
    expect(
      firstMessage(
        parse({ itemName: "w".repeat(ESCROW_LIMITS.itemNameMaxLength + 1) })
      )
    ).toContain(String(ESCROW_LIMITS.itemNameMaxLength));
    expect(
      firstMessage(
        parse({ description: "d".repeat(ESCROW_LIMITS.descriptionMaxLength + 1) })
      )
    ).toContain(String(ESCROW_LIMITS.descriptionMaxLength));
    expect(firstMessage(parse({ priceUSDC: "9999999" }))).toContain(
      String(ESCROW_LIMITS.priceMaxUSDC)
    );
    expect(firstMessage(parse({ priceUSDC: "0.000001" }))).toContain(
      String(ESCROW_LIMITS.priceMinUSDC)
    );
  });

  it("falls back to English for unknown locales", async () => {
    await i18n.changeLanguage("de");

    expect(firstMessage(parse({ itemName: " " }))).toBe(
      "Item name is required."
    );
  });
});
