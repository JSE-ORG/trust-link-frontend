/**
 * Truncates a long address or hash string for UI display (e.g., "GABC...1234").
 *
 * @param address - The raw address or string to truncate.
 * @param startChars - Number of prefix characters to retain (default: 4).
 * @param endChars - Number of suffix characters to retain (default: 4).
 * @returns Truncated string, or original address if shorter than startChars + endChars.
 */
export function truncateAddress(address: string, startChars: number = 4, endChars: number = 4): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}
