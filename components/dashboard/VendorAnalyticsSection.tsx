"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Clock3,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUSDC } from "@/utils/currency";
import { cn } from "@/lib/utils";
import { getVendorAnalytics, type VendorAnalyticsPoint, type VendorAnalyticsResponse } from "@/lib/api";
import VendorAnalyticsSkeleton from "./VendorAnalyticsSkeleton";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatAxisLabel(value: string, compact: boolean): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", compact
    ? { month: "numeric", day: "numeric" }
    : { month: "short", day: "numeric" }
  );
}

function formatCompactVolume(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function normalizeRate(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value <= 1 ? value * 100 : value;
}

function pickMetrics(source: VendorAnalyticsResponse | null, points: VendorAnalyticsPoint[]) {
  const latestPoint = points.at(-1);
  const pointAverage = points.length > 0
    ? points.reduce((sum, point) => sum + point.averageOrderValue, 0) / points.length
    : 0;
  const pointVolume = points.reduce((sum, point) => sum + point.transactionVolume, 0);

  return {
    totalTransactionVolume: source?.totalTransactionVolume ?? pointVolume,
    averageOrderValue: source?.averageOrderValue ?? latestPoint?.averageOrderValue ?? pointAverage,
    completionRate: normalizeRate(source?.completionRate ?? latestPoint?.completionRate),
    disputeRate: normalizeRate(source?.disputeRate ?? latestPoint?.disputeRate),
  };
}

function AnalyticsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: VendorAnalyticsPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/95 p-4 text-sm shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <p className="font-semibold text-zinc-950 dark:text-white">
        {label ? formatAxisLabel(label, false) : "Daily snapshot"}
      </p>
      <div className="mt-3 space-y-1 text-zinc-600 dark:text-zinc-300">
        <p>Transaction volume: {formatUSDC(point.transactionVolume)}</p>
        <p>Average order: {formatUSDC(point.averageOrderValue)}</p>
        <p>Completion rate: {formatRate(normalizeRate(point.completionRate))}</p>
        <p>Dispute rate: {formatRate(normalizeRate(point.disputeRate))}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">{value}</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", tone)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function VendorAnalyticsSection() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<VendorAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const syncBreakpoint = () => setIsMobile(mediaQuery.matches);

    syncBreakpoint();
    mediaQuery.addEventListener("change", syncBreakpoint);

    return () => mediaQuery.removeEventListener("change", syncBreakpoint);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      const token = window.localStorage.getItem("wallet.jwt");
      if (!token) {
        router.push("/");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getVendorAnalytics(token);
        if (mounted) {
          setAnalytics(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load vendor analytics.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [router]);

  const chartData = useMemo(() => {
    return analytics?.dailyMetrics ?? analytics?.series ?? analytics?.data ?? [];
  }, [analytics]);

  const metrics = pickMetrics(analytics, chartData);
  const periodLabel = analytics?.periodLabel ?? "Last 30 days";
  const generatedAt = analytics?.generatedAt
    ? new Date(analytics.generatedAt).toLocaleString()
    : null;

  if (isLoading) {
    return <VendorAnalyticsSkeleton />;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(123,104,238,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] p-4 pb-24 sm:p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(123,104,238,0.18),_transparent_30%),linear-gradient(180deg,_#050505_0%,_#0a0a0a_100%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <Link
            href="/dashboard"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
            <p className="text-lg font-semibold">We couldn’t load your analytics.</p>
            <p className="mt-2 text-sm text-rose-700 dark:text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(123,104,238,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] p-4 pb-24 sm:p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(123,104,238,0.18),_transparent_30%),linear-gradient(180deg,_#050505_0%,_#0a0a0a_100%)]">
      <div className="mx-auto max-w-6xl space-y-6">
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
                Vendor analytics
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Performance dashboard
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
                Monitor transaction volume, average order size, completion rate, and dispute rate across the last {periodLabel.toLowerCase()}.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            <div className="flex items-center gap-2 font-medium text-zinc-950 dark:text-white">
              <Clock3 className="h-4 w-4 text-[var(--accent)]" />
              {periodLabel}
            </div>
            {generatedAt ? <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Updated {generatedAt}</p> : null}
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total transaction volume"
            value={formatUSDC(metrics.totalTransactionVolume)}
            hint="Aggregate volume for the selected period"
            icon={<TrendingUp className="h-5 w-5 text-[#1B2A6B] dark:text-[#8DA0FF]" />}
            tone="bg-blue-50 dark:bg-blue-500/10"
          />
          <MetricCard
            label="Average order value"
            value={formatUSDC(metrics.averageOrderValue)}
            hint="Mean ticket size across completed orders"
            icon={<ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            tone="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <MetricCard
            label="Completion rate"
            value={formatRate(metrics.completionRate)}
            hint="Share of orders that reached completion"
            icon={<BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            tone="bg-amber-50 dark:bg-amber-500/10"
          />
          <MetricCard
            label="Dispute rate"
            value={formatRate(metrics.disputeRate)}
            hint="Share of orders escalated into disputes"
            icon={<ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
            tone="bg-rose-50 dark:bg-rose-500/10"
          />
        </section>

        <section className="rounded-[2rem] border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">Transaction volume trend</h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                The line chart shows daily transaction volume over the last 30 days. Hover or tap a point to review the full daily snapshot.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-[#1B2A6B]" />
              Transaction volume
            </div>
          </div>

          <div className="mt-6 h-[320px] w-full sm:h-[360px]">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-[1.75rem] border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                No analytics points were returned for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volumeStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B2A6B" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#7B68EE" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B2A6B" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#7B68EE" stopOpacity={0.02} />
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
                    tickFormatter={(value) => formatAxisLabel(String(value), isMobile)}
                    tick={{ fill: "#71717a", fontSize: isMobile ? 11 : 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    width={isMobile ? 44 : 64}
                    tickFormatter={(value) => formatCompactVolume(Number(value))}
                    tick={{ fill: "#71717a", fontSize: isMobile ? 11 : 12 }}
                  />
                  <Tooltip content={<AnalyticsTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="transactionVolume"
                    stroke="url(#volumeStroke)"
                    strokeWidth={3}
                    fill="url(#volumeFill)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
