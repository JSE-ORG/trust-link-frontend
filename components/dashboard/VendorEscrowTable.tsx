"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatTimeAgo } from "@/lib/utils";
import type { Escrow } from "@/types";

import { CHECKBOX_CLASS } from "./vendorListShared";

interface VendorEscrowTableProps {
  paginatedEscrows: Escrow[];
  selectedIds: Set<string>;
  onToggleSelect: (escrow: Escrow) => void;
  onMarkShipped: (escrow: Escrow) => void;
  onCancelEscrow: (escrow: Escrow) => void;
  selectAllRef: RefObject<HTMLInputElement | null>;
  areAllFilteredSelected: boolean;
  onToggleSelectAll: () => void;
  selectAllDisabled: boolean;
}

/**
 * Table presentation of the paginated escrows, including the header
 * "select all" checkbox and per-row view / cancel / mark-shipped actions.
 */
export default function VendorEscrowTable({
  paginatedEscrows,
  selectedIds,
  onToggleSelect,
  onMarkShipped,
  onCancelEscrow,
  selectAllRef,
  areAllFilteredSelected,
  onToggleSelectAll,
  selectAllDisabled,
}: VendorEscrowTableProps) {
  const { t, i18n } = useTranslation();
  const { formatAmount } = useCurrency();

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-[720px] px-4 sm:px-0">
        <table className="w-full border-collapse rounded-2xl border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <th className="w-12 px-4 py-3 whitespace-nowrap">
                <input
                  id="escrow-select-all-table"
                  ref={selectAllRef}
                  type="checkbox"
                  aria-label={t("dashboard.selectAll")}
                  className={CHECKBOX_CLASS}
                  checked={areAllFilteredSelected}
                  onChange={onToggleSelectAll}
                  disabled={selectAllDisabled}
                />
              </th>
              <th className="px-4 py-3 whitespace-nowrap">{t("dashboard.tableHeaders.item") || "Item"}</th>
              <th className="px-4 py-3 whitespace-nowrap">{t("dashboard.tableHeaders.buyer") || "Buyer"}</th>
              <th className="px-4 py-3 whitespace-nowrap">{t("dashboard.tableHeaders.amount") || "Amount"}</th>
              <th className="px-4 py-3 whitespace-nowrap">{t("dashboard.tableHeaders.status") || "Status"}</th>
              <th className="px-4 py-3 whitespace-nowrap">{t("dashboard.tableHeaders.created") || "Created"}</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">{t("dashboard.tableHeaders.actions") || "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEscrows.map((escrow) => {
              const isPending = escrow.status === "PENDING";
              const isFunded = escrow.status === "FUNDED";
              return (
                <tr
                  key={escrow.id}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="checkbox"
                      aria-label={t("dashboard.selectRow", { item: escrow.item })}
                      className={CHECKBOX_CLASS}
                      checked={selectedIds.has(escrow.id)}
                      onChange={() => onToggleSelect(escrow)}
                    />
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {escrow.item}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                    {escrow.buyerId ? `${escrow.buyerId.slice(0, 4)}...${escrow.buyerId.slice(-4)}` : t("dashboard.unknown")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-900 dark:text-zinc-100">{formatAmount(escrow.amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {escrow.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                    {formatTimeAgo(escrow.createdAt, i18n.language)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/escrow/${escrow.id}`}
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
                      >
                        {t("dashboard.view")}
                      </Link>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => onCancelEscrow(escrow)}
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          {t("dashboard.cancel")}
                        </button>
                      )}
                      {isFunded && (
                        <button
                          type="button"
                          onClick={() => onMarkShipped(escrow)}
                          className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        >
                          {t("dashboard.markShipped")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
