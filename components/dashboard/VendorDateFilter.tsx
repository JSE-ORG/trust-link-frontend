"use client";

import { useTranslation } from "react-i18next";

interface VendorDateFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClear: () => void;
}

type PresetId = "today" | "last7Days" | "last30Days" | "thisMonth";

interface DatePreset {
  id: PresetId;
  labelKey: string;
  from: string;
  to: string;
}

/**
 * Format a `Date` using its local calendar values (`YYYY-MM-DD`). Deliberately
 * not `toISOString()`: that converts to UTC and would report yesterday or
 * tomorrow for users whose offset crosses midnight.
 */
function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Midnight-local for the given instant, so day arithmetic ignores DST/time. */
function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Build the presets from the user's local calendar. Ranges are inclusive and
 * end today; "This Month" runs from the first of the current month to today.
 */
function buildPresets(now: Date): DatePreset[] {
  const today = startOfLocalDay(now);
  const todayIso = toLocalIsoDate(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return [
    {
      id: "today",
      labelKey: "dashboard.presets.today",
      from: todayIso,
      to: todayIso,
    },
    {
      id: "last7Days",
      labelKey: "dashboard.presets.last7Days",
      from: toLocalIsoDate(addLocalDays(today, -7)),
      to: todayIso,
    },
    {
      id: "last30Days",
      labelKey: "dashboard.presets.last30Days",
      from: toLocalIsoDate(addLocalDays(today, -30)),
      to: todayIso,
    },
    {
      id: "thisMonth",
      labelKey: "dashboard.presets.thisMonth",
      from: toLocalIsoDate(monthStart),
      to: todayIso,
    },
  ];
}

/**
 * From/To created-date range filter with quick preset chips and a conditional
 * clear button.
 */
export default function VendorDateFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClear,
}: VendorDateFilterProps) {
  const { t } = useTranslation();
  const presets = buildPresets(new Date());

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          // Evaluated per chip: a preset is active when both inputs exactly
          // match its range. Ranges can coincide (e.g. "Today" and "This
          // Month" on the 1st), and both are then genuinely active.
          const isActive =
            preset.from === fromDate && preset.to === toDate;

          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                onFromDateChange(preset.from);
                onToDateChange(preset.to);
              }}
              className={`rounded-full px-3 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-300 ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {t(preset.labelKey)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
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
    </div>
  );
}
