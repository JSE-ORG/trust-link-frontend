import { type Escrow, EscrowStatusConst, type VendorProfile } from "@/types";

/**
 * Escrow statuses that are still open for a buyer to fund, and therefore worth
 * showing as a listing on a public vendor profile.
 */
const LISTABLE_STATUSES: ReadonlySet<string> = new Set([EscrowStatusConst.PENDING]);

/**
 * Normalises the shipping destinations field into a list.
 *
 * The onboarding wizard collects a single comma-separated string
 * (`"Worldwide, US only"`), but the API may already return an array, so both
 * shapes are accepted.
 *
 * @param value - Raw `shippingLocations` value from a vendor profile.
 * @returns Trimmed, non-empty destination names.
 */
export function parseShippingLocations(
  value: VendorProfile["shippingLocations"]
): string[] {
  if (!value) return [];
  const parts = Array.isArray(value) ? value : value.split(",");
  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * Keeps only the escrow links a public profile should advertise: still
 * fundable, and not past their `expiresAt`.
 *
 * @param escrows - All escrows returned for the vendor.
 * @param now - Epoch milliseconds to compare `expiresAt` against.
 * @returns Active listings, newest first.
 */
export function filterActiveListings(
  escrows: Escrow[],
  now: number = Date.now()
): Escrow[] {
  return escrows
    .filter((escrow) => {
      if (!LISTABLE_STATUSES.has(escrow.status)) return false;
      if (!escrow.expiresAt) return true;

      const expiry = new Date(escrow.expiresAt).getTime();
      // An unparseable date shouldn't silently hide an otherwise valid listing.
      return Number.isNaN(expiry) || expiry > now;
    })
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Returns `href` only when it is a safe, absolute http(s) URL.
 *
 * Vendor-supplied websites are rendered as links, so `javascript:` and other
 * exotic schemes must not survive. A bare `example.com` is upgraded to https.
 *
 * @param website - Raw website value from a vendor profile.
 * @returns A safe absolute URL, or `null` when the value can't be trusted.
 */
export function safeWebsiteUrl(website?: string): string | null {
  const trimmed = website?.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Shortens a Stellar address for display (`GABCDE...XYZ123`).
 *
 * @param address - Full vendor address.
 * @returns The address, truncated when long enough to warrant it.
 */
export function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}
