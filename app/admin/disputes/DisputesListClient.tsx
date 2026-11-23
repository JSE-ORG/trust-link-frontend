"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import FetchErrorState, { getFetchErrorMessage } from "@/components/ui/FetchErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAdminDisputes } from "@/lib/api";
import { SESSION_KEY } from "@/lib/session";
import { formatTimeAgo } from "@/lib/utils";
import { Dispute } from "@/types";
import { formatUSDC } from "@/utils/currency";

type SortField = "date" | "amount" | "status";
export type StatusFilter = "all" | "open" | "resolved";

function isValidStatusFilter(value: string | null): value is StatusFilter {
  return value === "all" || value === "open" || value === "resolved";
}

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  const queryStatus = searchParams?.get("status")?.toLowerCase() ?? null;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    return isValidStatusFilter(queryStatus) ? queryStatus : "all";
  });

  useEffect(() => {
    const param = searchParams?.get("status")?.toLowerCase() ?? null;
    if (isValidStatusFilter(param)) {
      setStatusFilter(param);
    } else if (!param) {
      setStatusFilter("all");
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    const token = window.localStorage.getItem(SESSION_KEY);

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

  const counts = useMemo(() => {
    const all = disputes.length;
    const open = disputes.filter((d) => d.status.toLowerCase() !== "resolved").length;
    const resolved = disputes.filter((d) => d.status.toLowerCase() === "resolved").length;
    return { all, open, resolved };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    if (statusFilter === "open") {
      return disputes.filter((d) => d.status.toLowerCase() !== "resolved");
    }
    if (statusFilter === "resolved") {
      return disputes.filter((d) => d.status.toLowerCase() === "resolved");
    }
    return disputes;
  }, [disputes, statusFilter]);

  const sortedDisputes = useMemo(
    () => sortDisputes(filteredDisputes, sortField),
    [filteredDisputes, sortField]
  );

  const tabs: Array<{ id: StatusFilter; label: string; count: number }> = [
    { id: "all", label: "All", count: counts.all },
    { id: "open", label: "Open / Investigating", count: counts.open },
    { id: "resolved", label: "Resolved", count: counts.resolved },
  ];

  const handleTabChange = (newFilter: StatusFilter) => {
    setStatusFilter(newFilter);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (newFilter === "all") {
      params.delete("status");
    } else {
      params.set("status", newFilter);
    }
    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    const nextTab = tabs[nextIndex];
    handleTabChange(nextTab.id);
    const tabEl = document.getElementById(`tab-${nextTab.id}`);
    tabEl?.focus();
  };

  return (
    <section 
      className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="disputes-heading"
    >
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="disputes-heading" className="text-3xl font-semibold text-zinc-950 dark:text-white">Admin Disputes</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
            Open Disputes: <span className="font-medium">{counts.open}</span>
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

      <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div
          role="tablist"
          aria-label="Filter disputes by status"
          className="flex space-x-2"
        >
          {tabs.map((tab, index) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isSelected}
                aria-controls="disputes-tabpanel"
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSelected
                    ? "border-zinc-900 text-zinc-950 dark:border-white dark:text-white"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isSelected
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "bg-zinc-100/70 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div id="disputes-tabpanel" role="tabpanel" aria-labelledby={`tab-${statusFilter}`}>
        {isLoading ? <DisputesListSkeleton /> : null}
        {error ? (
          <FetchErrorState
            title="We couldn't load disputes"
            message={getFetchErrorMessage(error, "Failed to load disputes.")}
            onRetry={() => {
              setError(null);
              setIsLoading(true);
              void getAdminDisputes(window.localStorage.getItem(SESSION_KEY) ?? "")
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
          <p className="text-sm text-zinc-500" role="status">
            {statusFilter === "open"
              ? "No open disputes right now."
              : statusFilter === "resolved"
              ? "No resolved disputes right now."
              : "No disputes right now."}
          </p>
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
      </div>
    </section>
  );
}
