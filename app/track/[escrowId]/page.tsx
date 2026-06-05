import * as Sentry from "@sentry/nextjs";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import TrackingTimeline from "@/components/tracking/TrackingTimeline";
import { getEscrow } from "@/lib/api";
import { formatUSDC } from "@/utils/currency";

interface TrackPageProps {
  params: Promise<{ escrowId: string }>;
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { escrowId } = await params;
  
  Sentry.setTag("escrow.id", escrowId);
  Sentry.setContext("tracking", { escrowId });
  
  // Fetch initial escrow data
  let initialEscrow;
  try {
    initialEscrow = await getEscrow(escrowId);
  } catch (error) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
            <h1 className="mb-2 text-2xl font-semibold text-red-900 dark:text-red-100">
              Order Not Found
            </h1>
            <p className="text-red-700 dark:text-red-300">
              We couldn't find an order with ID: {escrowId}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
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
          <TrackingTimeline escrowId={escrowId} initialEscrow={initialEscrow} />
        </ErrorBoundary>
      </div>
    </main>
  );
}
