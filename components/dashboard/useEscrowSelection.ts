"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Escrow } from "@/types";

/**
 * Owns bulk row selection across the currently filtered escrows, including the
 * "select all" indeterminate state and the derived selection counts.
 */
export function useEscrowSelection(filteredEscrows: Escrow[] | null) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const allFilteredIds = useMemo(
    () => (filteredEscrows ? filteredEscrows.map((escrow) => escrow.id) : []),
    [filteredEscrows]
  );

  const selectedEscrows = useMemo(
    () =>
      filteredEscrows
        ? filteredEscrows.filter((escrow) => selectedIds.has(escrow.id))
        : [],
    [filteredEscrows, selectedIds]
  );

  const selectedCount = selectedEscrows.length;

  const areAllFilteredSelected =
    filteredEscrows !== null &&
    filteredEscrows.length > 0 &&
    filteredEscrows.every((escrow) => selectedIds.has(escrow.id));

  const someFilteredSelected = selectedCount > 0 && !areAllFilteredSelected;

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const toggleSelectEscrow = useCallback((escrow: Escrow) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(escrow.id)) {
        next.delete(escrow.id);
      } else {
        next.add(escrow.id);
      }
      return next;
    });
  }, []);

  // "Select All" targets every currently visible (filtered) escrow.
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (areAllFilteredSelected) {
        allFilteredIds.forEach((id) => next.delete(id));
      } else {
        allFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [areAllFilteredSelected, allFilteredIds]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return {
    selectedIds,
    selectedEscrows,
    selectedCount,
    areAllFilteredSelected,
    someFilteredSelected,
    selectAllRef,
    toggleSelectEscrow,
    toggleSelectAll,
    clearSelection,
  };
}
