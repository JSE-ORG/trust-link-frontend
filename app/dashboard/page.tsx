"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import DashboardSection from "@/components/dashboard/DashboardSection";
import { Skeleton } from "@/components/ui/Skeleton";
import NotificationBell from "@/components/notifications/NotificationBell";
import { BarChart3 } from "lucide-react";

function UpgradeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="mb-6 flex items-start justify-between gap-4 rounded-2xl bg-amber-50 px-5 py-4 dark:bg-amber-950/30"
    >
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Welcome to Pro!
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Your account has been upgraded. Enjoy unlimited escrows, the analytics
            dashboard, and priority support.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-amber-600 transition hover:bg-amber-100 dark:hover:bg-amber-900/40"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const didStrip = useRef(false);

  useEffect(() => {
    const storedJwt = window.localStorage.getItem("wallet.jwt");
    if (!storedJwt) {
      router.push("/");
    } else {
      const frame = window.requestAnimationFrame(() => setIsChecking(false));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [router]);

  useEffect(() => {
    if (searchParams.get("upgraded") === "1" && !didStrip.current) {
      didStrip.current = true;
      setShowUpgradeBanner(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

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
        {showUpgradeBanner && (
          <UpgradeBanner onDismiss={() => setShowUpgradeBanner(false)} />
        )}
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

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
