import ErrorBoundary from "@/components/layout/ErrorBoundary";
import DashboardSection from "@/components/dashboard/DashboardSection";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-semibold text-zinc-950 dark:text-white">Dashboard</h1>
        <ErrorBoundary>
          <DashboardSection />
        </ErrorBoundary>
      </div>
    </main>
  );
}
