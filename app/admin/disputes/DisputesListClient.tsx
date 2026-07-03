"use client";

import { getAdminDisputes } from "@/lib/api";
import { Dispute } from "@/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatUSDC } from "@/utils/currency";
import FetchErrorState, { getFetchErrorMessage } from "@/components/ui/FetchErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTranslation } from "react-i18next";
import { formatTimeAgo } from "@/lib/utils";

type SortField = "date" | "amount" | "status";

function DisputesListSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading disputes">
      {[...Array(3)].map((_, index) => (
        <article
          key={index}
          className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="w-full max-w-md space-y-3">
              <Skeleton className="h-4 w-2/3 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
            <div className="space-y-2 sm:w-32">
              <Skeleton className="h-4 w-24 rounded-md sm:ml-auto" />
              <Skeleton className="h-4 w-20 rounded-md sm:ml-auto" />
              <Skeleton className="h-3 w-28 rounded-md sm:ml-auto" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </article>
      ))}
    </div>
  );
}

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
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  useEffect(() => {
    let isMounted = true;
    const token = window.localStorage.getItem("wallet.jwt");

    if (!token) {
      router.push("/");
      return;
    }

    const loadDisputes = async () => {
      try {
        const data = await getAdminDisputes(token);
        if (isMounted) setDisputes(data);
      } catch (caught) {
        if (isMounted) {
          const message = caught instanceof Error ? caught.message : "Failed to load disputes";
          setError(message);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDisputes();
    return () => { isMounted = false; };
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

      {isLoading ? <DisputesListSkeleton /> : null}
      {error ? (
        <FetchErrorState
          title="We couldn't load disputes"
          message={getFetchErrorMessage(error, "Failed to load disputes.")}
          onRetry={() => {
            setError(null);
            setIsLoading(true);
            void getAdminDisputes(window.localStorage.getItem("wallet.jwt") ?? "")
              .then(setDisputes)
              .catch((caught) => {
                setError(caught instanceof Error ? caught.message : "Failed to load disputes");
              })
              .finally(() => setIsLoading(false));
          }}
          className="min-h-[160px]"
        />
      ) : null}

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
              aria-labelledby={`dispute-title-${dispute.id}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p 
                    id={`dispute-title-${dispute.id}`}
                    className="text-sm font-medium text-zinc-950 dark:text-zinc-100"
                  >
                    {dispute.escrow.item}
                  </p>
                  <p className="text-xs text-zinc-500">
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
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {dispute.status}
                  </p>
                  <p className="text-xs text-zinc-500" aria-label={`Created ${formatTimeAgo(dispute.createdAt, i18n.language)}`}>
                    {formatTimeAgo(dispute.createdAt, i18n.language)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-500">
                  Evidence links: <span className="font-medium">{dispute.evidence.length}</span>
                </p>
                <Link href={`/admin/disputes/${dispute.id}`}>
                  <a
                    className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    aria-label={`View dispute for ${dispute.escrow.item}`}
                  >
                    View Dispute
                  </a>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
