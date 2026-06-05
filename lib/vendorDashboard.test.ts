import { describe, it, expect } from "vitest";
import type { Escrow } from "@/types";
import {
  filterEscrows,
  sortEscrows,
  paginate,
  getTotalPages,
} from "@/lib/vendorDashboard";

function makeEscrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    id: "escrow-1",
    vendorId: "vendor-1",
    buyerId: "buyer-1",
    amount: 100,
    item: "Item",
    status: "PENDING",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    history: [],
    ...overrides,
  };
}

const ESCROWS: Escrow[] = [
  makeEscrow({ id: "a1", item: "Laptop", status: "FUNDED", amount: 300, createdAt: "2024-01-10T10:00:00Z" }),
  makeEscrow({ id: "b2", item: "Camera", status: "COMPLETED", amount: 150, createdAt: "2024-02-20T10:00:00Z", buyerId: "GBUYERXYZ" }),
  makeEscrow({ id: "c3", item: "Phone", status: "PENDING", amount: 999, createdAt: "2024-03-05T10:00:00Z" }),
];

describe("filterEscrows", () => {
  it("returns everything when no filters are provided", () => {
    expect(filterEscrows(ESCROWS)).toHaveLength(3);
  });

  it("does not mutate the input array", () => {
    const copy = [...ESCROWS];
    filterEscrows(ESCROWS, { statusFilter: "FUNDED" });
    expect(ESCROWS).toEqual(copy);
  });

  it("filters by status and ignores 'ALL'", () => {
    expect(filterEscrows(ESCROWS, { statusFilter: "FUNDED" }).map((e) => e.id)).toEqual(["a1"]);
    expect(filterEscrows(ESCROWS, { statusFilter: "ALL" })).toHaveLength(3);
  });

  it("matches search against id, item and buyerId case-insensitively", () => {
    expect(filterEscrows(ESCROWS, { searchQuery: "lap" }).map((e) => e.id)).toEqual(["a1"]);
    expect(filterEscrows(ESCROWS, { searchQuery: "C3" }).map((e) => e.id)).toEqual(["c3"]);
    expect(filterEscrows(ESCROWS, { searchQuery: "gbuyer" }).map((e) => e.id)).toEqual(["b2"]);
  });

  it("filters by an inclusive date range", () => {
    const result = filterEscrows(ESCROWS, { fromDate: "2024-02-01", toDate: "2024-02-28" });
    expect(result.map((e) => e.id)).toEqual(["b2"]);
  });

  it("treats fromDate and toDate bounds as inclusive", () => {
    expect(filterEscrows(ESCROWS, { fromDate: "2024-01-10" }).map((e) => e.id)).toEqual(["a1", "b2", "c3"]);
    expect(filterEscrows(ESCROWS, { toDate: "2024-01-10" }).map((e) => e.id)).toEqual(["a1"]);
  });

  it("combines search, status and date filters with AND", () => {
    const result = filterEscrows(ESCROWS, {
      searchQuery: "p",
      statusFilter: "PENDING",
      fromDate: "2024-03-01",
    });
    expect(result.map((e) => e.id)).toEqual(["c3"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterEscrows(ESCROWS, { searchQuery: "nope" })).toEqual([]);
  });
});

describe("sortEscrows", () => {
  it("sorts by amount ascending and descending", () => {
    expect(sortEscrows(ESCROWS, { field: "amount", direction: "asc" }).map((e) => e.amount)).toEqual([150, 300, 999]);
    expect(sortEscrows(ESCROWS, { field: "amount", direction: "desc" }).map((e) => e.amount)).toEqual([999, 300, 150]);
  });

  it("defaults to descending order", () => {
    expect(sortEscrows(ESCROWS, { field: "amount" }).map((e) => e.amount)).toEqual([999, 300, 150]);
  });

  it("sorts by createdAt chronologically", () => {
    expect(sortEscrows(ESCROWS, { field: "createdAt", direction: "asc" }).map((e) => e.id)).toEqual(["a1", "b2", "c3"]);
  });

  it("sorts by item name case-insensitively", () => {
    expect(sortEscrows(ESCROWS, { field: "item", direction: "asc" }).map((e) => e.item)).toEqual(["Camera", "Laptop", "Phone"]);
  });

  it("does not mutate the input array", () => {
    const copy = [...ESCROWS];
    sortEscrows(ESCROWS, { field: "amount" });
    expect(ESCROWS).toEqual(copy);
  });
});

describe("paginate", () => {
  const items = [1, 2, 3, 4, 5];

  it("returns the requested page", () => {
    expect(paginate(items, 1, 2)).toEqual([1, 2]);
    expect(paginate(items, 2, 2)).toEqual([3, 4]);
    expect(paginate(items, 3, 2)).toEqual([5]);
  });

  it("clamps page numbers below 1 to the first page", () => {
    expect(paginate(items, 0, 2)).toEqual([1, 2]);
    expect(paginate(items, -5, 2)).toEqual([1, 2]);
  });

  it("returns an empty array for out-of-range pages", () => {
    expect(paginate(items, 10, 2)).toEqual([]);
  });
});

describe("getTotalPages", () => {
  it("rounds up to whole pages", () => {
    expect(getTotalPages(5, 2)).toBe(3);
    expect(getTotalPages(4, 2)).toBe(2);
    expect(getTotalPages(0, 2)).toBe(0);
  });

  it("returns 0 for a non-positive page size", () => {
    expect(getTotalPages(5, 0)).toBe(0);
  });
});
