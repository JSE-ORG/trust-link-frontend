import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminDisputesLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    </main>
  );
}
