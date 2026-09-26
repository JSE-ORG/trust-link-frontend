"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import EscrowCountdown from "@/components/payment/EscrowCountdown";
import { TrustBadge } from "@/components/payment/TrustBadge";
import TrackingTimelineSkeleton from "@/components/tracking/TrackingTimelineSkeleton";
import useWallet from "@/hooks/useWallet";
import { patchBuyerContact } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { connectFreighter, isFreighterInstalled } from "@/lib/stellar/freighter";
import { Escrow, EscrowStatusConst } from "@/types";
import { formatUSDC } from "@/utils/currency";

const TrackingTimeline = dynamic(
  () => import("@/components/escrow/TrackingTimeline"),
  { loading: () => <TrackingTimelineSkeleton />, ssr: false }
);
import { toast } from "sonner";

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
  const { connect, isLoading } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailReceipt, setEmailReceipt] = useState(true);
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [hasExpired, setHasExpired] = useState(false);

  const amount = escrow.amount;
  const fee = useMemo(() => Number(((amount * PLATFORM_FEE_PERCENT) / 100).toFixed(2)), [amount]);
  const total = useMemo(() => Number((amount + fee).toFixed(2)), [amount, fee]);
  const contractAddress = escrow.contractAddress ?? process.env.NEXT_PUBLIC_CONTRACT_ID ?? escrow.id;

  const isFunded = escrow.status === EscrowStatusConst.FUNDED;
  // The countdown can expire the escrow client-side before the backend status
  // catches up, so either signal blocks funding.
  const isExpired = escrow.status === EscrowStatusConst.EXPIRED || hasExpired;

  const handleExpire = useCallback(() => setHasExpired(true), []);

  const handlePayNow = async () => {
    setError(null);
    setSuccess(null);

    const errors = validateContact(t, email, phone);
    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }
    setContactErrors({});
    setIsPaying(true);

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
      if (!walletConnected) return;
      setSuccess(t("payment.signatureCompleted"));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t("payment.walletSignatureError");
      setError(message);
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

      {escrow.expiresAt && !isFunded && (
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
              <dt className="text-zinc-600 dark:text-zinc-400">Description</dt>
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

      <TrustBadge contractAddress={contractAddress} />

      {!isFunded ? (
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {t("payment.contactPromptTitle")}
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            {t("payment.contactPromptDesc")}
          </p>
          {contactErrors.base ? (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">{contactErrors.base}</p>
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-invalid={Boolean(contactErrors.email)}
                aria-describedby={contactErrors.email ? "buyer-email-error" : undefined}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus-visible:ring-zinc-300"
              />
              {contactErrors.email ? (
                <p id="buyer-email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
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
                    Send receipt to this email
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
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+12125551234"
                aria-invalid={Boolean(contactErrors.phone)}
                aria-describedby={contactErrors.phone ? "buyer-phone-error" : undefined}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 dark:focus-visible:ring-zinc-300"
              />
              {contactErrors.phone ? (
                <p id="buyer-phone-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {contactErrors.phone}
                </p>
              ) : null}
            </div>
          </div>
        </div>
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
          {success}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handlePayNow}
        disabled={isPaying || isLoading || isFunded || isExpired}
        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPaying || isLoading ? t("payment.waitingForFreighter") : t("payment.payNow")}
      </button>
    </section>
  );
}
