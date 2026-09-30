"use client";

import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import type { Escrow } from "@/types";

import EscrowTableRow from "./EscrowTableRow";
import { CHECKBOX_CLASS } from "./vendorListShared";

interface VendorEscrowCardListProps {
  paginatedEscrows: Escrow[];
  selectedIds: Set<string>;
  onToggleSelect: (escrow: Escrow) => void;
  onMarkShipped: (escrow: Escrow) => void;
  onCancelEscrow: (escrow: Escrow) => void;
  selectAllRef: RefObject<HTMLInputElement | null>;
  areAllFilteredSelected: boolean;
  onToggleSelectAll: () => void;
  selectAllDisabled: boolean;
  someFilteredSelected: boolean;
  selectedCount: number;
}

/**
 * Card presentation: a "select all" header row followed by one
 * {@link EscrowTableRow} card per paginated escrow.
 */
export default function VendorEscrowCardList({
  paginatedEscrows,
  selectedIds,
  onToggleSelect,
  onMarkShipped,
  onCancelEscrow,
  selectAllRef,
  areAllFilteredSelected,
  onToggleSelectAll,
  selectAllDisabled,
  someFilteredSelected,
  selectedCount,
}: VendorEscrowCardListProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <input
          id="escrow-select-all"
          ref={selectAllRef}
          type="checkbox"
          aria-label={t("dashboard.selectAll")}
          className={CHECKBOX_CLASS}
          checked={areAllFilteredSelected}
          onChange={onToggleSelectAll}
          disabled={selectAllDisabled}
        />
        <label
          htmlFor="escrow-select-all"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t("dashboard.selectAll")}
        </label>
        {someFilteredSelected && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("dashboard.selectedCount", { count: selectedCount })}
          </span>
        )}
      </div>
      <div className="space-y-4">
        {paginatedEscrows.map((escrow) => (
          <EscrowTableRow
            key={escrow.id}
            escrow={escrow}
            isSelected={selectedIds.has(escrow.id)}
            onToggleSelect={onToggleSelect}
            onMarkShipped={onMarkShipped}
            onCancelEscrow={onCancelEscrow}
          />
        ))}
      </div>
    </>
  );
}
