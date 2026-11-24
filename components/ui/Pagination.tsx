"use client";

import { useTranslation } from "react-i18next";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  hideOnSinglePage?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  hideOnSinglePage = false,
}: PaginationProps) {
  const { t } = useTranslation();

  if (hideOnSinglePage && totalPages <= 1) return null;

  const previousDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={[
        "mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("dashboard.showingPage")}{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{currentPage}</span>{" "}
        {t("dashboard.ofPages")}{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={previousDisabled}
          aria-disabled={previousDisabled}
          aria-label={t("dashboard.previous")}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t("dashboard.previous")}
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={nextDisabled}
          aria-disabled={nextDisabled}
          aria-label={t("dashboard.next")}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t("dashboard.next")}
        </button>
      </div>
    </nav>
  );
}
