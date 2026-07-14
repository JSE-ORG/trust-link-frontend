import { Skeleton } from "@/components/ui/Skeleton";

export default function DisputeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <div className="w-full max-w-2xl space-y-4">
        <Skeleton className="mx-auto h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    </div>
  );
}
