"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import DashboardSection from "@/components/dashboard/DashboardSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { useWallet } from "@/components/providers/WalletProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { jwt } = useWallet();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!jwt) {
      router.push("/");
    } else {
      setIsChecking(false);
    }
  }, [jwt, router]);

  if (isChecking) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="mb-6 h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </main>
    );
  }

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
