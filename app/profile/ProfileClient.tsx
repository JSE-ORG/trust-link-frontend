"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";

import { useSubscription } from "@/components/providers/SubscriptionProvider";
import useWallet from "@/hooks/useWallet";
import { EMPTY_LOCAL_PROFILE, readLocalProfile } from "@/lib/local-profile";

export default function ProfileClient() {
  const { publicKey, disconnect } = useWallet();
  const { plan, isPro, isLoading: planLoading } = useSubscription();

  const [profile, setProfile] = useState(EMPTY_LOCAL_PROFILE);
  const [copyStatus, setCopyStatus] = useState<"success" | "error" | null>(null);

  const publicProfileUrl = publicKey ? new URL(`/vendor/${publicKey}`, window.location.origin).toString() : null;

  useEffect(() => {
    try {
      const restored = readLocalProfile();
      startTransition(() => setProfile(restored));
    } catch {
      // Browser-local details are optional when site storage is unavailable.
    }
  }, []);

  const handleCopyPublicProfile = async () => {
    if (!publicKey || !publicProfileUrl) {
      return;
    }

    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(publicProfileUrl);
      setCopyStatus("success");
      window.setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-semibold text-zinc-950 dark:text-white">Profile</h1>
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <section aria-label="Browser-local profile" className="mb-6 space-y-3">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">Local shop details</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Saved only in this browser. These details do not update your public vendor profile.</p>
            <dl className="space-y-3">
              {([
                ["Business Name", profile.businessName],
                ["Display Name", profile.displayName],
                ["Contact Email", profile.email],
                ["Short Bio", profile.bio],
                ["Website", profile.website],
                ["Shipping Locations", profile.shippingLocations],
              ] as const).filter(([, value]) => value.trim()).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words text-sm text-zinc-950 dark:text-zinc-100">{value}</dd>
                </div>
              ))}
            </dl>
            {!profile.businessName && <p className="text-sm text-zinc-500">Complete onboarding or edit your settings to save shop details.</p>}
            <Link href="/settings/profile" className="inline-block rounded text-sm font-semibold text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400">Edit local shop details</Link>
          </section>
          {publicKey ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Wallet Address</p>
                <p className="mt-1 break-all font-mono text-sm text-zinc-950 dark:text-zinc-100">
                  {publicKey}
                </p>
              </div>

              {publicProfileUrl && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Public vendor profile</p>
                    <Link
                      href={`/vendor/${publicKey}`}
                      className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                    >
                      View
                    </Link>
                  </div>
                  <p className="mt-2 break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">{publicProfileUrl}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCopyPublicProfile}
                      className="rounded-2xl border border-blue-600 bg-transparent px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                      {copyStatus === "success" ? "Copied!" : "Copy profile link"}
                    </button>
                  </div>
                  {copyStatus === "error" && (
                    <p role="status" aria-live="polite" className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Clipboard access was unavailable.
                    </p>
                  )}
                </div>
              )}

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

              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Current Plan</p>
                {planLoading ? (
                  <div className="mt-2 h-7 w-16 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
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
    </div>
  );
}
