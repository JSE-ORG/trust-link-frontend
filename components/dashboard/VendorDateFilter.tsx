"use client";

import { useTranslation } from "react-i18next";

interface VendorDateFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClear: () => void;
}

/**
 * From/To created-date range filter with a conditional clear button.
 */
export default function VendorDateFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClear,
}: VendorDateFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label
          htmlFor="escrow-from-date"
          className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          {t("dashboard.fromLabel")}
        </label>
        <input
          id="escrow-from-date"
          type="date"
          value={fromDate}
          max={toDate || undefined}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition focus:border-black focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-zinc-300"
        />
      </div>
      <div className="flex flex-col">
        <label
          htmlFor="escrow-to-date"
          className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          {t("dashboard.toLabel")}
        </label>
        <input
          id="escrow-to-date"
          type="date"
          value={toDate}
          min={fromDate || undefined}
          onChange={(e) => onToDateChange(e.target.value)}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition focus:border-black focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-zinc-300"
        />
      </div>
      {(fromDate || toDate) && (
        <button
          type="button"
          onClick={onClear}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClear();
            }
          }}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-300"
        >
          {t("dashboard.clearDates")}
        </button>
      )}
    </div>
  );
}
