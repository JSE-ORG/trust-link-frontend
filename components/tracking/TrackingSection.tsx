"use client";

import { useEffect, useState } from "react";

async function fetchTrackingData() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return { update: "Shipment tracking is live and updated every 5 minutes." };
}

export default function TrackingSection() {
  const [data, setData] = useState<{ update: string } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchTrackingData().then(setData).catch(setError);
  }, []);

  if (error) throw error;
  if (!data) {
    return <p className="text-zinc-600 dark:text-zinc-400">Loading tracking details…</p>;
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-lg font-medium text-zinc-950 dark:text-zinc-100">{data.update}</p>
    </div>
  );
}
