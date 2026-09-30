/**
 * Formats a numeric or string value as a standardized USDC currency string (e.g., "1,234.50 USDC").
 * Returns "0.00 USDC" if value is null, undefined, or NaN.
 *
 * @param value - The numerical amount or numeric string to format.
 * @returns Formatted USDC string.
 */
export function formatUSDC(value: number | string | null | undefined): string {
  const num = Number(value);
  if (isNaN(num)) return "0.00 USDC";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + " USDC";
}

/**
 * Currencies the dashboard can display escrow totals in. Escrows are always
 * priced and settled in USDC — the other codes are display-only conversions.
 */
export type CurrencyCode = "USDC" | "USD" | "EUR" | "NGN" | "GBP";

/**
 * Approximate exchange rates relative to 1 USDC (treated as ≈ 1 USD).
 * Static placeholders for display purposes only — never used for settlement.
 */
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USDC: 1,
  USD: 1,
  EUR: 0.92,
  NGN: 1500,
  GBP: 0.78,
};

/** Prefix shown before a converted amount for each currency. */
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USDC: "USDC ",
  USD: "$",
  EUR: "€",
  NGN: "₦",
  GBP: "£",
};

/**
 * Converts a USDC amount into the given display currency using the approximate
 * rates above. Returns 0 when the input is null, undefined, or not a number.
 */
export function convertFromUSDC(
  value: number | string | null | undefined,
  currency: CurrencyCode
): number {
  const num = Number(value);
  if (isNaN(num)) return 0;

  return num * (EXCHANGE_RATES[currency] ?? 1);
}

/**
 * Formats a USDC amount for display in the given currency (e.g. "€1,234.50").
 * The result is approximate for every currency other than USDC/USD.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: CurrencyCode
): string {
  const converted = convertFromUSDC(value, currency);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);

  return `${CURRENCY_SYMBOLS[currency] ?? ""}${formatted}`;
}
