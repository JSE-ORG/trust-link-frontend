"use client";

import { useTranslation } from "react-i18next";

import DashboardAnalyticsSummary from "@/components/dashboard/DashboardAnalyticsSummary";
import VendorDashboardList from "@/components/dashboard/VendorDashboardList";

/**
 * Renders the main dashboard section displaying analytics and escrows.
 *
 * @returns {React.ReactElement} The dashboard section component.
 */
export default function DashboardSection() {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">{t("dashboard.analyticsOverview")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("dashboard.analyticsOverviewDescription")}
          </p>
        </div>
        <DashboardAnalyticsSummary />
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">{t("dashboard.yourEscrows")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("dashboard.yourEscrowsDescription")}
          </p>
        </div>
        <VendorDashboardList />
      </div>
    </section>
  );
}
