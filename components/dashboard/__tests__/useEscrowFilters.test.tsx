import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Escrow } from "@/types";
import { EscrowStatusConst } from "@/types";

import { useEscrowFilters } from "../useEscrowFilters";

function makeEscrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    id: "escrow-1",
    vendorId: "vendor-1",
    buyerId: "buyer-1",
    amount: 100,
    item: "Item",
    status: EscrowStatusConst.PENDING,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    history: [],
    ...overrides,
  };
}

const TEST_ESCROWS: Escrow[] = [
  makeEscrow({ id: "e1", item: "Mechanical Keyboard", status: EscrowStatusConst.FUNDED, createdAt: "2024-01-10T08:00:00Z" }),
  makeEscrow({ id: "e2", item: "Gaming Mouse", status: EscrowStatusConst.COMPLETED, createdAt: "2024-02-15T12:00:00Z", buyerId: "GBUYER123" }),
  makeEscrow({ id: "e3", item: "Ultra-wide Monitor", status: EscrowStatusConst.PENDING, createdAt: "2024-03-20T16:00:00Z" }),
  makeEscrow({ id: "e4", item: "Desk Mat", status: EscrowStatusConst.FUNDED, createdAt: "2024-04-05T09:00:00Z" }),
];

describe("useEscrowFilters", () => {
  it("initializes with default filter values and unpaginated list when null", () => {
    const { result } = renderHook(() => useEscrowFilters(null));

    expect(result.current.searchQuery).toBe("");
    expect(result.current.statusFilter).toBe("ALL");
    expect(result.current.fromDate).toBe("");
    expect(result.current.toDate).toBe("");
    expect(result.current.currentPage).toBe(1);
    expect(result.current.filteredEscrows).toBeNull();
    expect(result.current.paginatedEscrows).toEqual([]);
    expect(result.current.totalPages).toBe(0);
  });

  it("filters with whitespace-padded search query", () => {
    const { result } = renderHook(() => useEscrowFilters(TEST_ESCROWS));

    act(() => {
      result.current.setSearchQuery("   keyboard   ");
    });

    expect(result.current.filteredEscrows?.map((e) => e.id)).toEqual(["e1"]);
  });

  it("filters by status and ignores 'ALL'", () => {
    const { result } = renderHook(() => useEscrowFilters(TEST_ESCROWS));

    act(() => {
      result.current.setStatusFilter(EscrowStatusConst.FUNDED);
    });
    expect(result.current.filteredEscrows?.map((e) => e.id)).toEqual(["e1", "e4"]);

    act(() => {
      result.current.setStatusFilter("ALL");
    });
    expect(result.current.filteredEscrows).toHaveLength(4);
  });

  it("filters by date boundaries inclusively", () => {
    const { result } = renderHook(() => useEscrowFilters(TEST_ESCROWS));

    act(() => {
      result.current.setFromDate("2024-02-01");
      result.current.setToDate("2024-03-31");
    });

    expect(result.current.filteredEscrows?.map((e) => e.id)).toEqual(["e2", "e3"]);
  });

  it("combines search, status and date range filters with AND logic", () => {
    const { result } = renderHook(() => useEscrowFilters(TEST_ESCROWS));

    act(() => {
      result.current.setSearchQuery("  desk  ");
      result.current.setStatusFilter(EscrowStatusConst.FUNDED);
      result.current.setFromDate("2024-04-01");
      result.current.setToDate("2024-04-30");
    });

    expect(result.current.filteredEscrows?.map((e) => e.id)).toEqual(["e4"]);
  });

  it("resets date filters with clearDateFilter", () => {
    const { result } = renderHook(() => useEscrowFilters(TEST_ESCROWS));

    act(() => {
      result.current.setFromDate("2024-01-01");
      result.current.setToDate("2024-01-31");
    });
    expect(result.current.filteredEscrows?.map((e) => e.id)).toEqual(["e1"]);

    act(() => {
      result.current.clearDateFilter();
    });

    expect(result.current.fromDate).toBe("");
    expect(result.current.toDate).toBe("");
    expect(result.current.filteredEscrows).toHaveLength(4);
  });

  it("resets all filters back to defaults with resetFilters", () => {
    const { result } = renderHook(() => useEscrowFilters(TEST_ESCROWS));

    act(() => {
      result.current.setSearchQuery("mouse");
      result.current.setStatusFilter(EscrowStatusConst.COMPLETED);
      result.current.setFromDate("2024-02-01");
      result.current.setToDate("2024-02-28");
    });
    expect(result.current.filteredEscrows?.map((e) => e.id)).toEqual(["e2"]);

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.searchQuery).toBe("");
    expect(result.current.statusFilter).toBe("ALL");
    expect(result.current.fromDate).toBe("");
    expect(result.current.toDate).toBe("");
    expect(result.current.filteredEscrows).toHaveLength(4);
  });
});
