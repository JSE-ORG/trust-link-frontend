import { Skeleton } from "@/components/ui/Skeleton";

/** Displays placeholder rows while notification data is loading. */
export function NotificationsSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label="Loading notifications">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}