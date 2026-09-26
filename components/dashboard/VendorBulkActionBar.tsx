"use client";

import { Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface VendorBulkActionBarProps {
  selectedCount: number;
  onExportSelected: () => void;
  onClearSelection: () => void;
}

/**
 * Floating toolbar shown while one or more escrows are selected: export the
 * selection as CSV or clear it.
 */
export default function VendorBulkActionBar({
  selectedCount,
  onExportSelected,
  onClearSelection,
}: VendorBulkActionBarProps) {
  const { t } = useTranslation();

  return (
    <div
      role="toolbar"
      aria-label={t("dashboard.bulkActions")}
      className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
    >
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {t("dashboard.selectedCount", { count: selectedCount })}
        </span>
        <button
          type="button"
          onClick={onExportSelected}
          className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-300"
        >
          <Download className="h-4 w-4" />
          {t("dashboard.exportSelected")}
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClearSelection();
            }
          }}
          aria-label={t("dashboard.clearSelection")}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-300"
        >
          <X className="h-4 w-4" />
          {t("dashboard.clearSelection")}
        </button>
      </div>
    </div>
  );
}
