/**
 * Analytics utility helpers for dashboard components.
 */

/**
 * Normalizes a given rate to a percentage value between 0 and 100.
 *
 * Useful when the backend might return either a decimal fraction (e.g. 0.95)
 * or an already calculated percentage (e.g. 95).
 *
 * @param value - The rate value to normalize (fraction 0..1, percentage >1, or undefined/null/NaN).
 * @returns The normalized percentage value.
 */
export function normalizeRate(value: number | undefined | null): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value <= 1 ? value * 100 : value;
}
