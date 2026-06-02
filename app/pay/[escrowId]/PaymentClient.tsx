"use client";

import { useState } from "react";
import Link from "next/link";
import { Escrow } from "@/types";
import { useWallet } from "@/components/providers/WalletProvider";
import { useTranslation } from "react-i18next";
import { formatUSDC } from "@/utils/currency";
import { track } from "@/lib/analytics";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function PaymentClient({ escrow }: { escrow: Escrow }) {
  const { t, i18n } = useTranslation();
  const { publicKey, connect, isLoading, error: walletError } = useWallet();
  const isConnected = Boolean(publicKey);

  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmitPayment = async () => {
    setIsSubmitting(true);
    setPaymentError(null);
    track("payment_initiated", { escrowId: escrow.id });
    try {
      const res = await fetch(`${API_URL}/escrows/${escrow.id}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerPublicKey: publicKey }),
      });
      if (!res.ok) throw new Error("Payment submission failed");
      const data = await res.json();
      setTxHash(data.txHash ?? data.transactionHash ?? data.hash ?? "mock_tx_hash");
      track("payment_completed", { escrowId: escrow.id });
    } catch (e: unknown) {
      setPaymentError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedAmount = formatUSDC(escrow.amount);

  if (txHash) {
    return (
      <div
        data-testid="payment-confirmation"
        className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950"
      >
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-green-900 dark:text-green-100">
          {t("payment.confirmationTitle")}
        </h2>
        <p className="mb-1 text-sm text-green-700 dark:text-green-300">{t("payment.txHash")}:</p>
        <p
          data-testid="tx-hash"
          className="mb-6 break-all rounded-lg bg-white px-4 py-2 font-mono text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {txHash}
        </p>
        <Link
          href={`/track/${escrow.id}`}
          data-testid="track-link"
          className="inline-block rounded-2xl bg-green-600 px-8 py-3 font-semibold text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
        >
          {t("payment.viewTracking")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Order summary */}
      <h2 className="mb-6 text-xl font-semibold text-zinc-950 dark:text-zinc-100">
        {t("payment.orderSummary")}
      </h2>
      <div className="mb-6 space-y-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
        <div className="flex justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">{t("payment.item")}:</span>
          <span className="font-medium text-zinc-950 dark:text-zinc-100">{escrow.item}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">{t("payment.amount")}:</span>
          <span className="font-medium text-zinc-950 dark:text-zinc-100">{formattedAmount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">{t("payment.escrowId")}:</span>
          <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{escrow.id}</span>
        </div>
      </div>

      {/* Wallet connection */}
      {!isConnected ? (
        <button
          onClick={connect}
          disabled={isLoading}
          data-testid="connect-wallet-btn"
          className="w-full rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          {isLoading ? "Connecting..." : t("payment.connectWallet")}
        </button>
      ) : (
        <div className="space-y-3">
          <div
            data-testid="wallet-connected"
            className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
          >
            ✓ {publicKey?.slice(0, 8)}…{publicKey?.slice(-4)}
          </div>
          <button
            onClick={handleSubmitPayment}
            disabled={isSubmitting}
            data-testid="submit-payment-btn"
            className="w-full rounded-2xl bg-zinc-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? t("payment.submitting") : t("payment.submitPayment")}
          </button>
        </div>
      )}

      {walletError && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{walletError}</p>
      )}
      {paymentError && (
        <p data-testid="payment-error" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {paymentError}
        </p>
      )}
    </div>
  );
}
