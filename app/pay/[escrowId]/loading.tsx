import { Skeleton } from "@/components/ui/Skeleton";

export default function PayLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    </main>
  );
}
