"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import DashboardSection from "@/components/dashboard/DashboardSection";
import { Skeleton } from "@/components/ui/Skeleton";
import NotificationBell from "@/components/notifications/NotificationBell";
import { BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const storedJwt = window.localStorage.getItem("wallet.jwt");
    if (!storedJwt) {
      router.push("/");
    } else {
      const frame = window.requestAnimationFrame(() => setIsChecking(false));
      return () => window.cancelAnimationFrame(frame);
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-zinc-950 dark:text-white">Dashboard</h1>
            <Link
              href="/dashboard/analytics"
              className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:inline-flex"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          </div>
          <NotificationBell />
        </div>
        <ErrorBoundary>
          <DashboardSection />
        </ErrorBoundary>
      </div>
    </main>
  );
}
