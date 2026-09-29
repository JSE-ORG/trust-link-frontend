import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonTable } from "@/components/ui/SkeletonTable";

/**
 * Next.js streaming loading UI for the admin disputes route.
 *
 * Shown automatically by the App Router while `app/admin/disputes/page.tsx`
 * (and its nested `DisputesListClient`) are loading data. The skeleton
 * mirrors the real layout — a heading, a sort control, and a list of dispute
 * cards — so layout shift is minimised.
 */
export default function AdminDisputesLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Heading + sort control */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>

        {/* Dispute cards skeleton */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <SkeletonTable rows={4} columns={3} />
        </div>
      </div>
    </main>
  );
}