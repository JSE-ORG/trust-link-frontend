"use client";

import { useTranslation } from "react-i18next";

interface VendorNoResultsProps {
  onReset: () => void;
}

/**
 * Shown when the active filters match zero escrows, with a reset action.
 */
export default function VendorNoResults({ onReset }: VendorNoResultsProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
      <p className="text-zinc-500 dark:text-zinc-400">
        {t("dashboard.noEscrowsFound")}
      </p>
      <button
        onClick={onReset}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onReset();
          }
        }}
        className="mt-4 text-sm font-medium text-black hover:underline dark:text-white"
      >
        {t("dashboard.clearFilters")}
      </button>
    </div>
  );
}
