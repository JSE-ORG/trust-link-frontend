import { BarChart3, ShieldAlert, ShoppingBag, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatUSDC } from "@/utils/currency";

import { MetricCard } from "./VendorAnalyticsMetricCard";

/**
 * Calculated metrics for the vendor analytics section.
 */
export interface VendorMetrics {
  /** The total transaction volume in USDC. */
  totalTransactionVolume: number;
  /** The average order value in USDC. */
  averageOrderValue: number;
  /** The completion rate (0-100). */
  completionRate: number;
  /** The dispute rate (0-100). */
  disputeRate: number;
}

/**
 * Properties for the VendorAnalyticsMetricsGrid component.
 */
export interface VendorAnalyticsMetricsGridProps {
  /** The metrics to display in the grid. */
  metrics: VendorMetrics;
}

/**
 * Formats a numeric rate into a percentage string with one decimal place.
 * @param value - The numeric value to format.
 * @returns A formatted string (e.g., "95.0%").
 */
export function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Displays a grid of key metrics.
 */
export function VendorAnalyticsMetricsGrid({ metrics }: VendorAnalyticsMetricsGridProps) {
  const { t } = useTranslation();

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label={t("dashboard.analyticsPage.totalTransactionVolume")}
        value={formatUSDC(metrics.totalTransactionVolume)}
        hint={t("dashboard.analyticsPage.totalTransactionVolumeHint")}
        icon={<TrendingUp className="h-5 w-5 text-brand-primary dark:text-brand-primary-dark" />}
        tone="bg-blue-50 dark:bg-blue-500/10"
      />
      <MetricCard
        label={t("dashboard.analyticsPage.averageOrderValue")}
        value={formatUSDC(metrics.averageOrderValue)}
        hint={t("dashboard.analyticsPage.averageOrderValueHint")}
        icon={<ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        tone="bg-emerald-50 dark:bg-emerald-500/10"
      />
      <MetricCard
        label={t("dashboard.analyticsPage.completionRate")}
        value={formatRate(metrics.completionRate)}
        hint={t("dashboard.analyticsPage.completionRateHint")}
        icon={<BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
        tone="bg-amber-50 dark:bg-amber-500/10"
      />
      <MetricCard
        label={t("dashboard.analyticsPage.disputeRate")}
        value={formatRate(metrics.disputeRate)}
        hint={t("dashboard.analyticsPage.disputeRateHint")}
        icon={<ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
        tone="bg-rose-50 dark:bg-rose-500/10"
      />
    </section>
  );
}
