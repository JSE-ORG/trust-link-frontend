import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonTable } from "@/components/ui/SkeletonTable";

/**
 * Next.js streaming loading UI for the vendor dashboard route.
 *
 * Shown automatically by the App Router while `app/dashboard/page.tsx` (and
 * its nested `DashboardSection` / `VendorDashboardList`) are loading data.
 * The skeleton mirrors the real layout — a heading row, a card wrapper, and
 * a table of escrow rows — so layout shift is minimised.
 */
export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Heading */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>

        {/* Card wrapper */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Filter bar skeleton */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full max-w-xs rounded-full" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-36 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </div>

          {/* Status tabs skeleton */}
          <div className="mb-6 flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`tab-${i}`} className="h-8 w-24 rounded-full" />
            ))}
          </div>

          {/* Escrow table skeleton */}
          <SkeletonTable rows={4} columns={3} />
        </div>
      </div>
    </main>
  );
}