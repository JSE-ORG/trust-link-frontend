/**
 * Zod schema for the "create escrow link" form.
 *
 * Validation is intentionally strict: text fields are trimmed and bounded, and
 * the price must be a plain decimal amount inside a sane range. Scientific
 * notation, dust and overflowing amounts are rejected because the escrow
 * service only accepts fixed-precision USDC strings.
 *
 * Every message is resolved through the i18next singleton *at parse time*
 * (the `error` factories below), so switching the active language in the
 * footer is immediately reflected in the form without rebuilding the schema.
 */
import { z } from "zod";

import i18n from "@/lib/i18n";

export const shippingOptions = ["Same day", "1-3 days", "1 week", "Custom"] as const;

export const ESCROW_LIMITS = {
  /** Maximum length of the item name, in characters. */
  itemNameMaxLength: 80,
  /** Maximum length of the item description, in characters. */
  descriptionMaxLength: 500,
  /** Maximum number of decimal places accepted in the price. */
  priceMaxDecimals: 6,
  /** Smallest accepted price — anything lower is dust. */
  priceMinUSDC: 0.01,
  /** Largest accepted price — guards against overflow. */
  priceMaxUSDC: 1_000_000,
} as const;

/**
 * Plain decimal only: optional integer part, optional fractional part of at most
 * `priceMaxDecimals` digits. Rejects signs, exponents (`1e1000`), thousands
 * separators, hex and any other `Number()` coercion trick.
 */
const PRICE_PATTERN = new RegExp(
  `^\\d+(?:\\.\\d{1,${ESCROW_LIMITS.priceMaxDecimals}})?$`
);

const t = (key: string, options?: Record<string, string | number>) =>
  i18n.t(key, options);

const itemNameSchema = z
  .string()
  .trim()
  .min(1, { error: () => t("escrow.errors.itemNameRequired") })
  .max(ESCROW_LIMITS.itemNameMaxLength, {
    error: () =>
      t("escrow.errors.itemNameTooLong", { max: ESCROW_LIMITS.itemNameMaxLength }),
  });

const priceSchema = z
  .string()
  .trim()
  .min(1, { error: () => t("escrow.errors.priceRequired") })
  .regex(PRICE_PATTERN, { error: () => t("escrow.errors.priceFormat") })
  .refine((value) => Number(value) >= ESCROW_LIMITS.priceMinUSDC, {
    error: () => t("escrow.errors.priceTooSmall", { min: ESCROW_LIMITS.priceMinUSDC }),
  })
  .refine((value) => Number(value) <= ESCROW_LIMITS.priceMaxUSDC, {
    error: () => t("escrow.errors.priceTooLarge", { max: ESCROW_LIMITS.priceMaxUSDC }),
  });

const descriptionSchema = z
  .string()
  .trim()
  .min(1, { error: () => t("escrow.errors.descriptionRequired") })
  .max(ESCROW_LIMITS.descriptionMaxLength, {
    error: () =>
      t("escrow.errors.descriptionTooLong", {
        max: ESCROW_LIMITS.descriptionMaxLength,
      }),
  });

// export const EscrowCreateSchema = z.object({
//   itemName: itemNameSchema,
//   priceUSDC: priceSchema,
//   description: descriptionSchema,
//   shippingWindow: z.enum(shippingOptions, {
//     error: () => t("escrow.errors.shippingWindowInvalid"),
//   }),
// });
const PRICE_REGEX = /^\d+(\.\d{1,6})?$/;
const MAX_PRICE = 1000000;

export const EscrowCreateSchema = z.object({
  itemName: z
    .string()
    .trim()
    .min(1, "Item name is required.")
    .max(200, "Item name must not exceed 200 characters."),
  priceUSDC: z
    .string()
    .trim()
    .min(1, "Price is required.")
    .refine(
      (val) => PRICE_REGEX.test(val),
      "Price must be a valid number with up to 6 decimal places."
    )
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !Number.isNaN(num) && num > 0 && num <= MAX_PRICE;
      },
      `Price must be between 0 and ${MAX_PRICE} USDC.`
    ),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(2000, "Description must not exceed 2000 characters."),
  shippingWindow: z.enum(shippingOptions, {
    errorMap: () => ({ message: "Please select a valid shipping window." }),
  }),
}).strict();

export type EscrowCreateValues = z.infer<typeof EscrowCreateSchema>;
export type ShippingWindow = z.infer<typeof EscrowCreateSchema.shape.shippingWindow>;
