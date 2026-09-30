"use client";

import Link from "next/link";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { formatTimeAgo } from "@/lib/utils";
import type { Escrow } from "@/types";

interface EscrowTableRowProps {
  escrow: Escrow;
  onMarkShipped: (escrow: Escrow) => void;
  onCancelEscrow: (escrow: Escrow) => void;
  /**
   * Bulk selection support. When `onToggleSelect` is provided the row renders a
   * checkbox that drives the parent's bulk-selection state.
   */
  isSelected?: boolean;
  onToggleSelect?: (escrow: Escrow) => void;
}

function EscrowTableRowComponent({
  escrow,
  onMarkShipped,
  onCancelEscrow,
  isSelected = false,
  onToggleSelect,
}: EscrowTableRowProps) {
  const { i18n, t } = useTranslation();
  const { formatAmount } = useCurrency();

  const isPending = escrow.status === "PENDING";
  const isFunded = escrow.status === "FUNDED";

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          {onToggleSelect && (
            <input
              type="checkbox"
              aria-label={t("dashboard.selectRow", { item: escrow.item })}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-300 accent-zinc-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:accent-white dark:focus-visible:ring-zinc-300"
              checked={isSelected}
              onChange={() => onToggleSelect(escrow)}
            />
          )}
          {escrow.imageUrl && (
            <div className="flex-shrink-0 overflow-hidden rounded-xl">
              <OptimizedImage
                src={escrow.imageUrl}
                alt={t("dashboard.thumbnailAlt", { item: escrow.item })}
                width={80}
                height={80}
                className="h-20 w-20 object-cover"
                sizes="80px"
              />
            </div>
          )}
          <div>
            <p className="text-base font-semibold text-zinc-950 dark:text-zinc-100">{escrow.item}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <span>{t("dashboard.buyer", { buyer: escrow.buyerId ? `${escrow.buyerId.slice(0, 4)}...${escrow.buyerId.slice(-4)}` : t("dashboard.unknown") })}</span>
              <span>•</span>
              <span>{t("dashboard.amount", { amount: formatAmount(escrow.amount) })}</span>
              <span>•</span>
              <span>{t("dashboard.created", { time: formatTimeAgo(escrow.createdAt, i18n.language) })}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {escrow.status}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/escrow/${escrow.id}`}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-900"
            >
              {t("dashboard.view")}
            </Link>
            {isPending && (
              <button
                type="button"
                onClick={() => onCancelEscrow(escrow)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCancelEscrow(escrow);
                  }
                }}
                className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                {t("dashboard.cancel")}
              </button>
            )}
            {isFunded && (
              <button
                type="button"
                onClick={() => onMarkShipped(escrow)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onMarkShipped(escrow);
                  }
                }}
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {t("dashboard.markShipped")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized table row for the vendor dashboard escrow list.
 * Prevents unnecessary re-renders when parent state changes (e.g. search query, filters).
 * Only re-renders when the escrow data or callbacks change.
 */
const EscrowTableRow = memo(EscrowTableRowComponent);

export default EscrowTableRow;