/**
 * Truncates a long address or hash string for UI display (e.g., "GABC...1234").
 *
 * Single source of truth for display truncation across the app; callers that
 * historically wanted different prefix/suffix sizes pass them explicitly.
 *
 * @param address - The raw address or string to truncate, or a missing value.
 * @param startChars - Number of prefix characters to retain (default: 4).
 * @param endChars - Number of suffix characters to retain (default: 4).
 * @returns Truncated string, the original string when it is short enough, or
 *          an empty string for null/undefined input.
 */
export function truncateAddress(
  address: string | null | undefined,
  startChars: number = 4,
  endChars: number = 4,
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
