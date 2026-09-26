"use client";

import dynamic from "next/dynamic";
import { type JSX, useEffect, useMemo,useState } from "react";
import { useTranslation } from "react-i18next";

import { getVendorAnalytics, type VendorAnalyticsPoint, type VendorAnalyticsResponse } from "@/lib/api";

/** `localStorage` key under which the wallet session JWT is stored. */
const AUTH_TOKEN_STORAGE_KEY = "wallet.jwt";

/** Media query below which the chart switches to its compact mobile layout. */
const MOBILE_MEDIA_QUERY = "(max-width: 640px)";

/**
 * Recharts-backed chart, loaded lazily on the client only.
 *
 * Recharts measures the DOM and would bloat the server bundle, so it is split
 * out with `ssr: false` and shows a pulsing placeholder while the chunk loads.
 */
const VendorAnalyticsChart = dynamic(
  () => import("./VendorAnalyticsChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[250px] w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900/50" />
    ),
  }
);

/**
 * Compact analytics chart shown in the vendor dashboard overview.
 *
 * Takes no props. On mount it reads the wallet JWT from `localStorage` and
 * fetches the vendor's analytics via {@link getVendorAnalytics}, then renders
 * one of three states:
 *
 * - **Loading** – a pulsing skeleton while the request is in flight.
 * - **Empty** – a dashed placeholder with `dashboard.analyticsPage.noData` when
 *   there is no token, the request fails, or no data points are returned.
 * - **Data** – the lazily loaded {@link VendorAnalyticsChart}.
 *
 * Fetch errors are logged to the console rather than surfaced, so a failure
 * degrades to the empty state instead of breaking the dashboard.
 *
 * Requires i18next to be initialised for translation keys.
 */
export default function DashboardAnalyticsSummary(): JSX.Element {
  const { t } = useTranslation();
  /** Last successful analytics response, or `null` before load / on failure. */
  const [analytics, setAnalytics] = useState<VendorAnalyticsResponse | null>(null);
  /** `true` until the initial fetch settles (or is skipped for lack of a token). */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /** Whether the viewport currently matches {@link MOBILE_MEDIA_QUERY}. */
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Track the mobile breakpoint so the chart can adapt its axes and labels.
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const syncBreakpoint = (): void => setIsMobile(mediaQuery.matches);
    syncBreakpoint();
    mediaQuery.addEventListener("change", syncBreakpoint);
    return () => mediaQuery.removeEventListener("change", syncBreakpoint);
  }, []);

  // Fetch analytics once on mount. `mounted` guards against setting state
  // after unmount when the request resolves late.
  useEffect(() => {
    let mounted = true;
    async function fetchAnalytics(): Promise<void> {
      const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await getVendorAnalytics(token);
        if (mounted) setAnalytics(data);
      } catch (err: unknown) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    fetchAnalytics();
    return () => {
      mounted = false;
    };
  }, []);

  /** Chart series; an empty array when analytics are missing. */
  const chartData = useMemo<VendorAnalyticsPoint[]>(() => {
    return analytics?.dataPoints ?? [];
  }, [analytics]);

  if (isLoading) {
    return <div className="h-[250px] w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900/50" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
        {t("dashboard.analyticsPage.noData")}
      </div>
    );
  }

  return (
    <div className="h-[250px] w-full">
      <VendorAnalyticsChart dataPoints={chartData} isMobile={isMobile} />
    </div>
  );
}
