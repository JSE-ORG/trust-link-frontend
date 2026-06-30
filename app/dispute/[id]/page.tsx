"use client";

import { useParams } from "next/navigation";
import useEscrow from "@/hooks/useEscrow";
import DisputeForm from "./DisputeForm";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatUSDC } from "@/utils/currency";
import { Skeleton } from "@/components/ui/Skeleton";

function DisputePageSkeleton() {
  return (
    <main
      className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6"
      role="status"
      aria-live="polite"
      aria-label="Loading order details"
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 flex flex-col items-center">
          <Skeleton className="mb-3 h-10 w-72 max-w-full" />
          <Skeleton className="h-5 w-56 max-w-full" />
        </header>

        <section className="mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <Skeleton className="h-6 w-40" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-36 max-w-full" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <Skeleton className="h-6 w-36" />
          <div className="mt-5 space-y-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function RaiseDisputePage() {
  const { id } = useParams<{ id: string }>();
  const { escrow, isLoading, error } = useEscrow(id);

  if (isLoading) {
    return <DisputePageSkeleton />;
  }

  if (error || !escrow) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-black">
        <div className="max-w-md w-full bg-white dark:bg-zinc-950 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--destructive)]">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-xl font-bold mb-2">Order Not Found</h1>
          <p className="text-sm text-[var(--muted)] mb-8">
            We could not retrieve the details for order #{id}. Please verify the ID and try again.
          </p>
          <Link
            href="/"
            className="block w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold transition-transform active:scale-95"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 dark:text-white mb-3">
            Raise a Dispute
          </h1>
          <p className="text-[var(--muted)] font-medium">
            Order #{escrow.id.slice(0, 8)} • {escrow.item}
          </p>
        </header>

        <section className="mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Order summary</h2>
          <dl className="mt-4 grid gap-3 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Order</dt>
              <dd className="font-medium text-zinc-950 dark:text-zinc-100">{escrow.item}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Amount</dt>
              <dd className="font-medium text-zinc-950 dark:text-zinc-100">{formatUSDC(escrow.amount)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Status</dt>
              <dd className="font-medium text-zinc-950 dark:text-zinc-100">{escrow.status}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Reference</dt>
              <dd className="font-mono text-zinc-950 dark:text-zinc-100">{escrow.id}</dd>
            </div>
          </dl>
        </section>

        <DisputeForm escrowId={escrow.id} />

        <footer className="mt-12 text-center">
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
            Need help? Contact our support team at <a href="mailto:support@trustlink.example" className="text-[var(--accent)] hover:underline">support@trustlink.example</a> for immediate assistance.
          </p>
        </footer>
      </div>
    </main>
  );
}
