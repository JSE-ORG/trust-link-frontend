"use client";

import { useCallback, useEffect, useState } from "react";

import TrackingTimelineSkeleton from "@/components/tracking/TrackingTimelineSkeleton";
import FetchErrorState, { getFetchErrorMessage } from "@/components/ui/FetchErrorState";

async function fetchTrackingData() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return { update: "Shipment tracking is live and updated every 5 minutes." };
}

export default function TrackingSection() {
  const [data, setData] = useState<{ update: string } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    setError(null);
    setIsLoading(true);
    fetchTrackingData()
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
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

  if (isLoading || !data) {
    return (
      <div
        className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        role="status"
        aria-live="polite"
        aria-label="Loading tracking details"
      >
        <TrackingTimelineSkeleton />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-lg font-medium text-zinc-950 dark:text-zinc-100">{data.update}</p>
    </div>
  );
}
