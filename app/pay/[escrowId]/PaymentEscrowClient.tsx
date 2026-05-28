"use client";

import { useMemo, useState } from "react";
import { Escrow } from "@/types";
import { TrustBadge } from "@/components/payment/TrustBadge";
import { useWallet } from "@/components/providers/WalletProvider";
import { connectFreighter, isFreighterInstalled } from "@/lib/stellar/freighter";

interface PaymentEscrowClientProps {
  escrow: Escrow;
  escrowId: string;
}

const PLATFORM_FEE_PERCENT = 1.5;

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function PaymentEscrowClient({ escrow, escrowId }: PaymentEscrowClientProps) {
  const { connect, isLoading } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const amount = escrow.amount;
  const fee = useMemo(() => Number(((amount * PLATFORM_FEE_PERCENT) / 100).toFixed(2)), [amount]);
  const total = useMemo(() => Number((amount + fee).toFixed(2)), [amount, fee]);
  const contractAddress = escrow.contractAddress ?? process.env.NEXT_PUBLIC_CONTRACT_ID ?? escrow.id;

  const isFunded = escrow.status === "FUNDED";
  const isExpired = escrow.status === "EXPIRED";

  const handlePayNow = async () => {
    setError(null);
    setSuccess(null);
    setIsPaying(true);

    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        setError("Freighter is not installed. Please install Freighter to continue.");
        return;
      }

      // Prompts Freighter and triggers the wallet signature challenge flow.
      await connectFreighter();
      await connect();
      setSuccess("Freighter signature completed. Your payment authorization was captured.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to trigger wallet signature.";
      setError(message);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-100">Complete Payment</h1>
        <p className="mt-1 text-sm text-zinc-500">Escrow ID: {escrowId}</p>
      </header>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">Order Details</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Item</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{escrow.item}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Vendor Address</dt>
            <dd className="max-w-[220px] truncate font-mono text-zinc-900 dark:text-zinc-100">
              {escrow.vendorId}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Amount</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{formatUsd(amount)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Platform Fee ({PLATFORM_FEE_PERCENT}%)</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{formatUsd(fee)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-2 dark:border-zinc-800">
            <dt className="font-semibold text-zinc-900 dark:text-zinc-100">Total</dt>
            <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{formatUsd(total)}</dd>
          </div>
        </dl>
      </div>

      <TrustBadge contractAddress={contractAddress} />

      {isFunded ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          This escrow is already funded.
        </div>
      ) : null}
      {isExpired ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          This escrow has expired and can no longer be funded.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {success}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handlePayNow}
        disabled={isPaying || isLoading || isFunded || isExpired}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPaying || isLoading ? "Waiting for Freighter..." : "Pay Now"}
      </button>
    </section>
  );
}
