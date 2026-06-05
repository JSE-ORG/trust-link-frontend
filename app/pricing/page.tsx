"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Sparkles, X } from "lucide-react";
import { upgradeSubscription } from "@/lib/api";
import { clearSubscriptionCache, useSubscription } from "@/components/providers/SubscriptionProvider";

const FREE_FEATURES = [
  { label: "Up to 10 escrows per month", included: true },
  { label: "Escrow management dashboard", included: true },
  { label: "In-app & email notifications", included: true },
  { label: "Public vendor profile", included: true },
  { label: "Basic shipment tracking", included: true },
  { label: "Analytics dashboard", included: false },
  { label: "Unlimited escrows", included: false },
  { label: "Advanced reports & exports", included: false },
  { label: "Priority support", included: false },
  { label: "Early access to new features", included: false },
];

const PRO_FEATURES = [
  { label: "Everything in Free", included: true },
  { label: "Unlimited escrows", included: true },
  { label: "Analytics dashboard", included: true },
  { label: "Advanced reports & exports", included: true },
  { label: "Priority support", included: true },
  { label: "Early access to new features", included: true },
];

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <li className="flex items-center gap-3">
      {included ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        </span>
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <X className="h-3 w-3 text-zinc-400" />
        </span>
      )}
      <span
        className={`text-sm ${
          included
            ? "text-zinc-700 dark:text-zinc-300"
            : "text-zinc-400 dark:text-zinc-600"
        }`}
      >
        {label}
      </span>
    </li>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const { isPro, isLoading, refetch } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    const token =
      typeof window !== "undefined"
        ? (localStorage.getItem("wallet.jwt") ?? undefined)
        : undefined;

    if (!token) {
      router.push("/");
      return;
    }

    setIsUpgrading(true);
    setError(null);

    try {
      await upgradeSubscription(token);
      clearSubscriptionCache();
      await refetch();
      router.push("/dashboard?upgraded=1");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upgrade failed. Please try again."
      );
    } finally {
      setIsUpgrading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-500">
            Plans & Pricing
          </p>
          <h1 className="text-4xl font-bold text-zinc-950 dark:text-white">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400">
            Start free. Upgrade when you're ready to grow.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Free
              </p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-bold text-zinc-950 dark:text-white">
                  $0
                </span>
                <span className="mb-1 text-sm text-zinc-400">/month</span>
              </div>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Perfect for getting started with escrow payments.
              </p>
            </div>

            <ul className="mb-8 flex flex-1 flex-col gap-3">
              {FREE_FEATURES.map((f) => (
                <FeatureRow key={f.label} {...f} />
              ))}
            </ul>

            {isPro ? (
              <div className="rounded-2xl border border-zinc-200 px-4 py-3 text-center text-sm text-zinc-400 dark:border-zinc-800">
                Your current plan
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                Current plan
              </div>
            )}
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-3xl border-2 border-amber-400 bg-white p-8 shadow-lg dark:border-amber-500 dark:bg-zinc-950">
            {/* Popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1 text-xs font-bold text-white shadow-sm">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-500">
                Pro
              </p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-bold text-zinc-950 dark:text-white">
                  $19
                </span>
                <span className="mb-1 text-sm text-zinc-400">/month</span>
              </div>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                For growing vendors who need advanced tools.
              </p>
            </div>

            <ul className="mb-8 flex flex-1 flex-col gap-3">
              {PRO_FEATURES.map((f) => (
                <FeatureRow key={f.label} {...f} />
              ))}
            </ul>

            {error && (
              <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {isPro ? (
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                ✓ Active plan
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isUpgrading || isLoading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpgrading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Upgrading…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Upgrade to Pro
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="mt-16">
          <h2 className="mb-6 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Full feature comparison
          </h2>
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-4 text-left font-semibold text-zinc-700 dark:text-zinc-300">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-zinc-700 dark:text-zinc-300">
                    Free
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-amber-500">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[
                  ["Escrow creation", true, true],
                  ["Escrow management", true, true],
                  ["Monthly escrow limit", "10/mo", "Unlimited"],
                  ["In-app notifications", true, true],
                  ["Email notifications", true, true],
                  ["Basic shipment tracking", true, true],
                  ["Public vendor profile", true, true],
                  ["Analytics dashboard", false, true],
                  ["Advanced reports", false, true],
                  ["Data export (CSV)", false, true],
                  ["Priority support", false, true],
                  ["Early access features", false, true],
                ].map(([feature, free, pro]) => (
                  <tr key={String(feature)} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                      {feature}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof free === "boolean" ? (
                        free ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                        )
                      ) : (
                        <span className="text-zinc-500">{free}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof pro === "boolean" ? (
                        pro ? (
                          <Check className="mx-auto h-4 w-4 text-amber-500" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                        )
                      ) : (
                        <span className="font-medium text-amber-500">{pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Questions?{" "}
            <Link
              href="/dashboard"
              className="font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              Back to dashboard
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
