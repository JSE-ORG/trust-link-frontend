"use client";

import { Download, LayoutGrid, Search, Table2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import TransactionHistoryExport from "@/components/dashboard/TransactionHistoryExport";
import type { Escrow } from "@/types";

import type { ViewMode } from "./vendorListShared";

interface VendorListToolbarProps {
  escrows: Escrow[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExportCsv: () => void;
}

/**
 * Top toolbar: escrow search, card/table view toggle, history export and the
 * filtered-CSV export button.
 */
export default function VendorListToolbar({
  escrows,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onExportCsv,
}: VendorListToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          id="escrow-search"
          type="text"
          aria-label={t("dashboard.searchPlaceholder") || "Search escrows"}
          placeholder={t("dashboard.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-full border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white dark:focus-visible:ring-zinc-300"
        />
      </div>
      <div className="flex items-center gap-3">
        <div
          role="group"
          aria-label={t("dashboard.viewModeLabel") || "View mode"}
          className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <button
            type="button"
            aria-pressed={viewMode === "card"}
            aria-label={t("dashboard.cardView") || "Card view"}
            onClick={() => onViewModeChange("card")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-300 ${
              viewMode === "card"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Card
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "table"}
            aria-label={t("dashboard.tableView") || "Table view"}
            onClick={() => onViewModeChange("table")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-300 ${
              viewMode === "table"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Table2 className="h-4 w-4" />
            Table
          </button>
        </div>
        <TransactionHistoryExport
          escrows={escrows}
          vendorId={escrows[0]?.vendorId || "vendor"}
        />
        <button
          id="export-csv-button"
          type="button"
          onClick={onExportCsv}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onExportCsv();
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-300"
        >
          <Download className="h-4 w-4" />
          {t("dashboard.exportCsv")}
        </button>
      </div>
    </div>
  );
}
