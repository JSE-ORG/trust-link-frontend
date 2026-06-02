"use client";

import { getAdminDisputes } from "@/lib/api";
import { Dispute } from "@/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatUSDC } from "@/utils/currency";

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
    <section 
      className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="disputes-heading"
    >
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="disputes-heading" className="text-3xl font-semibold text-zinc-950 dark:text-white">Admin Disputes</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
            Open Disputes: <span className="font-medium">{disputes.length}</span>
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          Sort by
          <select
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={sortField}
            onChange={(event) => setSortField(event.target.value as SortField)}
            aria-label="Sort disputes by field"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="status">Status</option>
          </select>
        </label>
      </header>

      {isLoading ? <p className="text-sm text-zinc-500" role="status" aria-live="polite">Loading disputes...</p> : null}
      {error ? <p className="text-sm text-red-600" role="alert" aria-live="assertive">{error}</p> : null}

      {!isLoading && !error && sortedDisputes.length === 0 ? (
        <p className="text-sm text-zinc-500" role="status">No open disputes right now.</p>
      ) : null}

      {!isLoading && !error && sortedDisputes.length > 0 ? (
        <div className="space-y-4" role="list" aria-label="Disputes list">
          {sortedDisputes.map((dispute) => (
            <article
              key={dispute.id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              role="listitem"
              aria-labelledby={`dispute-${dispute.id}-title`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p 
                    id={`dispute-${dispute.id}-title`}
                    className="text-sm font-medium text-zinc-950 dark:text-zinc-100"
                  >
                    {dispute.escrow.item}
                  </p>
                  <p className="text-xs text-zinc-500" aria-label={`Escrow ID ${dispute.escrowId}`}>
                    Escrow #{dispute.escrowId}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300" aria-label="Dispute reason">
                    {dispute.reason}
                  </p>
                </div>
                <div className="space-y-1 text-sm sm:text-right">
                  <p className="font-medium text-zinc-950 dark:text-zinc-100">
                    {formatUSDC(dispute.escrow.amount)}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400" aria-label={`Status ${dispute.status}`}>
                    {dispute.status}
                  </p>
                  <p className="text-xs text-zinc-500" aria-label={`Created on ${new Date(dispute.createdAt).toLocaleString()}`}>
                    {new Date(dispute.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-500" aria-label={`${dispute.evidence.length} evidence links`}>
                  Evidence links: <span className="font-medium">{dispute.evidence.length}</span>
                </p>
                <Link
                  href={`/admin/disputes/${dispute.id}`}
                  className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  aria-label={`View dispute for ${dispute.escrow.item}`}
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
