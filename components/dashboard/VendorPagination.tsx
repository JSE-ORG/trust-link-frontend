"use client";

import { useTranslation } from "react-i18next";

interface VendorPaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Previous/Next pagination footer with a "page X of Y" indicator.
 */
export default function VendorPagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: VendorPaginationProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("dashboard.showingPage")}{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{currentPage}</span>{" "}
        {t("dashboard.ofPages")}{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && currentPage > 1) {
              e.preventDefault();
              onPrevious();
            }
          }}
          disabled={currentPage === 1}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t("dashboard.previous")}
        </button>
        <button
          onClick={onNext}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && currentPage < totalPages) {
              e.preventDefault();
              onNext();
            }
          }}
          disabled={currentPage === totalPages}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t("dashboard.next")}
        </button>
      </div>
    </div>
  );
}
