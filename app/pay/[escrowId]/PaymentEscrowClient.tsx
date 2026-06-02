"use client";

import { useMemo, useState } from "react";
import { Escrow } from "@/types";
import { TrustBadge } from "@/components/payment/TrustBadge";
import { useWallet } from "@/components/providers/WalletProvider";
import { connectFreighter, isFreighterInstalled } from "@/lib/stellar/freighter";
import { patchBuyerContact } from "@/lib/api";
import { formatUSDC } from "@/utils/currency";

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

function validateContact(email: string, phone: string): ContactErrors {
  const errors: ContactErrors = {};
  const e = email.trim();
  const p = phone.trim();

  if (!e && !p) {
    errors.base = "Please provide at least one contact method.";
    return errors;
  }
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    errors.email = "Enter a valid email address.";
  }
  if (p && !/^\+[1-9]\d{1,14}$/.test(p)) {
    errors.phone = "Enter a valid phone number in E.164 format (e.g. +12125551234).";
  }
  return errors;
}

export function PaymentEscrowClient({ escrow, escrowId }: PaymentEscrowClientProps) {
  const { connect, isLoading } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});

  const amount = escrow.amount;
  const fee = useMemo(() => Number(((amount * PLATFORM_FEE_PERCENT) / 100).toFixed(2)), [amount]);
  const total = useMemo(() => Number((amount + fee).toFixed(2)), [amount, fee]);
  const contractAddress = escrow.contractAddress ?? process.env.NEXT_PUBLIC_CONTRACT_ID ?? escrow.id;

  const isFunded = escrow.status === "FUNDED";
  const isExpired = escrow.status === "EXPIRED";

  const handlePayNow = async () => {
    setError(null);
    setSuccess(null);

    const errors = validateContact(email, phone);
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
      });

      const installed = await isFreighterInstalled();
      if (!installed) {
        setError("Freighter is not installed. Please install Freighter to continue.");
        return;
      }

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
            <dd className="max-w-55 truncate font-mono text-zinc-900 dark:text-zinc-100">
              {escrow.vendorId}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Amount</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{formatUSDC(amount)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-600 dark:text-zinc-400">Platform Fee ({PLATFORM_FEE_PERCENT}%)</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">{formatUSDC(fee)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-2 dark:border-zinc-800">
            <dt className="font-semibold text-zinc-900 dark:text-zinc-100">Total</dt>
            <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{formatUSDC(total)}</dd>
          </div>
        </dl>
      </div>

      <TrustBadge contractAddress={contractAddress} />

      {!isFunded ? (
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Where should we send your order updates?
          </h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Provide at least one contact method to receive shipping and delivery notifications.
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
                Email address <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                id="buyer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-invalid={Boolean(contactErrors.email)}
                aria-describedby={contactErrors.email ? "buyer-email-error" : undefined}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
              />
              {contactErrors.email ? (
                <p id="buyer-email-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {contactErrors.email}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="buyer-phone"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Phone number <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                id="buyer-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+12125551234"
                aria-invalid={Boolean(contactErrors.phone)}
                aria-describedby={contactErrors.phone ? "buyer-phone-error" : undefined}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
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
