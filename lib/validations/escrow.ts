import { z } from 'zod';

// Localised error messages
const ERRORS = {
  ITEM_NAME_REQUIRED: 'Item name is required and cannot be whitespace',
  ITEM_NAME_TOO_LONG: 'Item name must be 255 characters or less',
  DESCRIPTION_REQUIRED: 'Description is required and cannot be whitespace',
  DESCRIPTION_TOO_LONG: 'Description must be 255 characters or less',
  PRICE_INVALID_FORMAT: 'Price must be a valid number with up to 6 decimal places',
  PRICE_TOO_SMALL: 'Price must be at least 0.01 USDC',
  PRICE_TOO_LARGE: 'Price must be 1,000,000,000 USDC or less',
  PRICE_SCIENTIFIC_NOTATION: 'Price cannot be in scientific notation',
  SHIPPING_WINDOW_INVALID: 'Shipping window must be one of: 7, 14, 30, 60, 90'
};

// Strict price regex: no scientific notation, max 6 decimals, optional leading digits
const PRICE_REGEX = /^(?!0\.0+$)(?!\d+\.?0*e[+-]?\d+$)\d+(\.\d{1,6})?$/;

export const escrowSchema = z.object({
  itemName: z
    .string()
    .trim()
    .min(1, { message: ERRORS.ITEM_NAME_REQUIRED })
    .max(255, { message: ERRORS.ITEM_NAME_TOO_LONG }),

  description: z
    .string()
    .trim()
    .min(1, { message: ERRORS.DESCRIPTION_REQUIRED })
    .max(255, { message: ERRORS.DESCRIPTION_TOO_LONG }),

  priceUSDC: z
    .string()
    .regex(PRICE_REGEX, { message: ERRORS.PRICE_INVALID_FORMAT })
    .transform((val) => parseFloat(val))
    .refine((val) => val >= 0.01, { message: ERRORS.PRICE_TOO_SMALL })
    .refine((val) => val <= 1e9, { message: ERRORS.PRICE_TOO_LARGE }),

  shippingWindow: z
    .union([
      z.literal(7),
      z.literal(14),
      z.literal(30),
      z.literal(60),
      z.literal(90)
    ], {
      message: ERRORS.SHIPPING_WINDOW_INVALID
    })
});

export type EscrowFormData = z.infer<typeof escrowSchema>;