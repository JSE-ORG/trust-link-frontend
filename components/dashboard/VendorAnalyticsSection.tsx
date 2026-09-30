"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getVendorAnalytics, type VendorAnalyticsPoint, type VendorAnalyticsResponse } from "@/lib/api";

import { VendorAnalyticsHeader } from "./VendorAnalyticsHeader";
import { VendorAnalyticsMetricsGrid } from "./VendorAnalyticsMetricsGrid";
import VendorAnalyticsSkeleton from "./VendorAnalyticsSkeleton";
import { VendorAnalyticsTrendSection } from "./VendorAnalyticsTrendSection";

/**
 * Normalizes a given rate to a percentage value between 0 and 100.
 * Useful when the backend might return either a decimal fraction (0.9) or a percentage (90).
 * @param value - The rate value to normalize.
 * @returns The normalized percentage value.
 */
function normalizeRate(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value <= 1 ? value * 100 : value;
}

/**
 * Extracts and calculates summary metrics from a VendorAnalyticsResponse and its data points.
 * Falls back to computing averages or sums from the provided data points if the top-level metrics are missing.
 * @param source - The full analytics response object, or null if unavailable.
 * @param points - The array of data points to use for fallback calculations.
 * @returns An object containing the calculated top-level metrics.
 */
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

/**
 * Renders the vendor analytics dashboard section.
 * Displays top-level metrics and a trend chart, managing its own data fetching and error states.
 */
export default function VendorAnalyticsSection() {
  const { t } = useTranslation();
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
          setError(err instanceof Error ? err.message : t("dashboard.analyticsPage.loadError"));
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
  }, [router, t]);

  const chartData = useMemo(() => {
    return analytics?.dataPoints ?? [];
  }, [analytics]);

  const metrics = pickMetrics(analytics, chartData);
  const periodLabel = analytics?.periodLabel ?? t("dashboard.analyticsPage.defaultPeriod");
  const generatedAt = analytics?.generatedAt
    ? new Date(analytics.generatedAt).toLocaleString()
    : null;

  if (isLoading) {
    return <VendorAnalyticsSkeleton />;
  }

  if (error) {
    return (
      <main className="analytics-page-background min-h-screen p-4 pb-24 sm:p-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <Link
            href="/dashboard"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
            <p className="text-lg font-semibold">{t("dashboard.analyticsPage.loadErrorTitle")}</p>
            <p className="mt-2 text-sm text-rose-700 dark:text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              {t("dashboard.analyticsPage.retry")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="analytics-page-background min-h-screen p-4 pb-24 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <VendorAnalyticsHeader periodLabel={periodLabel} generatedAt={generatedAt} />
        <VendorAnalyticsMetricsGrid metrics={metrics} />
        <VendorAnalyticsTrendSection chartData={chartData} isMobile={isMobile} />
      </div>
    </main>
  );
}
