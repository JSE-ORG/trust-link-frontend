import type { Metadata } from "next";
import { Suspense } from "react";

import ErrorBoundary from "@/components/layout/ErrorBoundary";
import TrackingTimeline from "@/components/tracking/TrackingTimeline";
import TrackingTimelineSkeleton from "@/components/tracking/TrackingTimelineSkeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Skeleton } from "@/components/ui/Skeleton";
import { getEscrow } from "@/lib/api";
import { setEscrowContext } from "@/lib/logger";
import type { GetEscrowResponse } from "@/types/api";
import { formatUSDC } from "@/utils/currency";

interface TrackPageProps {
  params: Promise<{ escrowId: string }>;
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { escrowId } = await params;
  try {
    const escrow = await getEscrow(escrowId);
    return {
      title: `Track Order — ${escrow.item} | TrustLink`,
      description: `Real-time tracking for your ${escrow.item} order. Monitor escrow status, shipment, and payment release on the Stellar network.`,
    };
  } catch {
    return {
      title: "Track Order | TrustLink",
      description: "Track your escrow order and monitor shipment status on the Stellar network.",
    };
  }
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { escrowId } = await params;
  
  setEscrowContext(escrowId);

  // Fetch initial escrow data
  let initialEscrow: GetEscrowResponse;
  try {
    initialEscrow = await getEscrow(escrowId);
  } catch {
    return (
      <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
            <h1 className="mb-2 text-2xl font-semibold text-red-900 dark:text-red-100">
              Order Not Found
            </h1>
            <p className="text-red-700 dark:text-red-300">
              We couldn&apos;t find an order with ID: {escrowId}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <Breadcrumb
          className="mb-6"
          items={[
            { label: "Home", href: "/" },
            { label: "Track Order", href: "/tracking" },
            {
              label: `Order ${escrowId.length > 16 ? `${escrowId.slice(0, 16)}…` : escrowId}`,
            },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-white">
            Track Your Order
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Order ID: <span className="font-mono">{escrowId}</span>
          </p>
        </div>

        {/* Order Details Card */}
        <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            Order Details
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Item:</span>
              <span className="font-medium text-zinc-950 dark:text-zinc-100">
                {initialEscrow.item}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Amount:</span>
              <span className="font-medium text-zinc-950 dark:text-zinc-100">
                {formatUSDC(initialEscrow.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Status:</span>
              <span className="font-medium text-zinc-950 dark:text-zinc-100">
                {initialEscrow.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <ErrorBoundary>
          <Suspense
            fallback={
              /* Timeline skeleton reserves the correct vertical space so the
                 page height never jumps when the real timeline mounts (CLS = 0). */
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <Skeleton className="mb-6 h-5 w-1/3" />
                <TrackingTimelineSkeleton />
              </div>
            }
          >
            <TrackingTimeline escrowId={escrowId} initialEscrow={initialEscrow} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </main>
  );
}
