"use client";

import { Download, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import EscrowCountdown from "@/components/payment/EscrowCountdown";
import { buildFundingTransactionXdr, submitTransaction } from "@/components/payment/PaymentForm";
import { TrustBadge } from "@/components/payment/TrustBadge";
import { useNetwork } from "@/components/providers/NetworkProvider";
import TrackingTimelineSkeleton from "@/components/tracking/TrackingTimelineSkeleton";
import useWallet from "@/hooks/useWallet";
import { patchBuyerContact } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { generateReceiptPDF } from "@/lib/pdf";
import { isValidContractId } from "@/lib/stellar/contract";
import { connectFreighter, isFreighterInstalled, signTransaction } from "@/lib/stellar/freighter";
import { Escrow, EscrowStatusConst } from "@/types";
import { formatUSDC } from "@/utils/currency";

const TrackingTimeline = dynamic(
  () => import("@/components/escrow/TrackingTimeline"),
  { loading: () => <TrackingTimelineSkeleton />, ssr: false }
);

interface PaymentEscrowClientProps {
  escrow: Escrow;
  escrowId: string;
}

const PLATFORM_FEE_PERCENT = 1.5;



interface ContactErrors {
  base?: string;
  email?: string;
  phone?: string;
}

function validateContact(t: (key: string) => string, email: string, phone: string): ContactErrors {
  const errors: ContactErrors = {};
  const e = email.trim();
  const p = phone.trim();

  if (!e && !p) {
    errors.base = t("payment.contactErrorBase");
    return errors;
  }
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    errors.email = t("payment.contactErrorEmail");
  }
  if (p && !/^\+[1-9]\d{1,14}$/.test(p)) {
    errors.phone = t("payment.contactErrorPhone");
  }
  return errors;
}

export function PaymentEscrowClient({ escrow, escrowId }: PaymentEscrowClientProps) {
  const { t } = useTranslation();
  const { connect, isLoading, publicKey } = useWallet();
  const { config, network } = useNetwork();
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailReceipt, setEmailReceipt] = useState(true);
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [hasExpired, setHasExpired] = useState(false);
  const [paymentStage, setPaymentStage] = useState<"idle" | "authenticating" | "submitting" | "settled">("idle");
  const [isDownloading, setIsDownloading] = useState(false);

  const amount = escrow.amount;
  const fee = useMemo(() => Number(((amount * PLATFORM_FEE_PERCENT) / 100).toFixed(2)), [amount]);
  const total = useMemo(() => Number((amount + fee).toFixed(2)), [amount, fee]);
  const escrowAddress = escrow.contractAddress?.trim() ?? "";
  const configuredAddress = process.env.NEXT_PUBLIC_CONTRACT_ID?.trim() ?? "";
  const contractAddress = isValidContractId(escrowAddress)
    ? escrowAddress
    : isValidContractId(configuredAddress) ? configuredAddress : null;

  const isFunded = escrow.status === EscrowStatusConst.FUNDED;
  // The countdown can expire the escrow client-side before the backend status
  // catches up, so either signal blocks funding.
  const isExpired = escrow.status === EscrowStatusConst.EXPIRED ||
    (escrow.status === EscrowStatusConst.PENDING && hasExpired);
  const isPayable = escrow.status === EscrowStatusConst.PENDING && !isExpired;
  const statusMessages: Partial<Record<Escrow["status"], string>> = {
    SHIPPED: "payment.alreadyShipped",
    COMPLETED: "payment.alreadyCompleted",
    RELEASED: "payment.alreadyReleased",
    REFUNDED: "payment.alreadyRefunded",
    DISPUTED: "payment.alreadyDisputed",
  };
  const statusMessage = statusMessages[escrow.status];

  const handleExpire = useCallback(() => setHasExpired(true), []);

  const handleDownloadReceipt = async () => {
    if (!txHash || isDownloading) return;

    setIsDownloading(true);
    try {
      await generateReceiptPDF(
        {
          escrowId,
          itemName: escrow.item,
          amount,
          protocolFee: fee,
          total,
          buyerContact: [email.trim(), phone.trim()].filter(Boolean).join(" / "),
          txHash,
        },
        `receipt-${escrowId}.pdf`
      );
      toast.success("Receipt download started");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to generate receipt";
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePayNow = async () => {
    // Recheck the deadline at invocation: the countdown may not have ticked yet.
    if (!isPayable) return;
    if (escrow.expiresAt && Date.parse(escrow.expiresAt) <= Date.now()) {
      handleExpire();
      return;
    }

    setError(null);
    setSuccess(null);
    setTxHash(null);

    const errors = validateContact(t, email, phone);
    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      if (errors.email || errors.base) {
        document.getElementById("buyer-email")?.focus();
      } else if (errors.phone) {
        document.getElementById("buyer-phone")?.focus();
      }
      return;
    }
    setContactErrors({});
    setIsPaying(true);
    setPaymentStage("authenticating");

    try {
      await patchBuyerContact(escrowId, {
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        emailReceipt: email.trim() ? emailReceipt : undefined,
      });

      const installed = await isFreighterInstalled();
      if (!installed) {
        setError(t("payment.freighterNotInstalled"));
        return;
      }

      await connectFreighter();
      const walletConnected = await connect();
      if (!walletConnected) {
        setPaymentStage("idle");
        return;
      }

      const sourceAccount = publicKey ?? (await connectFreighter());
      if (!sourceAccount || !contractAddress) {
        throw new Error(t("payment.contractUnavailable") || "Escrow contract is unavailable");
      }

      setPaymentStage("submitting");
      const xdr = await buildFundingTransactionXdr({
        escrowId,
        escrowContractId: contractAddress,
        sourceAccount,
        network: network === "mainnet" ? "PUBLIC" : "TESTNET",
      });
      const signedXdr = await signTransaction(xdr, config.networkPassphrase);
      const hash = await submitTransaction(signedXdr, config.rpcUrl, config.networkPassphrase);

      setTxHash(hash);
      setPaymentStage("settled");
      setSuccess(`${t("payment.confirmationTitle") || "Payment successful"} — ${hash}`);
      toast.success(t("payment.confirmationTitle") || "Payment successful");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t("payment.walletSignatureError");
      setError(message);
      setPaymentStage("idle");
      toast.error(message);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-100">{t("payment.completeTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("payment.escrowIdPrefix", { id: escrowId })}</p>
      </header>

      {escrow.expiresAt && (escrow.status === EscrowStatusConst.PENDING || escrow.status === EscrowStatusConst.EXPIRED) && (
        <EscrowCountdown
          expiresAt={escrow.expiresAt}
          onExpire={handleExpire}
          forceExpired={escrow.status === EscrowStatusConst.EXPIRED}
        />
      )}

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">{t("payment.orderDetailsTitle")}</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">{t("payment.item")}</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{escrow.item}</dd>
          </div>
          {escrow.description && (
            <div className="flex flex-col gap-2">
              <dt className="text-zinc-600 dark:text-zinc-400">{t("payment.description")}</dt>
              <dd 
                className="text-sm text-zinc-700 dark:text-zinc-300"
                dangerouslySetInnerHTML={renderMarkdown(escrow.description)}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">{t("payment.vendorAddress")}</dt>
            <dd className="max-w-55 truncate font-mono text-zinc-900 dark:text-zinc-100">
              {escrow.vendorId}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">{t("payment.amount")}</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{formatUSDC(amount)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">
              {t("payment.platformFee", { percent: PLATFORM_FEE_PERCENT })}
            </dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{formatUSDC(fee)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-2 dark:border-zinc-800">
            <dt className="font-semibold text-zinc-900 dark:text-zinc-100">{t("payment.total")}</dt>
            <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{formatUSDC(total)}</dd>
          </div>
        </dl>
      </div>

      {contractAddress ? (
        <TrustBadge contractAddress={contractAddress} />
      ) : (
        <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {t("payment.contractUnavailable")}
        </div>
      )}

      {isPayable ? (
        <fieldset className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800" aria-describedby="contact-desc">
          <legend className="mb-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {t("payment.contactPromptTitle")}
          </legend>
          <p id="contact-desc" className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            {t("payment.contactPromptDesc")}
          </p>
          {contactErrors.base ? (
            <p id="contact-base-error" role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{contactErrors.base}</p>
          ) : null}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="buyer-email"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("payment.emailLabel")} <span className="font-normal text-zinc-400">{t("payment.optional")}</span>
              </label>
              <input
                id="buyer-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setContactErrors((prev) => ({ ...prev, email: undefined, base: undefined }));
                }}
                placeholder="you@example.com"
                aria-required="false"
                aria-invalid={Boolean(contactErrors.email || (contactErrors.base && !email.trim()))}
                aria-describedby={[
                  contactErrors.base ? "contact-base-error" : undefined,
                  contactErrors.email ? "buyer-email-error" : undefined,
                  "contact-desc",
                ].filter(Boolean).join(" ") || undefined}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus-visible:ring-zinc-300"
              />
              {contactErrors.email ? (
                <p id="buyer-email-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {contactErrors.email}
                </p>
              ) : null}
              {email.trim() && (
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={emailReceipt}
                    onChange={(e) => setEmailReceipt(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {t("payment.sendEmailReceipt")}
                  </span>
                </label>
              )}
            </div>
            <div>
              <label
                htmlFor="buyer-phone"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("payment.phoneLabel")} <span className="font-normal text-zinc-400">{t("payment.optional")}</span>
              </label>
              <input
                id="buyer-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setContactErrors((prev) => ({ ...prev, phone: undefined, base: undefined }));
                }}
                placeholder="+12125551234"
                aria-required="false"
                aria-invalid={Boolean(contactErrors.phone || (contactErrors.base && !phone.trim()))}
                aria-describedby={[
                  contactErrors.base ? "contact-base-error" : undefined,
                  contactErrors.phone ? "buyer-phone-error" : undefined,
                  "contact-desc",
                ].filter(Boolean).join(" ") || undefined}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus-visible:ring-zinc-300"
              />
              {contactErrors.phone ? (
                <p id="buyer-phone-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {contactErrors.phone}
                </p>
              ) : null}
            </div>
          </div>
        </fieldset>
      ) : null}

      {isFunded ? (
        <>
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {t("payment.alreadyFunded")}
          </div>
          <div>
            <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {t("payment.shipmentTracking")}
            </h2>
            <TrackingTimeline currentStage="ORDER_PLACED" />
          </div>
        </>
      ) : null}
      {statusMessage ? (
        <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {t(statusMessage)}
        </div>
      ) : null}
      {isExpired ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {t("payment.expiredMessage")}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          <p className="font-medium">{t("payment.confirmationTitle") || "Payment successful"}</p>
          {txHash ? (
            <>
              <p className="mt-1 break-all font-mono text-xs">
                {txHash}
              </p>
              {paymentStage === "settled" ? (
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  disabled={isDownloading}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span aria-live="polite">Preparing receipt...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Receipt PDF
                    </>
                  )}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handlePayNow}
        disabled={isPaying || isLoading || !isPayable || paymentStage !== "idle"}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPaying || isLoading ? (
          paymentStage === "submitting" ? (t("payment.submitting") || "Submitting escrow funds...") : t("payment.waitingForFreighter")
        ) : (
          t("payment.payNow")
        )}
      </button>
    </section>
  );
}
