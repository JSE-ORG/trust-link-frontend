"use client";

import React, { useState } from "react";
import useWallet from "@/hooks/useWallet";
import { signTransaction } from "@/lib/stellar/freighter";
import { getStellarExpertUrl } from "@/lib/explorer";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNetwork } from "@/components/providers/NetworkProvider";

export interface PaymentFormProps {
  escrowId: string;
  itemName: string;
  amount: number;
  protocolFee: number;
  total: number;
  sellerAddress: string;
  escrowContractId: string;
  status: string;
  onPaymentSuccess?: (txHash: string) => void;
}

// Helper to truncate tx hash
function truncateHash(hash: string) {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

// Mock backend API call to get a transaction XDR to sign
async function mockFetchTransactionXdr(escrowId: string): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return "mock_xdr_base64_string_for_escrow_" + escrowId;
}

// Mock backend API call to submit the signed XDR
async function mockSubmitTransaction(signedXdr: string): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (!signedXdr) throw new Error("Invalid transaction signature");
  // Generate a fake hash that looks somewhat real
  return "3f7a" + Math.random().toString(16).substring(2, 10) + "91bc";
}

export default function PaymentForm({
  escrowId,
  itemName,
  amount,
  protocolFee,
  total,
  sellerAddress,
  escrowContractId,
  status,
  onPaymentSuccess,
}: PaymentFormProps) {
  const { status: walletStatus } = useWallet();
  const { network } = useNetwork();
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isDisconnected = walletStatus !== "connected";

  const handlePayment = async () => {
    if (isDisconnected) {
      toast.error("Wallet not connected");
      return;
    }

    if (status !== "PENDING" && status !== "Active") {
      setErrorMessage("Escrow is no longer payable");
      setFormState("error");
      toast.error("Escrow is no longer payable");
      return;
    }

    try {
      setFormState("loading");
      setErrorMessage(null);

      // 1. Fetch transaction XDR from "backend"
      const xdr = await mockFetchTransactionXdr(escrowId);

      // 2. Request signature from Freighter
      const networkPassphrase =
        process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
        "Test SDF Network ; September 2015";
      const signedXdr = await signTransaction(xdr, networkPassphrase);

      // 3. Submit transaction to "backend" or Horizon
      const hash = await mockSubmitTransaction(signedXdr);

      setTxHash(hash);
      setFormState("success");
      toast.success("Payment successful");
      onPaymentSuccess?.(hash);
    } catch (err: any) {
      console.error(err);
      let msg = "Network request failed";
      
      // Handle user rejection or standard errors
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes("reject") || err.message.toLowerCase().includes("cancel")) {
          msg = "Transaction was rejected in wallet";
        } else {
          msg = err.message;
        }
      } else if (typeof err === "string") {
        msg = err;
      }
      
      setErrorMessage(msg);
      setFormState("error");
      toast.error(msg);
    }
  };

  const isSubmitting = formState === "loading";

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Payment Details
      </h2>

      <div className="mb-6 space-y-4">
        <div className="flex justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-400">Item Amount</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            XLM {amount}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-400">Protocol Fee</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            XLM {protocolFee}
          </span>
        </div>
        <div className="flex justify-between pt-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Total</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            XLM {total}
          </span>
        </div>
      </div>

      {formState === "success" && txHash ? (
        <div className="mt-6 rounded-2xl bg-green-50 p-4 border border-green-100 dark:bg-green-950/30 dark:border-green-900">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
            Payment successful
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            Transaction: {truncateHash(txHash)}
          </p>
          <a
            href={getStellarExpertUrl(txHash, network)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-green-700 underline hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            View on Stellar Expert
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {isDisconnected && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Connect wallet to continue
            </p>
          )}

          {formState === "error" && errorMessage && (
            <div className="rounded-xl bg-red-50 p-3 border border-red-100 dark:bg-red-950/30 dark:border-red-900">
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handlePayment}
            disabled={isDisconnected || isSubmitting}
            aria-disabled={isDisconnected || isSubmitting}
            className="flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span aria-live="polite">Processing payment...</span>
              </>
            ) : (
              "Pay with Freighter"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
