"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import DashboardSection from "@/components/dashboard/DashboardSection";
import { Skeleton } from "@/components/ui/Skeleton";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function DashboardPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const storedJwt = window.localStorage.getItem("wallet.jwt");
    if (!storedJwt) {
      router.push("/");
    } else {
      setIsChecking(false);
    }
  }, [router]);

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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-white">Dashboard</h1>
          <NotificationBell />
        </div>
        <ErrorBoundary>
          <DashboardSection />
        </ErrorBoundary>
      </div>
    </main>
  );
}
