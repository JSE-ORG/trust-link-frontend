"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CircleCheck,
  Clock,
  DollarSign,
  Package,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { getVendorEscrows } from "@/lib/api";
import { useSubscription } from "@/components/providers/SubscriptionProvider";
import ProGate from "@/components/subscription/ProGate";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Escrow, EscrowStatus } from "@/types";

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

function computeStats(escrows: Escrow[]) {
  const total = escrows.length;
  const byStatus = escrows.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  const totalValue = escrows.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const completed = byStatus["COMPLETED"] ?? 0;
  const disputed = byStatus["DISPUTED"] ?? 0;
  const successRate =
    total > 0 ? Math.round(((completed) / total) * 100) : 0;
  const disputeRate =
    total > 0 ? Math.round((disputed / total) * 100) : 0;

  // Monthly buckets (last 6 months)
  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short" });
    const count = escrows.filter((e) => {
      const c = new Date(e.createdAt);
      return (
        c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
      );
    }).length;
    months.push({ label, count });
  }

  return { total, byStatus, totalValue, completed, disputed, successRate, disputeRate, months };
}

const STATUS_META: Record<EscrowStatus, { label: string; color: string }> = {
  PENDING:   { label: "Pending",   color: "bg-zinc-400" },
  FUNDED:    { label: "Funded",    color: "bg-blue-500" },
  SHIPPED:   { label: "Shipped",   color: "bg-indigo-500" },
  COMPLETED: { label: "Completed", color: "bg-emerald-500" },
  DISPUTED:  { label: "Disputed",  color: "bg-red-500" },
  RELEASED:  { label: "Released",  color: "bg-green-500" },
  REFUNDED:  { label: "Refunded",  color: "bg-orange-400" },
  EXPIRED:   { label: "Expired",   color: "bg-zinc-300" },
};

function AnalyticsContent({ escrows }: { escrows: Escrow[] }) {
  const stats = computeStats(escrows);
  const maxMonth = Math.max(...stats.months.map((m) => m.count), 1);

  const cards: StatCard[] = [
    {
      label: "Total Escrows",
      value: stats.total,
      icon: <Package className="h-5 w-5" />,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Total Value",
      value: `$${stats.totalValue.toLocaleString()} USDC`,
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Completed",
      value: stats.completed,
      sub: `${stats.successRate}% success rate`,
      icon: <CircleCheck className="h-5 w-5" />,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Disputed",
      value: stats.disputed,
      sub: `${stats.disputeRate}% dispute rate`,
      icon: <ShieldAlert className="h-5 w-5" />,
      color: "text-red-500 bg-red-50 dark:bg-red-950/40",
    },
    {
      label: "Active (Funded + Shipped)",
      value: (stats.byStatus["FUNDED"] ?? 0) + (stats.byStatus["SHIPPED"] ?? 0),
      icon: <Truck className="h-5 w-5" />,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      label: "Pending",
      value: stats.byStatus["PENDING"] ?? 0,
      icon: <Clock className="h-5 w-5" />,
      color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className={`rounded-xl p-2 ${c.color}`}>{c.icon}</span>
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-white">
              {c.value}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {c.label}
            </p>
            {c.sub && (
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                {c.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Escrows created (last 6 months)
        </h2>
        <div className="flex items-end gap-3">
          {stats.months.map((m) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {m.count}
              </span>
              <div
                className="w-full rounded-t-lg bg-blue-500 transition-all"
                style={{
                  height: `${Math.max((m.count / maxMonth) * 120, m.count > 0 ? 8 : 2)}px`,
                  opacity: m.count === 0 ? 0.3 : 1,
                }}
              />
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Escrows by status
        </h2>
        <div className="space-y-3">
          {(Object.keys(STATUS_META) as EscrowStatus[])
            .filter((s) => stats.byStatus[s])
            .map((s) => {
              const count = stats.byStatus[s] ?? 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                    {STATUS_META[s].label}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-2 rounded-full ${STATUS_META[s].color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {count}
                  </span>
                </div>
              );
            })}
          {Object.values(stats.byStatus).every((v) => !v) && (
            <p className="text-sm text-zinc-400">No escrow data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isPro, isLoading: planLoading } = useSubscription();
  const [escrows, setEscrows] = useState<Escrow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const jwt = window.localStorage.getItem("wallet.jwt");
    if (!jwt) {
      router.push("/");
      return;
    }
    setIsChecking(false);
  }, [router]);

  useEffect(() => {
    if (isChecking || !isPro || planLoading) return;
    const token = localStorage.getItem("wallet.jwt") ?? undefined;
    getVendorEscrows(token)
      .then(setEscrows)
      .finally(() => setIsLoading(false));
  }, [isChecking, isPro, planLoading]);

  if (isChecking || planLoading) {
    return <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black" />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">
              Analytics
            </h1>
          </div>
        </div>

        {/* Pro gate */}
        <ProGate
          feature="Analytics Dashboard"
          description="Get deep insights into your escrow performance — completions, disputes, monthly trends, and more."
        >
          {isLoading || !escrows ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-52 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          ) : (
            <AnalyticsContent escrows={escrows} />
          )}
        </ProGate>

        {/* Link to upgrade if not pro */}
        {!isPro && (
          <p className="mt-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
            <Link href="/pricing" className="underline underline-offset-2 hover:text-zinc-600">
              View all Pro features →
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
