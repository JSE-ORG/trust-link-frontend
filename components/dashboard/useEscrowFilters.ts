"use client";

import { startTransition, useEffect, useMemo, useState } from "react";

import { filterEscrows, getTotalPages, paginate } from "@/lib/vendorDashboard";
import type { Escrow } from "@/types";

import { ITEMS_PER_PAGE } from "./vendorListShared";

/**
 * Owns the search / status / date-range filter state, derives the filtered
 * list, and paginates it by composing the canonical pure helpers from
 * `lib/vendorDashboard.ts`.
 *
 * Search/date semantics:
 * - Search query is trimmed and matched case-insensitively across `id`,
 *   `vendorId`, `buyerId`, and `item`.
 * - Status matches exact status or matches all statuses when set to "ALL" (or empty).
 * - `fromDate` and `toDate` (YYYY-MM-DD) are inclusive boundaries against `createdAt`
 *   (from 00:00:00 to 23:59:59.999 local time).
 * - Changing any filter resets `currentPage` back to 1.
 * - Current page is clamped between 1 and `totalPages` (minimum 1) so shrinking
 *   lists never leave an out-of-bounds trailing page.
 */
export function useEscrowFilters(escrows: Escrow[] | null) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    startTransition(() => setCurrentPage(1));
  }, [searchQuery, statusFilter, fromDate, toDate]);

  const filteredEscrows = useMemo(() => {
    if (!escrows) return null;
    return filterEscrows(escrows, {
      searchQuery,
      statusFilter,
      fromDate,
      toDate,
    });
  }, [escrows, searchQuery, statusFilter, fromDate, toDate]);

  const totalPages = filteredEscrows
    ? getTotalPages(filteredEscrows.length, ITEMS_PER_PAGE)
    : 0;

  // Derived rather than synced via an effect so the first render after the
  // list shrinks is already in bounds. Never drops below page one.
  const lastPage = Math.max(1, totalPages);
  const effectivePage = Math.min(Math.max(1, currentPage), lastPage);

  const paginatedEscrows = useMemo(() => {
    if (!filteredEscrows) return [];
    return paginate(filteredEscrows, effectivePage, ITEMS_PER_PAGE);
  }, [filteredEscrows, effectivePage]);

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    clearDateFilter();
  };

  // Step from the clamped page so a stale out-of-range value cannot leak back.
  const goToPage = (page: number) =>
    setCurrentPage(Math.min(lastPage, Math.max(1, page)));
  const goToPreviousPage = () => goToPage(effectivePage - 1);
  const goToNextPage = () => goToPage(effectivePage + 1);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    currentPage: effectivePage,
    filteredEscrows,
    paginatedEscrows,
    totalPages,
    clearDateFilter,
    resetFilters,
    goToPage,
    goToPreviousPage,
    goToNextPage,
  };
}
