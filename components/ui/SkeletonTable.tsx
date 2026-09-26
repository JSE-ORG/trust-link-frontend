import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export interface SkeletonTableProps {
  /** Number of skeleton rows to render. */
  rows?: number;
  /** Number of skeleton columns to render. */
  columns?: number;
  /** Optional heading row label rendered above the table. */
  title?: string;
  /** Extra classes for the wrapping container. */
  className?: string;
}

/**
 * A table-shaped loading skeleton used by dashboard `loading.tsx` files.
 *
 * Renders a header row of skeleton bars followed by `rows` body rows, each
 * containing `columns` skeleton cells. The whole block is wrapped in a
 * `role="status"` / `aria-live="polite"` region so screen-reader users are
 * informed that content is still loading.
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  title,
  className,
}: SkeletonTableProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading table data"
      className={cn("space-y-4", className)}
    >
      {title ? (
        <Skeleton className="h-7 w-48" data-testid="skeleton-table-title" />
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        {/* Header row */}
        <div className="flex gap-4 border-b border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton
              key={`skeleton-header-${col}`}
              className="h-4 flex-1"
              data-testid={`skeleton-header-${col}`}
            />
          ))}
        </div>

        {/* Body rows */}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {Array.from({ length: rows }).map((_, row) => (
            <div
              key={`skeleton-row-${row}`}
              className="flex gap-4 p-4"
              data-testid={`skeleton-row-${row}`}
            >
              {Array.from({ length: columns }).map((_, col) => (
                <Skeleton
                  key={`skeleton-cell-${row}-${col}`}
                  className="h-4 flex-1"
                  data-testid={`skeleton-cell-${row}-${col}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}