import { z } from "zod";

export const shippingOptions = ["Same day", "1-3 days", "1 week", "Custom"] as const;

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
