"use client";

import { useParams } from "next/navigation";
import useEscrow from "@/hooks/useEscrow";
import DisputeForm from "./DisputeForm";
import { Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function RaiseDisputePage() {
  const { id } = useParams<{ id: string }>();
  const { escrow, isLoading, error } = useEscrow(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm font-medium text-[var(--muted)]">Loading order details...</p>
        </div>
      </div>
    );
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
            We couldn't retrieve the details for order #{id}. Please verify the ID and try again.
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
