"use client";

import { startTransition, useEffect, useMemo, useState } from "react";

import type { Escrow } from "@/types";

import { ITEMS_PER_PAGE } from "./vendorListShared";

/**
 * Owns the search / status / date-range filter state, derives the filtered
 * list, and paginates it. Changing any filter resets back to page one.
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

    const start = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const end = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return escrows.filter((escrow) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        escrow.id.toLowerCase().includes(query) ||
        (escrow.vendorId && escrow.vendorId.toLowerCase().includes(query)) ||
        (escrow.buyerId && escrow.buyerId.toLowerCase().includes(query)) ||
        (escrow.item && escrow.item.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "ALL" || escrow.status === statusFilter;

      const created = new Date(escrow.createdAt).getTime();
      const matchesDate =
        (start === null || created >= start) && (end === null || created <= end);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [escrows, searchQuery, statusFilter, fromDate, toDate]);

  const totalPages = filteredEscrows
    ? Math.ceil(filteredEscrows.length / ITEMS_PER_PAGE)
    : 0;

  const paginatedEscrows = useMemo(() => {
    if (!filteredEscrows) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEscrows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEscrows, currentPage]);

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    clearDateFilter();
  };

  const goToPreviousPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () =>
    setCurrentPage((p) => Math.min(totalPages, p + 1));

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    currentPage,
    filteredEscrows,
    paginatedEscrows,
    totalPages,
    clearDateFilter,
    resetFilters,
    goToPreviousPage,
    goToNextPage,
  };
}
