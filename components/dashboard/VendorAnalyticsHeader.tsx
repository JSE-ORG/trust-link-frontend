import { ArrowLeft, BarChart3, Clock3 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

/**
 * Properties for the VendorAnalyticsHeader component.
 */
export interface VendorAnalyticsHeaderProps {
  /** The label describing the current time period. */
  periodLabel: string;
  /** The timestamp when the analytics were generated, or null if unknown. */
  generatedAt: string | null;
}

/**
 * Displays the page header for the vendor analytics section, including title, description, and period information.
 */
export function VendorAnalyticsHeader({ periodLabel, generatedAt }: VendorAnalyticsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard"
          className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <BarChart3 className="h-3.5 w-3.5" />
            {t("dashboard.analyticsPage.badge")}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            {t("dashboard.analyticsPage.title")}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
            {t("dashboard.analyticsPage.description", { period: periodLabel.toLowerCase() })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <div className="flex items-center gap-2 font-medium text-zinc-950 dark:text-white">
          <Clock3 className="h-4 w-4 text-[var(--accent)]" />
          {periodLabel}
        </div>
        {generatedAt ? <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("dashboard.analyticsPage.updated", { date: generatedAt })}</p> : null}
      </div>
    </div>
  );
}
