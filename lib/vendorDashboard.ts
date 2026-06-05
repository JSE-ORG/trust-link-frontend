import type { Escrow } from "@/types";

/**
 * Pure, framework-free filtering / sorting / pagination logic for the vendor
 * dashboard. Extracting it out of `VendorDashboardList` keeps the rendering
 * component thin and makes the business rules (which the dashboard depends on)
 * unit-testable in isolation.
 */

export interface VendorDashboardFilters {
  /** Free-text query matched against id, vendorId, buyerId and item. */
  searchQuery?: string;
  /** Status tab value; "ALL" (or empty) disables the status filter. */
  statusFilter?: string;
  /** Inclusive lower bound for `createdAt`, as an `YYYY-MM-DD` string. */
  fromDate?: string;
  /** Inclusive upper bound for `createdAt`, as an `YYYY-MM-DD` string. */
  toDate?: string;
}

export type EscrowSortField = "createdAt" | "amount" | "status" | "item";
export type SortDirection = "asc" | "desc";

export interface EscrowSort {
  field: EscrowSortField;
  direction?: SortDirection;
}

const startOfDay = (date: string): number => new Date(`${date}T00:00:00`).getTime();
const endOfDay = (date: string): number => new Date(`${date}T23:59:59.999`).getTime();

/**
 * Filter escrows by search text, status and a `createdAt` date range. All
 * provided criteria are combined with AND; an omitted/empty criterion is
 * ignored. The input array is never mutated.
 */
export function filterEscrows(
  escrows: Escrow[],
  filters: VendorDashboardFilters = {}
): Escrow[] {
  const { searchQuery = "", statusFilter = "ALL", fromDate = "", toDate = "" } = filters;

  const query = searchQuery.trim().toLowerCase();
  const start = fromDate ? startOfDay(fromDate) : null;
  const end = toDate ? endOfDay(toDate) : null;

  return escrows.filter((escrow) => {
    const matchesSearch =
      query === "" ||
      escrow.id.toLowerCase().includes(query) ||
      Boolean(escrow.vendorId && escrow.vendorId.toLowerCase().includes(query)) ||
      Boolean(escrow.buyerId && escrow.buyerId.toLowerCase().includes(query)) ||
      Boolean(escrow.item && escrow.item.toLowerCase().includes(query));

    const matchesStatus =
      !statusFilter || statusFilter === "ALL" || escrow.status === statusFilter;

    const created = new Date(escrow.createdAt).getTime();
    const matchesDate =
      (start === null || created >= start) && (end === null || created <= end);

    return matchesSearch && matchesStatus && matchesDate;
  });
}

/**
 * Return a new array sorted by the given field/direction (default descending).
 * Stable for equal keys and non-mutating. Strings compare case-insensitively;
 * `createdAt` compares chronologically; `amount` compares numerically.
 */
export function sortEscrows(escrows: Escrow[], sort: EscrowSort): Escrow[] {
  const direction = sort.direction ?? "desc";
  const factor = direction === "asc" ? 1 : -1;

  return [...escrows].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "item":
        comparison = (a.item ?? "").localeCompare(b.item ?? "", undefined, {
          sensitivity: "base",
        });
        break;
    }

    return comparison * factor;
  });
}

/**
 * Slice a list into a single page (1-indexed). `page` is clamped to at least 1
 * so an out-of-range request returns an empty page rather than throwing.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(1, Math.floor(page));
  const startIndex = (safePage - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

/** Total number of pages for a list of `total` items at `pageSize` per page. */
export function getTotalPages(total: number, pageSize: number): number {
  if (pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}
