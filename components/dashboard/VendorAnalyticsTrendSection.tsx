import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

import { type VendorAnalyticsPoint } from "@/lib/api";

const VendorAnalyticsChart = dynamic(
  () => import("./VendorAnalyticsChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-[1.75rem] bg-zinc-100 dark:bg-zinc-900/50" />
    ),
  }
);

/**
 * Properties for the VendorAnalyticsTrendSection component.
 */
export interface VendorAnalyticsTrendSectionProps {
  /** The data points to display in the chart. */
  chartData: VendorAnalyticsPoint[];
  /** Whether the current viewport is mobile. */
  isMobile: boolean;
}

/**
 * Displays the trend chart and its associated legend.
 */
export function VendorAnalyticsTrendSection({ chartData, isMobile }: VendorAnalyticsTrendSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-[2rem] border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">{t("dashboard.analyticsPage.trendTitle")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            {t("dashboard.analyticsPage.trendDescription")}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-brand-primary" />
          {t("dashboard.analyticsPage.trendLegend")}
        </div>
      </div>

      <div className="mt-6 h-[320px] w-full sm:h-[360px]">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[1.75rem] border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            {t("dashboard.analyticsPage.noPoints")}
          </div>
        ) : (
          <VendorAnalyticsChart dataPoints={chartData} isMobile={isMobile} />
        )}
      </div>
    </section>
  );
}
