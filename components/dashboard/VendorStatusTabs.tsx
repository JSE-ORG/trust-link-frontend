"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";

import type { Escrow } from "@/types";

import { STATUS_TABS } from "./vendorListShared";

interface VendorStatusTabsProps {
  escrows: Escrow[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

/**
 * Row of status filter tabs with per-status counts and arrow-key roving focus.
 */
export default function VendorStatusTabs({
  escrows,
  statusFilter,
  onStatusFilterChange,
}: VendorStatusTabsProps) {
  const { t } = useTranslation();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % STATUS_TABS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + STATUS_TABS.length) % STATUS_TABS.length;
    }

    if (nextIndex !== index) {
      e.preventDefault();
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="mb-4 flex flex-wrap gap-2" role="tablist">
      {STATUS_TABS.map((s, index) => {
        const count =
          s === "ALL"
            ? escrows.length
            : escrows.filter((e) => e.status === s).length;
        return (
          <button
            key={s}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            aria-selected={statusFilter === s}
            type="button"
            onClick={() => onStatusFilterChange(s)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onStatusFilterChange(s);
              } else {
                handleTabKeyDown(e, index);
              }
            }}
            className={`rounded-full px-3 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-300 ${
              statusFilter === s
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {s === "ALL"
              ? t("dashboard.allFilter")
              : s.charAt(0) + s.slice(1).toLowerCase()}{" "}
            ({count})
          </button>
        );
      })}
    </div>
  );
}
