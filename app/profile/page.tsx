"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useWallet } from "@/components/providers/WalletProvider";
import { useSubscription } from "@/components/providers/SubscriptionProvider";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfilePage() {
  const { publicKey, disconnect } = useWallet();
  const { plan, isPro, isLoading: planLoading } = useSubscription();

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-semibold text-zinc-950 dark:text-white">Profile</h1>
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {publicKey ? (
            <div className="space-y-6">
              {/* Wallet address */}
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Wallet Address</p>
                <p className="mt-1 break-all font-mono text-sm text-zinc-950 dark:text-zinc-100">
                  {publicKey}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/settings/profile"
                  className="inline-block rounded-2xl border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Edit Profile Settings
                </Link>
                <button
                  onClick={disconnect}
                  className="rounded-2xl border-2 border-red-600 bg-transparent px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950"
                >
                  Disconnect Wallet
                </button>
              </div>

              {/* Plan */}
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Current Plan</p>
                {planLoading ? (
                  <Skeleton
                    className="mt-2 h-7 w-16 rounded-full"
                    role="status"
                    aria-live="polite"
                    aria-label="Loading current plan"
                  />
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    {isPro ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        <Sparkles className="h-3 w-3" />
                        Pro
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {plan}
                      </span>
                    )}
                    {!isPro && (
                      <Link
                        href="/pricing"
                        className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
                      >
                        <Sparkles className="h-3 w-3" />
                        Upgrade to Pro
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={disconnect}
                className="rounded-2xl border-2 border-red-600 bg-transparent px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950"
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <p className="text-zinc-600 dark:text-zinc-400">No wallet connected.</p>
          )}
        </div>
      </div>
    </main>
  );
}
