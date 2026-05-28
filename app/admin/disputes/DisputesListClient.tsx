"use client";

import { getAdminDisputes } from "@/lib/api";
import { Dispute } from "@/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SortField = "date" | "amount" | "status";

function sortDisputes(disputes: Dispute[], field: SortField): Dispute[] {
  return [...disputes].sort((a, b) => {
    if (field === "date") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (field === "amount") {
      return b.escrow.amount - a.escrow.amount;
    }
    return a.status.localeCompare(b.status);
  });
}

export function DisputesListClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  useEffect(() => {
    const token = window.localStorage.getItem("wallet.jwt");

    if (!token) {
      router.push("/");
      return;
    }

    const loadDisputes = async () => {
      try {
        const data = await getAdminDisputes(token);
        setDisputes(data);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Failed to load disputes";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDisputes();
  }, [router]);

  const sortedDisputes = useMemo(() => sortDisputes(disputes, sortField), [disputes, sortField]);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-white">Admin Disputes</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Open Disputes: <span className="font-medium">{disputes.length}</span>
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          Sort by
          <select
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={sortField}
            onChange={(event) => setSortField(event.target.value as SortField)}
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="status">Status</option>
          </select>
        </label>
      </header>

      {isLoading ? <p className="text-sm text-zinc-500">Loading disputes...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && sortedDisputes.length === 0 ? (
        <p className="text-sm text-zinc-500">No open disputes right now.</p>
      ) : null}

      {!isLoading && !error && sortedDisputes.length > 0 ? (
        <div className="space-y-4">
          {sortedDisputes.map((dispute) => (
            <article
              key={dispute.id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-100">
                    {dispute.escrow.item}
                  </p>
                  <p className="text-xs text-zinc-500">Escrow #{dispute.escrowId}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{dispute.reason}</p>
                </div>
                <div className="space-y-1 text-sm sm:text-right">
                  <p className="font-medium text-zinc-950 dark:text-zinc-100">
                    {dispute.escrow.amount} USDC
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">{dispute.status}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(dispute.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-500">
                  Evidence links: <span className="font-medium">{dispute.evidence.length}</span>
                </p>
                <Link
                  href={`/admin/disputes/${dispute.id}`}
                  className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  View Dispute
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
