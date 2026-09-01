"use client";

import { rpc, TransactionBuilder } from "@stellar/stellar-sdk";
import { Download, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useNetwork } from "@/components/providers/NetworkProvider";
import useWallet from "@/hooks/useWallet";
import { patchBuyerContact } from "@/lib/api";
import { getStellarExpertTxUrl } from "@/lib/explorer";
import { generateReceiptPDF } from "@/lib/pdf";
import { buildContractInvocation, parseContractError } from "@/lib/stellar/contract";
import { signTransaction } from "@/lib/stellar/freighter";
import { EscrowStatusConst } from "@/types";


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
  /** Storybook preview overrides. */
  previewFormState?: "idle" | "loading" | "success" | "error";
  previewErrorMessage?: string | null;
  previewTxHash?: string | null;
  previewWalletDisconnected?: boolean;
}

function truncateHash(hash: string) {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/** Set to "true" to keep using the mocked transaction pipeline (development only). */
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const DEFAULT_SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

/**
 * Builds the real funding transaction XDR for the escrow contract via
 * `@/lib/stellar/contract`. Returns an unsigned XDR ready to be signed by the
 * buyer's wallet.
 */
export async function buildFundingTransactionXdr(options: {
  escrowId: string;
  escrowContractId: string;
  sourceAccount: string;
  network: "TESTNET" | "PUBLIC";
}): Promise<string> {
  const { escrowId, escrowContractId, sourceAccount, network } = options;

  if (!escrowContractId || !escrowContractId.startsWith("C")) {
    throw new Error("Invalid escrow contract ID");
  }

  return buildContractInvocation({
    contractId: escrowContractId,
    method: "fund_escrow",
    args: [escrowId],
    sourceAccount,
    network,
  });
}

/**
 * Submits a signed Soroban transaction to the network RPC and waits for the
 * ledger to close, returning the transaction hash. Throws on Soroban error
 * codes (`TxFailed` / `TxExpired`) so callers can surface them.
 */
export async function submitTransaction(
  signedXdr: string,
  rpcUrl: string,
  networkPassphrase: string
): Promise<string> {
  if (!signedXdr) throw new Error("Invalid transaction signature");

  const server = new rpc.Server(rpcUrl);
  const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  const response = await server.sendTransaction(tx);

  if (response.status === "ERROR") {
    const resultCode =
      response.errorResult?.result().switch().name ?? "Transaction failed";
    throw new Error(`Transaction failed: ${resultCode}`);
  }

  const hash = response.hash;

  let txResponse = await server.getTransaction(hash);
  let attempts = 10;
  while (
    txResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND &&
    attempts > 0
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    txResponse = await server.getTransaction(hash);
    attempts -= 1;
  }

  if (txResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
    const resultCode =
      txResponse.resultXdr?.result().switch().name ?? "Transaction failed";
    throw new Error(
      resultCode.includes("TxFailed") || resultCode.includes("tx_failed")
        ? `TxFailed: ${resultCode}`
        : resultCode.includes("TxExpired") || resultCode.includes("tx_expired")
          ? `TxExpired: ${resultCode}`
          : `Transaction failed: ${resultCode}`
    );
  }

  if (txResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    throw new Error("Timed out waiting for transaction to be included in a ledger");
  }

  return hash;
}

export async function mockFetchTransactionXdr(escrowId: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return "mock_xdr_base64_string_for_escrow_" + escrowId;
}

export async function mockSubmitTransaction(signedXdr: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (!signedXdr) throw new Error("Invalid transaction signature");
  return "3f7a" + Math.random().toString(16).substring(2, 10) + "91bc";
}

export default function PaymentForm({
  escrowId,
  itemName,
  amount,
  protocolFee,
  total,
  status,
  escrowContractId,
  onPaymentSuccess,
  previewFormState,
  previewErrorMessage,
  previewTxHash,
  previewWalletDisconnected,
}: PaymentFormProps) {
  const { t } = useTranslation();
  const { status: walletStatus, publicKey } = useWallet();
  const { network } = useNetwork();
  const [internalFormState, setInternalFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [internalErrorMessage, setInternalErrorMessage] = useState<string | null>(null);
  const [internalTxHash, setInternalTxHash] = useState<string | null>(null);
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sendReceipt, setSendReceipt] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const formState = previewFormState ?? internalFormState;
  const errorMessage =
    previewFormState === "error" ? previewErrorMessage ?? "Transaction was rejected in wallet" : previewErrorMessage ?? internalErrorMessage;
  const txHash =
    previewFormState === "success" ? previewTxHash ?? "3f7a91bc" : previewTxHash ?? internalTxHash;

  const isDisconnected = previewWalletDisconnected ?? (walletStatus !== "connected");

  const validateEmail = (email: string) => {
    if (!email.trim()) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handlePayment = async () => {
    if (isDisconnected) {
      toast.error("Wallet not connected");
      return;
    }

    if (status !== EscrowStatusConst.PENDING && status !== "Active") {
      setInternalErrorMessage("Escrow is no longer payable");
      setInternalFormState("error");
      toast.error("Escrow is no longer payable");
      return;
    }

    if (sendReceipt) {
      if (!buyerEmail.trim() || !validateEmail(buyerEmail)) {
        setEmailError("Enter a valid email address.");
        return;
      }
    }
    setEmailError(null);

    try {
      setInternalFormState("loading");
      setInternalErrorMessage(null);

      const networkPassphrase =
        process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
        "Test SDF Network ; September 2015";

      const xdr = USE_MOCKS
        ? await mockFetchTransactionXdr(escrowId)
        : await buildFundingTransactionXdr({
            escrowId,
            escrowContractId,
            sourceAccount: publicKey ?? "",
            network: network === "mainnet" ? "PUBLIC" : "TESTNET",
          });

      const signedXdr = await signTransaction(xdr, networkPassphrase);

      const hash = USE_MOCKS
        ? await mockSubmitTransaction(signedXdr)
        : await submitTransaction(
            signedXdr,
            DEFAULT_SOROBAN_RPC_URL,
            networkPassphrase
          );

      if (sendReceipt && buyerEmail.trim()) {
        try {
          await patchBuyerContact(escrowId, {
            email: buyerEmail.trim(),
            emailReceipt: true,
          });
        } catch (contactErr) {
          console.error("Failed to update buyer contact email:", contactErr);
        }
      }

      setInternalTxHash(hash);
      setPaidAt(new Date().toISOString());
      setInternalFormState("success");
      toast.success(t("payment.confirmationTitle") || "Payment successful");
      onPaymentSuccess?.(hash);
    } catch (err: unknown) {
      console.error(err);
      let msg = "Network request failed";

      if (err instanceof Error) {
        if (err.message.toLowerCase().includes("reject") || err.message.toLowerCase().includes("cancel")) {
          msg = "Transaction was rejected in wallet";
        } else if (err.name === "TxFailed" || /txfailed|tx_failed/i.test(err.message)) {
          msg = `Transaction failed: ${parseContractError(err)}`;
        } else if (err.name === "TxExpired" || /txexpired|tx_expired/i.test(err.message)) {
          msg = `Transaction expired: ${parseContractError(err)}`;
        } else {
          msg = err.message;
        }
      } else if (typeof err === "string") {
        msg = err;
      }

      setInternalErrorMessage(msg);
      setInternalFormState("error");
      toast.error(msg);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!txHash) return;

    try {
      setIsDownloading(true);
      await generateReceiptPDF({
        escrowId,
        itemName,
        amount,
        protocolFee,
        total,
        txHash,
        timestamp: paidAt ?? undefined,
      });
    } catch (err) {
      console.error("Receipt download failed:", err);
      toast.error("Failed to generate receipt");
    } finally {
      setIsDownloading(false);
    }
  };

  const isSubmitting = formState === "loading";

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {t("payment.title") || "Payment Details"}
      </h2>

      <div className="mb-6 space-y-4">
        <div className="flex justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-400">{t("payment.item") || "Item Amount"}</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            XLM {amount}
          </span>
        </div>
        <div className="flex justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-400">{t("payment.platformFee", { percent: 1.5 }) || "Protocol Fee"}</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            XLM {protocolFee}
          </span>
        </div>
        <div className="flex justify-between pt-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t("payment.total") || "Total"}</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            XLM {total}
          </span>
        </div>
      </div>

      {formState === "success" && txHash ? (
        <div className="mt-6 rounded-2xl bg-green-50 p-4 border border-green-100 dark:bg-green-950/30 dark:border-green-900">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
            {t("payment.confirmationTitle") || "Payment successful"}
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            {t("payment.txHash") || "Transaction"}: {truncateHash(txHash)}
          </p>
          <a
            href={getStellarExpertTxUrl(txHash, network)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-green-700 underline hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            View on Stellar Expert
          </a>
          <button
            type="button"
            onClick={handleDownloadReceipt}
            disabled={isDownloading}
            aria-disabled={isDownloading}
            data-testid="download-receipt-btn"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-green-300 bg-white px-4 py-2.5 text-sm font-semibold text-green-800 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200 dark:hover:bg-green-900/40"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span aria-live="polite">Preparing receipt...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Receipt
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                id="receipt-opt-in"
                checked={sendReceipt}
                onChange={(e) => {
                  setSendReceipt(e.target.checked);
                  if (!e.target.checked) setEmailError(null);
                }}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <span>Send me a receipt</span>
            </label>

            {sendReceipt && (
              <div>
                <label htmlFor="buyer-email-input" className="sr-only">
                  Email address for receipt
                </label>
                <input
                  id="buyer-email-input"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => {
                    setBuyerEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="you@example.com"
                  required={sendReceipt}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "buyer-email-error" : undefined}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
                {emailError && (
                  <p id="buyer-email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {emailError}
                  </p>
                )}
              </div>
            )}
          </div>

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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePayment();
              }
            }}
            disabled={isDisconnected || isSubmitting}
            aria-disabled={isDisconnected || isSubmitting}
            className="flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span aria-live="polite">{t("payment.submitting") || "Processing payment..."}</span>
              </>
            ) : (
              t("payment.payNow") || "Pay with Freighter"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

