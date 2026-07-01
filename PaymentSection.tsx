"use client";

import { useCallback, useEffect, useState, memo } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import FetchErrorState, { getFetchErrorMessage } from "@/components/ui/FetchErrorState";
import { useTranslation } from "react-i18next";

async function fetchPaymentData() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return { status: "ready" };
}

const PaymentSection = ({ loading = false }: { loading?: boolean }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<{ status: string } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(() => {
    setError(null);
    fetchPaymentData().then(setData).catch(setError);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (error) {
    return (
      <FetchErrorState
        title={t("payment.loadErrorTitle")}
        message={getFetchErrorMessage(error, t("payment.loadErrorMessage"))}
        onRetry={loadData}
      />
    );
  }

  if (loading || !data) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <Skeleton className="mb-4 h-6 w-1/3" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-lg font-medium text-zinc-950 dark:text-zinc-100">{t("payment.status")}</p>
    </div>
  );
};

export default memo(PaymentSection);
