"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

async function fetchTrackingEvents() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return [
    { time: "09:45", title: "Package received", detail: "The courier picked up the shipment." },
    { time: "12:20", title: "In transit", detail: "The package is moving through the sorting facility." },
    { time: "15:10", title: "Out for delivery", detail: "The package is on its final route." },
  ];
}

export default function TrackingTimeline({ loading = false }: { loading?: boolean }) {
  const [events, setEvents] = useState<
    | Array<{ time: string; title: string; detail: string }>
    | null
  >(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchTrackingEvents().then(setEvents).catch(setError);
  }, []);

  if (error) throw error;

  if (loading || !events) {
    return (
      <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-start gap-4">
            <Skeleton className="h-4 w-14 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {events.map((event) => (
        <div key={event.time} className="flex items-start gap-4">
          <div className="min-w-[56px] text-sm font-semibold text-zinc-700 dark:text-zinc-300">{event.time}</div>
          <div>
            <p className="text-base font-semibold text-zinc-950 dark:text-zinc-100">{event.title}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{event.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
