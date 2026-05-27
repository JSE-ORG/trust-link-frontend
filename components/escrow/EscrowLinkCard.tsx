"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

async function fetchEscrowLink() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    title: "Escrow Agreement 1293",
    status: "Active",
    amount: "$12,450",
    expires: "May 31, 2026",
  };
}

export default function EscrowLinkCard({ loading = false }: { loading?: boolean }) {
  const [link, setLink] = useState<
    | {
        title: string;
        status: string;
        amount: string;
        expires: string;
      }
    | null
  >(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchEscrowLink().then(setLink).catch(setError);
  }, []);

  if (error) throw error;

  if (loading || !link) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <Skeleton className="mb-4 h-6 w-2/3" />
        <Skeleton className="mb-4 h-4 w-1/2" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-3xl" />
          <Skeleton className="h-12 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">{link.title}</h2>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{link.status}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Amount</p>
          <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">{link.amount}</p>
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Expires</p>
          <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">{link.expires}</p>
        </div>
      </div>
    </div>
  );
}
