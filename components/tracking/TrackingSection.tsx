"use client";

import { useCallback, useEffect, useState } from "react";
import FetchErrorState, { getFetchErrorMessage } from "@/components/ui/FetchErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

async function fetchTrackingData() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return { update: "Shipment tracking is live and updated every 5 minutes." };
}

export default function TrackingSection() {
  const [data, setData] = useState<{ update: string } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(() => {
    setError(null);
    fetchTrackingData().then(setData).catch(setError);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(loadData);
    return () => window.cancelAnimationFrame(frame);
  }, [loadData]);

  if (error) {
    return (
      <FetchErrorState
        title="We couldn't load tracking details"
        message={getFetchErrorMessage(error, "Failed to load tracking details.")}
        onRetry={loadData}
      />
    );
  }

  if (!data) {
    return (
      <div
        className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        role="status"
        aria-live="polite"
        aria-label="Loading tracking details"
      >
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
      <p className="text-lg font-medium text-zinc-950 dark:text-zinc-100">{data.update}</p>
    </div>
  );
}
