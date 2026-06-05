import { Skeleton } from "@/components/ui/Skeleton";

export default function VendorAnalyticsSkeleton() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(123,104,238,0.10),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] p-4 pb-24 sm:p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(123,104,238,0.14),_transparent_30%),linear-gradient(180deg,_#050505_0%,_#0a0a0a_100%)]">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-28" />
              <Skeleton className="mt-2 h-4 w-20" />
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
          <Skeleton className="mt-6 h-72 w-full rounded-[1.75rem]" />
        </div>
      </div>
    </main>
  );
}
