"use client";

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
 * Normalizes a rate value, ensuring it falls within a percentage range.
 * Converts fraction representation (e.g., 0.95) to percentage representation (95).
 * @param value - The rate value to normalize.
 * @returns The normalized percentage.
 */
function normalizeRate(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value <= 1 ? value * 100 : value;
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
  const { i18n } = useTranslation();
  return (
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
  );
}
