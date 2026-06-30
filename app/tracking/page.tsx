export const metadata = {
  title: "Track Order | TrustLink",
  description: "Track your escrow order in real-time. Monitor shipment status, delivery confirmation, and payment release on the Stellar network.",
};

export default function TrackingPage() {
  // Redirect to a sample tracking page or show instructions
  // This page is kept for backward compatibility
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-semibold text-zinc-950 dark:text-white">
          Track Your Order
        </h1>
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="mb-4 text-lg text-zinc-600 dark:text-zinc-400">
            To track your order, please use the tracking link provided by your vendor.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            The tracking URL should look like: <span className="font-mono">/track/[escrowId]</span>
          </p>
        </div>
      </div>
    </main>
  );
}
