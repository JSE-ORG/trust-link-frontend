import type { Metadata } from "next";
import { Suspense } from "react";

import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing | TrustLink",
  description:
    "Simple, transparent pricing. Start free and upgrade when you're ready to grow with TrustLink escrow.",
};

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        /* Pricing skeleton — reserves the two-column card layout
           so there is no height jump when PricingClient mounts. */
        <main className="min-h-screen bg-zinc-50 px-6 py-12 dark:bg-black">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <div className="mx-auto mb-3 h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mx-auto h-10 w-80 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mx-auto mt-4 h-5 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="mb-6 space-y-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-10 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-4 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                  <div className="mb-8 flex-1 space-y-3">
                    {[...Array(6)].map((_, j) => (
                      <div key={j} className="h-5 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    ))}
                  </div>
                  <div className="h-12 w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
                </div>
              ))}
            </div>
          </div>
        </main>
      }
    >
      <PricingClient />
    </Suspense>
  );
}
