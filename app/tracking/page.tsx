import ErrorBoundary from "@/components/layout/ErrorBoundary";
import TrackingTimeline from "@/components/tracking/TrackingTimeline";

export default function TrackingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-semibold text-zinc-950 dark:text-white">Tracking</h1>
        <ErrorBoundary>
          <TrackingTimeline />
        </ErrorBoundary>
      </div>
    </main>
  );
}
