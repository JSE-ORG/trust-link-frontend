"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import type { VendorAnalyticsPoint } from "@/lib/api";

import { normalizeRate } from "./analytics";

/**
 * Formats a numeric value as a percentage string.
 * @param value - The numeric value to format (e.g., 95.5).
 * @returns The formatted string (e.g., "95.5%").
 */
function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Formats a date string for the axis label based on locale and available space.
 * @param value - The date string to format.
 * @param compact - Whether to use a more compact format (true for mobile).
 * @param locale - The locale string (e.g., "en-US").
 * @returns The formatted date string, or original value if invalid.
 */
function formatAxisLabel(value: string, compact: boolean, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(locale, compact
    ? { month: "numeric", day: "numeric" }
    : { month: "short", day: "numeric" }
  );
}

/**
 * Formats a numeric volume compactly based on locale.
 * @param value - The numeric volume.
 * @param locale - The locale string.
 * @returns The compactly formatted string.
 */
function formatCompactVolume(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}


/**
 * Props for the custom AnalyticsTooltip component.
 */
interface AnalyticsTooltipProps {
  /** Indicates whether the tooltip is active/visible. */
  active?: boolean;
  /** The payload array provided by Recharts. */
  payload?: Array<{ payload: VendorAnalyticsPoint }>;
  /** The label for the current point, typically the date. */
  label?: string;
}

/**
 * Custom tooltip component for the vendor analytics chart.
 * Displays formatted values for transaction volume, average order,
 * completion rate, and dispute rate.
 *
 * @param props - The tooltip properties provided by Recharts.
 * @returns The tooltip element, or null if inactive.
 */
function AnalyticsTooltip({
  active,
  payload,
  label,
}: AnalyticsTooltipProps) {
  const { formatAmount } = useCurrency();
  const { i18n, t } = useTranslation();
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/95 p-4 text-sm shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <p className="font-semibold text-zinc-950 dark:text-white">
        {label ? formatAxisLabel(label, false, i18n.language) : t("dashboard.analyticsPage.dailySnapshot")}
      </p>
      <div className="mt-3 space-y-1 text-zinc-600 dark:text-zinc-300">
        <p>{t("dashboard.analyticsPage.tooltipTransactionVolume", { amount: formatAmount(point.transactionVolume) })}</p>
        <p>{t("dashboard.analyticsPage.tooltipAverageOrder", { amount: formatAmount(point.averageOrderValue) })}</p>
        <p>{t("dashboard.analyticsPage.tooltipCompletionRate", { rate: formatRate(normalizeRate(point.completionRate)) })}</p>
        <p>{t("dashboard.analyticsPage.tooltipDisputeRate", { rate: formatRate(normalizeRate(point.disputeRate)) })}</p>
      </div>
    </div>
  );
}

/**
 * Props for the VendorAnalyticsChart component.
 */
export interface VendorAnalyticsChartProps {
  /** An array of data points representing daily analytics. */
  dataPoints: VendorAnalyticsPoint[];
  /** Indicates whether the layout should optimize for a mobile view. */
  isMobile: boolean;
}

/**
 * Renders an area chart for vendor analytics, showing transaction volume
 * over time. Includes custom formatting and a detailed tooltip on interaction.
 *
 * @param props - The component properties.
 * @returns The rendered chart component within a responsive container.
 */
export default function VendorAnalyticsChart({
  dataPoints,
  isMobile,
}: VendorAnalyticsChartProps) {
  const { i18n, t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [showTable, setShowTable] = useState(false);
  const hasData = dataPoints.length > 0;

  return (
    <div className="flex h-full w-full flex-col">
      {hasData && (
        <div className="mb-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowTable((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-expanded={showTable}
          >
            {showTable ? t("dashboard.analyticsPage.viewChart") : t("dashboard.analyticsPage.viewDataTable")}
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {(!showTable || !hasData) && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.18)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                interval={isMobile ? 5 : 2}
                minTickGap={isMobile ? 24 : 16}
                tickFormatter={(value: string | number) => formatAxisLabel(String(value), isMobile, i18n.language)}
                tick={{ fill: "#71717a", fontSize: isMobile ? 11 : 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={isMobile ? 44 : 64}
                tickFormatter={(value: string | number) => formatCompactVolume(Number(value), i18n.language)}
                tick={{ fill: "#71717a", fontSize: isMobile ? 11 : 12 }}
              />
              <Tooltip content={<AnalyticsTooltip />} />
              <Area
                type="monotone"
                dataKey="transactionVolume"
                stroke="url(#volumeStroke)"
                strokeWidth={3}
                fill="url(#volumeFill)"
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {hasData && (
          <div
            className={
              showTable
                ? "h-full w-full overflow-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                : "sr-only focus-within:not-sr-only focus-within:absolute focus-within:inset-0 focus-within:z-10 focus-within:overflow-auto focus-within:rounded-2xl focus-within:border focus-within:border-zinc-200 focus-within:bg-white focus-within:p-4 dark:focus-within:border-zinc-800 dark:focus-within:bg-zinc-950"
            }
            tabIndex={showTable ? 0 : undefined}
            role={showTable ? "region" : undefined}
            aria-label={showTable ? t("dashboard.analyticsPage.dataTableCaption") : undefined}
          >
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <caption className="sr-only">
                {t("dashboard.analyticsPage.dataTableCaption")}
              </caption>
              <thead className="sticky top-0 border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                <tr>
                  <th scope="col" className="px-3 py-2 sm:px-4">{t("dashboard.analyticsPage.date")}</th>
                  <th scope="col" className="px-3 py-2 sm:px-4">{t("dashboard.analyticsPage.totalTransactionVolume")} (USDC)</th>
                  <th scope="col" className="px-3 py-2 sm:px-4">{t("dashboard.analyticsPage.averageOrderValue")} (USDC)</th>
                  <th scope="col" className="px-3 py-2 sm:px-4">{t("dashboard.analyticsPage.completionRate")} (%)</th>
                  <th scope="col" className="px-3 py-2 sm:px-4">{t("dashboard.analyticsPage.disputeRate")} (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {dataPoints.map((point) => (
                  <tr key={point.date} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-950 dark:text-zinc-100 sm:px-4">
                      {formatAxisLabel(point.date, false, i18n.language)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-300 sm:px-4">
                      {formatAmount(point.transactionVolume)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-300 sm:px-4">
                      {formatAmount(point.averageOrderValue)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-300 sm:px-4">
                      {formatRate(normalizeRate(point.completionRate))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-300 sm:px-4">
                      {formatRate(normalizeRate(point.disputeRate))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
